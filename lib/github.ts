import type { Project } from "@/lib/projects"
import type { DispatchInputs } from "@/lib/dispatch-schema"
import { getInstallationToken } from "@/lib/github-app"

export type { DispatchInputs } from "@/lib/dispatch-schema"

const GH_API = "https://api.github.com"
const GH_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
})

export interface WorkflowRun {
  id: number
  name: string
  status: string
  conclusion: string | null
  head_branch: string
  html_url: string
  created_at: string
  updated_at: string
  actor: string | null
  run_number: number
}

/** GraphQL: list heads/tags by tip commit date, newest first. REST is A–Z only. */
const REFS_QUERY = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      branches: refs(
        refPrefix: "refs/heads/"
        first: 100
        orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
      ) {
        nodes { name }
      }
      tags: refs(
        refPrefix: "refs/tags/"
        first: 100
        orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
      ) {
        nodes { name }
      }
    }
  }
`

type RefsGraphQL = {
  data?: {
    repository: {
      branches: { nodes: Array<{ name: string }> }
      tags: { nodes: Array<{ name: string }> }
    } | null
  }
  errors?: Array<{ message: string }>
}

export async function getRefs(
  project: Project
): Promise<{ branches: string[]; tags: string[] }> {
  const token = await getInstallationToken()
  const [owner, name] = project.repo.split("/")
  if (!owner || !name) throw new Error(`Invalid repo: ${project.repo}`)

  const res = await fetch(`${GH_API}/graphql`, {
    method: "POST",
    headers: { ...GH_HEADERS(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query: REFS_QUERY, variables: { owner, name } }),
  })
  if (!res.ok) throw new Error(`GitHub refs error: ${res.status}`)

  const body: RefsGraphQL = await res.json()
  if (body.errors?.length) {
    throw new Error(`GitHub refs error: ${body.errors[0].message}`)
  }
  const repo = body.data?.repository
  if (!repo) throw new Error(`Repository not found: ${project.repo}`)

  return {
    branches: repo.branches.nodes.map((b) => b.name),
    tags: repo.tags.nodes.map((t) => t.name),
  }
}

/**
 * Fires the workflow and returns the correlation id stamped into its run-name.
 *
 * GitHub's dispatch endpoint answers 204 with no body, so there is no run id to
 * read back. Instead we generate an id here, pass it as a workflow input that
 * both repos echo into `run-name`, and let findRunByCorrelationId poll for the
 * run carrying it. The id is generated server-side (never client-supplied) so
 * nothing arbitrary can reach the run title.
 */
export async function triggerDispatch(
  project: Project,
  inputs: DispatchInputs
): Promise<string> {
  const token = await getInstallationToken()
  const correlationId = crypto.randomUUID()
  // The route validated `inputs` against this project's schema, so the cast is
  // safe: buildDispatchBody expects exactly that project's input shape.
  const build = project.buildDispatchBody as (
    i: DispatchInputs,
    c: string
  ) => unknown
  const body = build(inputs, correlationId)
  const res = await fetch(
    `${GH_API}/repos/${project.repo}/actions/workflows/${project.workflow}/dispatches`,
    {
      method: "POST",
      headers: { ...GH_HEADERS(token), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub dispatch error: ${res.status} ${text}`)
  }
  return correlationId
}

/**
 * Finds the run whose title carries `correlationId`, or null if it has not been
 * created yet. GitHub takes a moment to materialize a dispatched run, so the
 * caller is expected to retry; returning null is the normal "not yet" answer,
 * not an error.
 */
export async function findRunByCorrelationId(
  project: Project,
  correlationId: string
): Promise<{ html_url: string; run_number: number } | null> {
  const token = await getInstallationToken()
  const res = await fetch(
    `${GH_API}/repos/${project.repo}/actions/workflows/${project.workflow}/runs?per_page=20`,
    { headers: GH_HEADERS(token), cache: "no-store" }
  )
  if (!res.ok) throw new Error(`GitHub runs error: ${res.status}`)
  const data = await res.json()
  const runs = data.workflow_runs as Array<{
    name: string | null
    display_title: string | null
    html_url: string
    run_number: number
  }>
  const match = runs.find(
    (r) =>
      r.display_title?.includes(correlationId) || r.name?.includes(correlationId)
  )
  return match
    ? { html_url: match.html_url, run_number: match.run_number }
    : null
}

export async function getRuns(project: Project): Promise<WorkflowRun[]> {
  const token = await getInstallationToken()
  const res = await fetch(
    `${GH_API}/repos/${project.repo}/actions/workflows/${project.workflow}/runs?per_page=20`,
    { headers: GH_HEADERS(token) }
  )
  if (!res.ok) throw new Error(`GitHub runs error: ${res.status}`)
  const data = await res.json()
  return (data.workflow_runs as Array<{
    id: number; name: string; status: string; conclusion: string | null;
    head_branch: string; html_url: string; created_at: string;
    updated_at: string; run_number: number;
    triggering_actor: { login: string } | null
  }>).map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    conclusion: r.conclusion,
    head_branch: r.head_branch,
    html_url: r.html_url,
    created_at: r.created_at,
    updated_at: r.updated_at,
    run_number: r.run_number,
    actor: r.triggering_actor?.login ?? null,
  }))
}
