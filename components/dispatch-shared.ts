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
        // Prefer main; the branches list is alphabetical, so branches[0] would
        // otherwise default to whatever sorts first (e.g. "chore/...").
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

/** POSTs dispatch inputs (with the project tag) and returns the error, if any. */
export async function submitDispatch(
  project: string,
  values: Record<string, unknown>
): Promise<string | null> {
  const res = await fetch("/api/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, ...values }),
  })
  if (res.ok) return null
  const data = await res.json().catch(() => ({}))
  return data.error ?? "Dispatch failed"
}
