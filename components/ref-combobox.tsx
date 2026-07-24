"use client"
import { useEffect, useRef, useState } from "react"
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

/** Space above/below the trigger within the visual viewport (handles mobile keyboards). */
export function availablePopoverHeight({
  triggerTop,
  triggerBottom,
  viewportTop,
  viewportHeight,
  padding = 12,
}: {
  triggerTop: number
  triggerBottom: number
  viewportTop: number
  viewportHeight: number
  padding?: number
}): number {
  const viewportBottom = viewportTop + viewportHeight
  const spaceAbove = Math.max(0, triggerTop - viewportTop - padding)
  const spaceBelow = Math.max(0, viewportBottom - triggerBottom - padding)
  // Prefer the larger side, matching Radix collision flip behavior.
  return Math.max(spaceAbove, spaceBelow)
}

function useVisualViewportPopoverMaxHeight(open: boolean): {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  maxHeight: number | undefined
} {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [maxHeight, setMaxHeight] = useState<number | undefined>()

  useEffect(() => {
    if (!open) return

    const update = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const vv = window.visualViewport
      setMaxHeight(
        availablePopoverHeight({
          triggerTop: rect.top,
          triggerBottom: rect.bottom,
          viewportTop: vv?.offsetTop ?? 0,
          viewportHeight: vv?.height ?? window.innerHeight,
        }),
      )
    }

    // Defer initial measure so setState is not synchronous inside the effect body.
    const frame = requestAnimationFrame(update)
    const vv = window.visualViewport
    vv?.addEventListener("resize", update)
    vv?.addEventListener("scroll", update)
    window.addEventListener("resize", update)
    return () => {
      cancelAnimationFrame(frame)
      vv?.removeEventListener("resize", update)
      vv?.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [open])

  return { triggerRef, maxHeight: open ? maxHeight : undefined }
}

export function RefCombobox({
  id, branches, tags, value, onChange, disabled, loading,
}: RefComboboxProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const isTag = tags.includes(value)
  const { triggerRef, maxHeight } = useVisualViewportPopoverMaxHeight(open)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
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
        className="w-(--radix-popover-trigger-width) overflow-hidden p-0"
        align="start"
        collisionPadding={12}
        style={{
          // Cap to visual viewport (iOS/Android keyboard) and Radix collision space.
          maxHeight:
            maxHeight != null && maxHeight > 0
              ? `min(${maxHeight}px, var(--radix-popover-content-available-height, ${maxHeight}px))`
              : "var(--radix-popover-content-available-height)",
        }}
      >
        {/* cmdk filters items by their `value` as the user types. */}
        <Command className="max-h-full min-h-0 overflow-hidden">
          <CommandInput placeholder="Filter branches & tags…" />
          <CommandList className="min-h-0 max-h-72">
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
