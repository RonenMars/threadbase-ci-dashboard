import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { isAdmin } from "@/lib/roles"
import type { Role } from "@/lib/roles"

const roleSchema = z.object({
  role: z.enum(["admin", "deployer", "viewer"]),
})

async function requireAdmin() {
  const session = await auth()
  if (!session) return null
  if (!isAdmin(session.user.role as Role)) return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt)

  return NextResponse.json({ users: allUsers })
}

export async function PATCH(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const targetId = searchParams.get("id")
  if (!targetId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const body = await req.json()
  const parsed = roleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // An admin cannot demote themselves — it could lock the last admin out.
  if (targetId === session.user.id && parsed.data.role !== "admin") {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    )
  }

  await db.update(users).set({ role: parsed.data.role }).where(eq(users.id, targetId))
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const targetId = searchParams.get("id")
  if (!targetId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Prevent self-removal.
  if (targetId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
  }

  await db.delete(users).where(eq(users.id, targetId))
  return NextResponse.json({ ok: true })
}
