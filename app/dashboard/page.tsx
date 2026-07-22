import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { canDeploy } from "@/lib/roles"
import { DispatchForm } from "@/components/dispatch-form"
import type { Role } from "@/lib/roles"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/")
  if (!canDeploy(session.user.role as Role)) redirect("/history")

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-2xl font-bold">Deploy</h1>
      <DispatchForm />
    </main>
  )
}
