import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getRuns } from "@/lib/github"
import { RunList } from "@/components/run-list"
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
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-2xl font-bold">Deploy History</h1>
      <RunList initialRuns={initialRuns} />
    </main>
  )
}
