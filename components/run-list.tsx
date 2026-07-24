"use client"
import { useEffect, useRef, useState } from "react"
import { RunRow } from "@/components/run-row"
import { ProjectSwitcher } from "@/components/project-switcher"
import { DEFAULT_PROJECT_ID, type ProjectId } from "@/lib/project-options"
import type { WorkflowRun } from "@/lib/github"

const POLL_FALLBACK_MS = 10_000
const SSE_STALE_MS = 30_000

type RunListProps = Readonly<{ initialRuns: WorkflowRun[] }>

export function RunList({ initialRuns }: RunListProps): React.JSX.Element {
  const [project, setProject] = useState<ProjectId>(DEFAULT_PROJECT_ID)
  // Initial runs are server-fetched for the default project only; a switch away
  // clears them and the effect below refetches for the newly selected project.
  const [runs, setRuns] = useState<WorkflowRun[]>(initialRuns)
  const lastEventRef = useRef<number>(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function switchProject(next: ProjectId) {
    if (next === project) return
    setRuns([])
    setProject(next)
  }

  useEffect(() => {
    lastEventRef.current = Date.now()

    // Fetch the selected project's runs (skipped for the SSR-primed default on
    // first mount would double-fetch, but a fresh fetch keeps the list correct
    // after a switch and is cheap).
    fetch(`/api/runs?project=${project}`)
      .then((r) => (r.ok ? r.json() : { runs: [] }))
      .then(({ runs: fresh }) => setRuns(fresh))
      .catch(() => {})

    function upsertRun(incoming: WorkflowRun) {
      setRuns((prev) => {
        const idx = prev.findIndex((r) => r.id === incoming.id)
        if (idx === -1) return [incoming, ...prev].slice(0, 20)
        const updated = [...prev]
        updated[idx] = incoming
        return updated
      })
    }

    function startPolling() {
      if (pollingRef.current) return
      pollingRef.current = setInterval(async () => {
        const res = await fetch(`/api/runs?project=${project}`)
        if (!res.ok) return
        const { runs: fresh } = await res.json()
        setRuns(fresh)
      }, POLL_FALLBACK_MS)
    }

    function stopPolling() {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    let es: EventSource

    function connect() {
      es = new EventSource(`/api/events?project=${project}`)

      es.onmessage = (e) => {
        if (e.data === "connected") return
        lastEventRef.current = Date.now()
        stopPolling()
        try {
          const run: WorkflowRun = JSON.parse(e.data)
          upsertRun(run)
        } catch {}
      }

      es.onerror = () => {
        es.close()
        startPolling()
        setTimeout(connect, 5000)
      }
    }

    connect()

    // Stale-connection guard: if no SSE event in 30s, fall back to polling.
    const staleGuard = setInterval(() => {
      if (Date.now() - lastEventRef.current > SSE_STALE_MS) {
        startPolling()
      } else {
        stopPolling()
      }
    }, 5000)

    return () => {
      es?.close()
      stopPolling()
      clearInterval(staleGuard)
    }
  }, [project])

  return (
    <>
      <div className="mb-4">
        <ProjectSwitcher value={project} onChange={switchProject} />
      </div>
      {runs.length === 0 ? (
        <p className="text-muted-foreground">No recent runs.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card p-4 shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
          <table className="w-full table-fixed text-left">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="w-1/6 pb-2 pr-4 font-semibold">#</th>
                <th className="w-1/6 pb-2 pr-4 font-semibold">Branch / Tag</th>
                <th className="w-1/6 pb-2 pr-4 font-semibold">Status</th>
                <th className="w-1/6 pb-2 pr-4 font-semibold">Triggered by</th>
                <th className="w-1/6 pb-2 pr-4 font-semibold">Started</th>
                <th className="w-1/6 pb-2 font-semibold">Link</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
