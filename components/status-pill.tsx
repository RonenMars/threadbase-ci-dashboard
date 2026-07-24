import type { WorkflowRun } from "@/lib/github"

type Tone = "live" | "running" | "done" | "failed" | "queued"

const TONE: Record<Tone, { wrap: string; dot: string; pulse?: boolean }> = {
  // "live" uses the brand amber — an actively running deploy is the "now".
  live: { wrap: "bg-[rgba(240,138,36,0.14)] text-[var(--tb-amber-400)]", dot: "bg-[var(--tb-amber-400)] shadow-[0_0_8px_var(--tb-amber-400)]", pulse: true },
  running: { wrap: "bg-[rgba(99,179,255,0.14)] text-[var(--tb-blue-400)]", dot: "bg-[var(--tb-blue-400)]" },
  done: { wrap: "bg-[rgba(74,222,128,0.14)] text-[var(--tb-success-400)]", dot: "bg-[var(--tb-success-400)]" },
  failed: { wrap: "bg-[rgba(255,107,107,0.14)] text-[var(--tb-danger-400)]", dot: "bg-[var(--tb-danger-400)]" },
  queued: { wrap: "bg-secondary text-muted-foreground", dot: "bg-muted-foreground" },
}

function toneFor(run: WorkflowRun): { tone: Tone; label: string } {
  if (run.status === "completed") {
    return run.conclusion === "success"
      ? { tone: "done", label: "completed" }
      : { tone: "failed", label: run.conclusion ?? "failed" }
  }
  if (run.status === "in_progress") return { tone: "live", label: "live" }
  return { tone: "queued", label: run.status }
}

export function StatusPill({ run }: Readonly<{ run: WorkflowRun }>): React.JSX.Element {
  const { tone, label } = toneFor(run)
  const t = TONE[tone]
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${t.wrap}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot} ${t.pulse ? "animate-pulse" : ""}`} />
      <span className="truncate">{label}</span>
    </span>
  )
}
