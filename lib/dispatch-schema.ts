import { z } from "zod"

/**
 * Kept separate from lib/github.ts so that validating dispatch inputs (client
 * components, tests) does not pull in the server-only database client.
 */
export const dispatchInputsSchema = z.object({
  deploy_ref: z.string().min(1),
  platform: z.enum(["ios", "android", "all"]),
  target: z.enum(["testflight", "production"]),
  android_track: z.enum(["alpha", "internal", "beta", "production"]),
  release_notes: z.string().optional(),
})

export type DispatchInputs = z.infer<typeof dispatchInputsSchema>
