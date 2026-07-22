import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import type { WorkflowRun } from "@/lib/github"

function statusBadge(run: WorkflowRun): React.JSX.Element {
  if (run.status === "completed") {
    return run.conclusion === "success"
      ? <Badge variant="default" className="bg-green-600">success</Badge>
      : <Badge variant="destructive">{run.conclusion ?? "failed"}</Badge>
  }
  if (run.status === "in_progress") {
    return <Badge variant="secondary" className="animate-pulse">in progress</Badge>
  }
  return <Badge variant="outline">{run.status}</Badge>
}

type RunRowProps = Readonly<{ run: WorkflowRun }>

export function RunRow({ run }: RunRowProps): React.JSX.Element {
  return (
    <tr className="border-b">
      <td className="py-2 pr-4 font-mono text-sm">#{run.run_number}</td>
      <td className="py-2 pr-4 text-sm">{run.head_branch}</td>
      <td className="py-2 pr-4">{statusBadge(run)}</td>
      <td className="py-2 pr-4 text-sm text-muted-foreground">{run.actor ?? "—"}</td>
      <td className="py-2 pr-4 text-sm text-muted-foreground">
        {new Date(run.created_at).toLocaleString()}
      </td>
      <td className="py-2">
        <a
          href={run.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 underline"
        >
          View
          <ArrowSquareOutIcon />
        </a>
      </td>
    </tr>
  )
}
