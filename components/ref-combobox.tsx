"use client"
import { useState } from "react"
import { CaretUpDownIcon, CheckIcon, GitBranchIcon, TagIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type RefComboboxProps = Readonly<{
  id?: string
  branches: string[]
  tags: string[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
}>

export function RefCombobox({
  id, branches, tags, value, onChange, disabled, loading,
}: RefComboboxProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const isTag = tags.includes(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-input font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            {value && (isTag ? <TagIcon className="text-muted-foreground" /> : <GitBranchIcon className="text-muted-foreground" />)}
            <span className="truncate font-mono text-sm">
              {loading ? "Loading…" : value || "Select ref"}
            </span>
          </span>
          <CaretUpDownIcon className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        {/* cmdk filters items by their `value` as the user types. */}
        <Command>
          <CommandInput placeholder="Filter branches & tags…" />
          <CommandList>
            <CommandEmpty>No ref found.</CommandEmpty>
            {branches.length > 0 && (
              <CommandGroup heading="Branches">
                {branches.map((b) => (
                  <RefItem key={`branch:${b}`} value={b} selected={value === b} icon="branch" onSelect={(v) => { onChange(v); setOpen(false) }} />
                ))}
              </CommandGroup>
            )}
            {tags.length > 0 && (
              <CommandGroup heading="Tags">
                {tags.map((t) => (
                  <RefItem key={`tag:${t}`} value={t} selected={value === t} icon="tag" onSelect={(v) => { onChange(v); setOpen(false) }} />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function RefItem({
  value, selected, icon, onSelect,
}: Readonly<{
  value: string
  selected: boolean
  icon: "branch" | "tag"
  onSelect: (value: string) => void
}>): React.JSX.Element {
  return (
    <CommandItem value={value} onSelect={onSelect} className="font-mono text-sm">
      {icon === "branch"
        ? <GitBranchIcon className="text-muted-foreground" />
        : <TagIcon className="text-muted-foreground" />}
      <span className="truncate">{value}</span>
      <CheckIcon className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  )
}
