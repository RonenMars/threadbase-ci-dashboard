import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getRuns } from "@/lib/github"
import { AppHeader } from "@/components/app-header"
import { RunList } from "@/components/run-list"
import type { Role } from "@/lib/roles"
import type { WorkflowRun } from "@/lib/github"

export default async function HistoryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  let initialRuns: WorkflowRun[] = []
  try {
    initialRuns = await getRuns(session.user.id)
  } catch {
    // Render with an empty list; client-side polling will fill it in.
  }

  return (
    <>
      <AppHeader
        role={session.user.role as Role}
        name={session.user.name ?? null}
        image={session.user.image ?? null}
      />
      <main className="mx-auto w-full max-w-6xl p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">History</p>
        <h1 className="mb-6 text-2xl font-semibold tracking-[-0.02em]">Deploy history</h1>
        <RunList initialRuns={initialRuns} />
      </main>
    </>
  )
}
