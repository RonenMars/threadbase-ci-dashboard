"use client"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PROJECT_OPTIONS, type ProjectId } from "@/lib/project-options"

type ProjectSwitcherProps = Readonly<{
  value: ProjectId
  onChange: (id: ProjectId) => void
}>

export function ProjectSwitcher({ value, onChange }: ProjectSwitcherProps): React.JSX.Element {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ProjectId)}>
      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
      <SelectContent>
        {PROJECT_OPTIONS.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
