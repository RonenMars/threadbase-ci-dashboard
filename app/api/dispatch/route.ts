import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { dispatchInputsSchema } from "@/lib/dispatch-schema"
import { triggerDispatch } from "@/lib/github"
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
  const parsed = dispatchInputsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await triggerDispatch(session.user.id, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Dispatch failed" },
      { status: 500 }
    )
  }
}
