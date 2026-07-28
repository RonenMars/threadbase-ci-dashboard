"use client"
import { useEffect, useState } from "react"

export type Refs = Readonly<{ branches: string[]; tags: string[] }>
export type SubmitStatus = "idle" | "success" | "error"

/** Loads a project's branches/tags and reports the preferred default ref. */
export function useRefs(
  project: string,
  onDefaultRef: (ref: string) => void
): { refs: Refs; loading: boolean } {
  const [refs, setRefs] = useState<Refs>({ branches: [], tags: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Reset to loading on every project switch so the combobox shows "Loading…"
    // for the new repo's refs. This synchronous setState is the intended
    // reset-on-dependency-change pattern, not a cascading-render bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch(`/api/refs?project=${encodeURIComponent(project)}`)
      .then((r) => r.json())
      .then((data: Refs) => {
        setRefs(data)
        // Prefer main; the branches list is newest-first, so branches[0] would
        // otherwise default to whichever tip was most recently committed.
        const preferred = data.branches.includes("main")
          ? "main"
          : data.branches[0] ?? "main"
        onDefaultRef(preferred)
      })
      .catch(() => onDefaultRef("main"))
      .finally(() => setLoading(false))
    // onDefaultRef is a stable form setter; re-run only when the project changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  return { refs, loading }
}

/**
 * Owns the submit → status → run-link flow shared by both dispatch forms:
 * fires the dispatch, records success/error, then resolves the run URL in the
 * background so the form can offer a direct link to what it just started.
 */
export function useDispatchSubmit(project: string) {
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [runUrl, setRunUrl] = useState<string | null>(null)
  const [runLoading, setRunLoading] = useState(false)

  async function submit(values: Record<string, unknown>): Promise<void> {
    setStatus("idle")
    setErrorMessage("")
    setRunUrl(null)
    const { error, correlationId } = await submitDispatch(project, values)
    if (error) {
      setErrorMessage(error)
      setStatus("error")
      return
    }
    setStatus("success")
    if (!correlationId) return
    // Deliberately not awaited: the success state (and its refresh button) must
    // render immediately, with the link filling in when the run materializes.
    setRunLoading(true)
    void pollForRunUrl(project, correlationId)
      .then(setRunUrl)
      .finally(() => setRunLoading(false))
  }

  return { status, errorMessage, runUrl, runLoading, submit }
}

/** POSTs dispatch inputs (with the project tag), returning the error or the id. */
export async function submitDispatch(
  project: string,
  values: Record<string, unknown>
): Promise<{ error: string | null; correlationId: string | null }> {
  const res = await fetch("/api/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, ...values }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.ok) return { error: null, correlationId: data.correlationId ?? null }
  return { error: data.error ?? "Dispatch failed", correlationId: null }
}

/**
 * Polls until the dispatched run appears, resolving to its URL or null if it
 * never shows. GitHub needs a moment to create the run, so a null answer early
 * on is expected rather than a failure.
 */
export async function pollForRunUrl(
  project: string,
  correlationId: string,
  { attempts = 10, intervalMs = 2000 } = {}
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    try {
      const res = await fetch(
        `/api/runs/lookup?project=${encodeURIComponent(project)}` +
          `&correlationId=${encodeURIComponent(correlationId)}`
      )
      if (!res.ok) continue
      const data = await res.json()
      if (data.run?.html_url) return data.run.html_url as string
    } catch {
      // Transient fetch failure — keep polling until attempts run out.
    }
  }
  return null
}
