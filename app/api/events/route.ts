import { auth } from "@/lib/auth"
import { getRedis, EVENTS_KEY } from "@/lib/redis"

const POLL_INTERVAL_MS = 2000
const MAX_DURATION_MS = 25_000

type StoredEvent = { ts: number; data: unknown }

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const lastEventId = req.headers.get("last-event-id") ?? "0"
  let lastSeen = Number(lastEventId)

  const redis = getRedis()
  const encoder = new TextEncoder()
  const deadline = Date.now() + MAX_DURATION_MS

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string, id?: number) => {
        if (id !== undefined) {
          controller.enqueue(encoder.encode(`id: ${id}\n`))
        }
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      send("connected")

      // No Redis yet: hold the connection open briefly then close so the client
      // falls back to polling /api/runs without a tight reconnect loop.
      if (!redis) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
        controller.close()
        return
      }

      while (Date.now() < deadline) {
        const raw = await redis.lrange<StoredEvent>(EVENTS_KEY, 0, 49)
        const events = raw
          // @upstash/redis auto-deserializes JSON, so entries are already
          // objects; guard against a raw string in case that ever changes.
          .map((r) => (typeof r === "string" ? (JSON.parse(r) as StoredEvent) : r))
          .filter((e) => e.ts > lastSeen)
          .sort((a, b) => a.ts - b.ts)

        for (const evt of events) {
          send(JSON.stringify(evt.data), evt.ts)
          lastSeen = evt.ts
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
