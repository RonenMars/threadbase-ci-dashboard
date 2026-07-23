import { z } from "zod"
import { env } from "@/lib/env"
import type { ProjectId } from "@/lib/project-options"
import {
  mobileDispatchSchema,
  streamerDispatchSchema,
} from "@/lib/dispatch-schema"
import type {
  MobileDispatchInputs,
  StreamerDispatchInputs,
} from "@/lib/dispatch-schema"

/**
 * Registry of deployable projects. The two repos have different deploy models
 * (tb-mobile → App/Play Store via Fastlane; tb-streamer → Fly.io via
 * semantic-release), so each project carries its own input schema and a
 * `buildDispatchBody` that maps validated inputs to the GitHub
 * workflow_dispatch payload. repo/workflow come from env so secrets/overrides
 * stay in config; the *shape* lives here because it differs per project.
 */
export { DEFAULT_PROJECT_ID } from "@/lib/project-options"
export type { ProjectId } from "@/lib/project-options"

type DispatchBody = { ref: string; inputs: Record<string, string> }

type ProjectDef<Inputs> = {
  id: ProjectId
  label: string
  repo: string
  workflow: string
  schema: z.ZodType<Inputs>
  buildDispatchBody: (inputs: Inputs) => DispatchBody
}

const mobile: ProjectDef<MobileDispatchInputs> = {
  id: "tb-mobile",
  label: "Threadbase Mobile",
  repo: env.TB_MOBILE_REPO,
  workflow: env.TB_MOBILE_WORKFLOW_ID,
  schema: mobileDispatchSchema,
  buildDispatchBody: (inputs) => ({
    ref: inputs.deploy_ref,
    inputs: {
      platform: inputs.platform,
      target: inputs.target,
      android_track: inputs.android_track,
      // deploy.yml checks out `inputs.deploy_ref` (not the dispatch `ref`), so
      // it has to be passed through as an input too — otherwise every run would
      // check out the workflow file's default of "main".
      deploy_ref: inputs.deploy_ref,
      ...(inputs.release_notes ? { release_notes: inputs.release_notes } : {}),
    },
  }),
}

const streamer: ProjectDef<StreamerDispatchInputs> = {
  id: "tb-streamer",
  label: "Threadbase Streamer",
  repo: env.TB_STREAMER_REPO,
  workflow: env.TB_STREAMER_WORKFLOW_ID,
  schema: streamerDispatchSchema,
  buildDispatchBody: (inputs) => ({
    ref: inputs.deploy_ref,
    // release.yml gates the Fly.io publish on the `publish` boolean; GitHub
    // workflow_dispatch inputs are always strings, so serialize it.
    inputs: { publish: String(inputs.publish) },
  }),
}

// Union so callers can hold "some project" without narrowing the input type.
export type Project = ProjectDef<MobileDispatchInputs> | ProjectDef<StreamerDispatchInputs>

const REGISTRY: Record<ProjectId, Project> = {
  "tb-mobile": mobile,
  "tb-streamer": streamer,
}

export const PROJECTS: Project[] = [mobile, streamer]
export function isProjectId(id: string): id is ProjectId {
  return id === "tb-mobile" || id === "tb-streamer"
}

/** Returns the project, or null for an unknown id (callers reject with 400). */
export function getProject(id: string): Project | null {
  return isProjectId(id) ? REGISTRY[id] : null
}

/**
 * Maps a webhook's `repository.full_name` back to its project id, so
 * workflow_run events land in the right per-project event list. Case-insensitive
 * because GitHub's owner/repo casing in payloads can differ from our config.
 */
export function projectIdForRepo(fullName: string): ProjectId | null {
  const lower = fullName.toLowerCase()
  return PROJECTS.find((p) => p.repo.toLowerCase() === lower)?.id ?? null
}
