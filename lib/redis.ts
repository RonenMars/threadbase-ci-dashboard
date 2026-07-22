import { Redis } from "@upstash/redis"
import { env } from "@/lib/env"

export const EVENTS_KEY = "ci:events"
export const EVENTS_MAX = 100
export const EVENTS_TTL = 86400 // 24h

/**
 * Redis is optional: until Upstash is provisioned, the webhook and SSE routes
 * degrade gracefully (the history page still works via getRuns + polling).
 * `getRedis()` returns null when the env vars are absent so callers can no-op.
 */
let client: Redis | null = null

export function getRedis(): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null
  client ??= new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
  return client
}
