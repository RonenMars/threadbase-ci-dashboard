import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { accounts } from "@/lib/db/schema"
import type { Project } from "@/lib/projects"
import type { DispatchInputs } from "@/lib/dispatch-schema"

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

export async function getGitHubToken(userId: string): Promise<string> {
  const [account] = await db
    .select({ access_token: accounts.access_token })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "github")))
  if (!account?.access_token) throw new Error("No GitHub token for user")
  return account.access_token
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
  userId: string,
  project: Project
): Promise<{ branches: string[]; tags: string[] }> {
  const token = await getGitHubToken(userId)
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

export async function triggerDispatch(
  userId: string,
  project: Project,
  inputs: DispatchInputs
): Promise<void> {
  const token = await getGitHubToken(userId)
  // The route validated `inputs` against this project's schema, so the cast is
  // safe: buildDispatchBody expects exactly that project's input shape.
  const body = (project.buildDispatchBody as (i: DispatchInputs) => unknown)(inputs)
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
}

export async function getRuns(
  userId: string,
  project: Project
): Promise<WorkflowRun[]> {
  const token = await getGitHubToken(userId)
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
