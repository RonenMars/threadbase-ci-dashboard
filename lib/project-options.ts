export const PROJECT_OPTIONS = [
  { id: "tb-mobile", label: "Threadbase Mobile" },
  { id: "tb-streamer", label: "Threadbase Streamer" },
] as const

export type ProjectId = (typeof PROJECT_OPTIONS)[number]["id"]

export const DEFAULT_PROJECT_ID: ProjectId = "tb-mobile"
