import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { canDeploy } from "@/lib/roles"
import { AppHeader } from "@/components/app-header"
import { DispatchForm } from "@/components/dispatch-form"
import type { Role } from "@/lib/roles"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/")
  const role = session.user.role as Role
  if (!canDeploy(role)) redirect("/history")

  return (
    <>
      <AppHeader role={role} name={session.user.name ?? null} image={session.user.image ?? null} />
      <main className="flex w-full min-w-0 flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex w-full max-w-lg flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Deploy</p>
          <h1 className="mb-6 text-2xl font-semibold tracking-[-0.02em]">Trigger a workflow</h1>
          <DispatchForm includeLocalEnvironments={process.env.VERCEL !== "1"} />
        </div>
      </main>
    </>
  )
}
