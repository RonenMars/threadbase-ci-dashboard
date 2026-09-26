import { z } from "zod"
import { env } from "@/lib/env"
import type { ProjectId } from "@/lib/project-options"
import {
  mobileDispatchSchema,
  mobileQaDispatchSchema,
  streamerDispatchSchema,
} from "@/lib/dispatch-schema"
import type {
  MobileDispatchInputs,
  MobileQaDispatchInputs,
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
  buildDispatchBody: (inputs: Inputs, correlationId: string) => DispatchBody
}

const mobile: ProjectDef<MobileDispatchInputs> = {
  id: "tb-mobile",
  label: "Threadbase Mobile",
  repo: env.TB_MOBILE_REPO,
  workflow: env.TB_MOBILE_WORKFLOW_ID,
  schema: mobileDispatchSchema,
  buildDispatchBody: (inputs, correlationId) => ({
    ref: inputs.deploy_ref,
    inputs: {
      platform: inputs.platform,
      target: inputs.target,
      android_track: inputs.android_track,
      // deploy.yml checks out `inputs.deploy_ref` (not the dispatch `ref`), so
      // it has to be passed through as an input too — otherwise every run would
      // check out the workflow file's default of "main".
      deploy_ref: inputs.deploy_ref,
      correlation_id: correlationId,
      ...(inputs.release_notes ? { release_notes: inputs.release_notes } : {}),
    },
  }),
}

const mobileQa: ProjectDef<MobileQaDispatchInputs> = {
  id: "tb-mobile-qa",
  label: "Threadbase Mobile QA",
  repo: env.TB_MOBILE_REPO,
  workflow: env.TB_MOBILE_QA_WORKFLOW_ID,
  schema: mobileQaDispatchSchema,
  buildDispatchBody: (inputs, correlationId) => ({
    ref: inputs.deploy_ref,
    inputs: {
      platform: inputs.platform,
      // qa.yml checks out `inputs.deploy_ref`, same as deploy.yml.
      deploy_ref: inputs.deploy_ref,
      groups: inputs.groups,
      correlation_id: correlationId,
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
  buildDispatchBody: (inputs, correlationId) => ({
    ref: inputs.deploy_ref,
    // release.yml gates the Fly.io publish on the `publish` boolean; GitHub
    // workflow_dispatch inputs are always strings, so serialize it.
    inputs: {
      deployment_env: inputs.deployment_env,
      publish: String(inputs.publish),
      correlation_id: correlationId,
    },
  }),
}

// Union so callers can hold "some project" without narrowing the input type.
export type Project =
  | ProjectDef<MobileDispatchInputs>
  | ProjectDef<MobileQaDispatchInputs>
  | ProjectDef<StreamerDispatchInputs>

const REGISTRY: Record<ProjectId, Project> = {
  "tb-mobile": mobile,
  "tb-mobile-qa": mobileQa,
  "tb-streamer": streamer,
}

export const PROJECTS: Project[] = [mobile, mobileQa, streamer]
export function isProjectId(id: string): id is ProjectId {
  return Object.hasOwn(REGISTRY, id)
}

/** Returns the project, or null for an unknown id (callers reject with 400). */
export function getProject(id: string): Project | null {
  return isProjectId(id) ? REGISTRY[id] : null
}

/**
 * Maps a workflow_run webhook back to its project id, so the event lands in the
 * right per-project event list. The repo alone is not enough: tb-mobile's Deploy
 * and QA workflows share a repo, and its CI runs belong to neither. The workflow
 * config may be a file name or a numeric id, so both are matched. The repo match
 * is case-insensitive because payload casing can differ from our config.
 */
export function projectIdForWorkflowRun(
  fullName: string,
  workflowPath: string,
  workflowId: number
): ProjectId | null {
  const repo = fullName.toLowerCase()
  const file = workflowPath.split("/").pop()
  return (
    PROJECTS.find(
      (p) =>
        p.repo.toLowerCase() === repo &&
        (p.workflow === file || p.workflow === String(workflowId))
    )?.id ?? null
  )
}
