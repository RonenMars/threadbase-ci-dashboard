import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

/**
 * Validated environment variables. Importing this module throws at startup with
 * the offending variable names if anything is missing, instead of failing later
 * inside a driver (e.g. `neon()` throwing during a Vercel prerender).
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(1),
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    WEBHOOK_SECRET: z.string().min(1),
    GITHUB_REPO: z.string().regex(/^[^/]+\/[^/]+$/, "expected owner/repo"),
    GITHUB_WORKFLOW_ID: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_WORKFLOW_ID: process.env.GITHUB_WORKFLOW_ID,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  emptyStringAsUndefined: true,
})
