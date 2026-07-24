import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { isAdmin } from "@/lib/roles"
import { AppHeader } from "@/components/app-header"
import { UserTable } from "@/components/user-table"
import type { Role } from "@/lib/roles"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")
  const role = session.user.role as Role
  if (!isAdmin(role)) redirect("/dashboard")

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

  const rows = allUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <>
      <AppHeader role={role} name={session.user.name ?? null} image={session.user.image ?? null} />
      <main className="mx-auto w-full min-w-0 max-w-6xl p-4 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Admin</p>
        <h1 className="mb-6 text-2xl font-semibold tracking-[-0.02em]">User management</h1>
        <UserTable initialUsers={rows} currentUserId={session.user.id} />
      </main>
    </>
  )
}
