import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import { StatusPill } from "@/components/status-pill"
import type { WorkflowRun } from "@/lib/github"

type RunRowProps = Readonly<{ run: WorkflowRun }>

export function RunRow({ run }: RunRowProps): React.JSX.Element {
  return (
    <tr className="h-12 border-b border-border transition-colors hover:bg-secondary/40">
      <td className="max-w-0 truncate py-2.5 pr-4 align-middle font-mono text-sm text-muted-foreground">
        #{run.run_number}
      </td>
      <td className="max-w-0 py-2.5 pr-4 align-middle">
        <span
          className="block max-w-full truncate rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-foreground/90"
          title={run.head_branch}
        >
          {run.head_branch}
        </span>
      </td>
      <td className="max-w-0 truncate py-2.5 pr-4 align-middle">
        <StatusPill run={run} />
      </td>
      <td
        className="max-w-0 truncate py-2.5 pr-4 align-middle text-sm text-muted-foreground"
        title={run.actor ?? undefined}
      >
        {run.actor ?? "—"}
      </td>
      <td className="max-w-0 truncate py-2.5 pr-4 align-middle text-sm text-muted-foreground">
        {new Date(run.created_at).toLocaleString()}
      </td>
      <td className="max-w-0 truncate py-2.5 align-middle">
        <a
          href={run.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-(--tb-blue-400) transition-colors hover:text-(--tb-blue-300)"
        >
          View
          <ArrowSquareOutIcon />
        </a>
      </td>
    </tr>
  )
}
