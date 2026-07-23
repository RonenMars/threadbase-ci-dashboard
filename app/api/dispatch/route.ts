import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { triggerDispatch } from "@/lib/github"
import { getProject, DEFAULT_PROJECT_ID } from "@/lib/projects"
import { canDeploy } from "@/lib/roles"
import type { Role } from "@/lib/roles"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!canDeploy(session.user.role as Role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const id = typeof body.project === "string" ? body.project : DEFAULT_PROJECT_ID
  const project = getProject(id)
  if (!project) {
    return NextResponse.json({ error: `Unknown project: ${id}` }, { status: 400 })
  }

  const parsed = project.schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await triggerDispatch(session.user.id, project, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Dispatch failed" },
      { status: 500 }
    )
  }
}
