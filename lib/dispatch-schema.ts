import { z } from "zod"
import { STREAMER_DEPLOYMENT_ENV_VALUES } from "@/lib/project-options"

/**
 * Kept separate from lib/github.ts so that validating dispatch inputs (client
 * components, tests) does not pull in the server-only database client.
 *
 * Each deployable project has its own input schema — tb-mobile's five-field
 * Fastlane form vs. tb-streamer's publish toggle. The projects registry
 * (lib/projects.ts) picks the schema per project id.
 */
export const mobileDispatchSchema = z.object({
  deploy_ref: z.string().min(1),
  platform: z.enum(["ios", "android", "all"]),
  target: z.enum(["testflight", "production"]),
  android_track: z.enum(["alpha", "internal", "beta", "production"]),
  release_notes: z.string().optional(),
})

export const streamerDispatchSchema = z.object({
  deploy_ref: z.string().min(1),
  deployment_env: z.enum(STREAMER_DEPLOYMENT_ENV_VALUES),
  publish: z.boolean(),
})

export type MobileDispatchInputs = z.infer<typeof mobileDispatchSchema>
export type StreamerDispatchInputs = z.infer<typeof streamerDispatchSchema>
export type DispatchInputs = MobileDispatchInputs | StreamerDispatchInputs
