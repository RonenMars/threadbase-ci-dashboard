import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findRunByCorrelationId } from "@/lib/github"
import { getProject, DEFAULT_PROJECT_ID } from "@/lib/projects"

/**
 * Resolves a dispatch correlation id to the run it started. The client polls
 * this after a successful dispatch, because GitHub's dispatch response carries
 * no run id. `{ run: null }` means "not created yet — keep polling".
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const params = new URL(req.url).searchParams
  const id = params.get("project") ?? DEFAULT_PROJECT_ID
  const correlationId = params.get("correlationId")
  if (!correlationId) {
    return NextResponse.json({ error: "Missing correlationId" }, { status: 400 })
  }
  const project = getProject(id)
  if (!project) {
    return NextResponse.json({ error: `Unknown project: ${id}` }, { status: 400 })
  }
  try {
    const run = await findRunByCorrelationId(project, correlationId)
    return NextResponse.json({ run })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to look up run" },
      { status: 500 }
    )
  }
}
