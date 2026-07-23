import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRefs } from "@/lib/github"
import { getProject, DEFAULT_PROJECT_ID } from "@/lib/projects"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const id = new URL(req.url).searchParams.get("project") ?? DEFAULT_PROJECT_ID
  const project = getProject(id)
  if (!project) {
    return NextResponse.json({ error: `Unknown project: ${id}` }, { status: 400 })
  }
  try {
    const refs = await getRefs(session.user.id, project)
    return NextResponse.json(refs)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch refs" },
      { status: 500 }
    )
  }
}
