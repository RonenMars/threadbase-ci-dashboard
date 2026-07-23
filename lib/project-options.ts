export const PROJECT_OPTIONS = [
  { id: "tb-mobile", label: "Threadbase Mobile" },
  { id: "tb-streamer", label: "Threadbase Streamer" },
] as const

export type ProjectId = (typeof PROJECT_OPTIONS)[number]["id"]

export const DEFAULT_PROJECT_ID: ProjectId = "tb-mobile"

export const STREAMER_DEPLOYMENT_ENV_VALUES = [
  "fly-prod",
  "fly-demo",
  "local-prod",
  "local-dev",
] as const

export type StreamerDeploymentEnv = (typeof STREAMER_DEPLOYMENT_ENV_VALUES)[number]

export const STREAMER_DEPLOYMENT_ENVIRONMENTS = [
  { value: "fly-prod", label: "Fly.io - production", localOnly: false },
  { value: "fly-demo", label: "Fly.io - demo", localOnly: false },
  { value: "local-prod", label: "Local Prod", localOnly: true },
  { value: "local-dev", label: "Local Dev", localOnly: true },
] as const satisfies ReadonlyArray<{
  value: StreamerDeploymentEnv
  label: string
  localOnly: boolean
}>
