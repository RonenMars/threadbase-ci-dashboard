import { validateGitHubSignature } from "@/lib/webhook"
import { getRedis, eventsKey, EVENTS_MAX, EVENTS_TTL } from "@/lib/redis"
import { projectIdForRepo } from "@/lib/projects"
import { env } from "@/lib/env"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("x-hub-signature-256") ?? ""

  if (!validateGitHubSignature(body, sig, env.WEBHOOK_SECRET)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const event = req.headers.get("x-github-event")
  if (event !== "workflow_run") return new Response("OK")

  const redis = getRedis()
  if (!redis) return new Response("OK") // Redis not provisioned yet — no-op

  const payload = JSON.parse(body)

  // Route the event to its project's list; ignore repos not in the registry.
  const projectId = projectIdForRepo(payload.repository?.full_name ?? "")
  if (!projectId) return new Response("OK")

  const run = payload.workflow_run
  const entry = JSON.stringify({
    ts: Date.now(),
    data: {
      id: run.id as number,
      name: run.name as string,
      status: run.status as string,
      conclusion: run.conclusion as string | null,
      head_branch: run.head_branch as string,
      html_url: run.html_url as string,
      created_at: run.created_at as string,
      updated_at: run.updated_at as string,
      run_number: run.run_number as number,
      actor: (run.triggering_actor?.login ?? null) as string | null,
    },
  })

  const key = eventsKey(projectId)
  await redis.lpush(key, entry)
  await redis.ltrim(key, 0, EVENTS_MAX - 1)
  await redis.expire(key, EVENTS_TTL)

  return new Response("OK")
}
