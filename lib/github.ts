import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { accounts } from "@/lib/db/schema"
import { env } from "@/lib/env"
import type { DispatchInputs } from "@/lib/dispatch-schema"

export { dispatchInputsSchema } from "@/lib/dispatch-schema"
export type { DispatchInputs } from "@/lib/dispatch-schema"

const REPO = env.GITHUB_REPO
const WORKFLOW = env.GITHUB_WORKFLOW_ID
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

export async function getRefs(
  userId: string
): Promise<{ branches: string[]; tags: string[] }> {
  const token = await getGitHubToken(userId)
  const headers = GH_HEADERS(token)

  const [branchesRes, tagsRes] = await Promise.all([
    fetch(`${GH_API}/repos/${REPO}/branches?per_page=100`, { headers }),
    fetch(`${GH_API}/repos/${REPO}/tags?per_page=100`, { headers }),
  ])

  if (!branchesRes.ok) throw new Error(`GitHub branches error: ${branchesRes.status}`)
  if (!tagsRes.ok) throw new Error(`GitHub tags error: ${tagsRes.status}`)

  const branches: Array<{ name: string }> = await branchesRes.json()
  const tags: Array<{ name: string }> = await tagsRes.json()

  return {
    branches: branches.map((b) => b.name),
    tags: tags.map((t) => t.name),
  }
}

export async function triggerDispatch(
  userId: string,
  inputs: DispatchInputs
): Promise<void> {
  const token = await getGitHubToken(userId)
  const res = await fetch(
    `${GH_API}/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: { ...GH_HEADERS(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: inputs.deploy_ref,
        inputs: {
          platform: inputs.platform,
          target: inputs.target,
          android_track: inputs.android_track,
          // deploy.yml checks out `inputs.deploy_ref` (not the dispatch `ref`),
          // so it has to be passed through as an input too — otherwise every
          // run would check out the workflow file's default of "main".
          deploy_ref: inputs.deploy_ref,
          ...(inputs.release_notes ? { release_notes: inputs.release_notes } : {}),
        },
      }),
    }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub dispatch error: ${res.status} ${body}`)
  }
}

export async function getRuns(userId: string): Promise<WorkflowRun[]> {
  const token = await getGitHubToken(userId)
  const res = await fetch(
    `${GH_API}/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=20`,
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
