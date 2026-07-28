"use client"
import { useEffect, useRef, useState } from "react"
import {
  ArrowClockwiseIcon,
  ArrowSquareOutIcon,
  RocketLaunchIcon,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { SubmitStatus } from "@/components/dispatch-shared"

const CONFIRM_SECONDS = 5
/** How long the armed button stays clickable before disarming itself. */
const CONFIRM_WINDOW_SECONDS = 15

type ConfirmSubmitButtonProps = Readonly<{
  disabled?: boolean
  isSubmitting: boolean
  status: SubmitStatus
  /** Resolved once the dispatched run is found; null while unknown. */
  runUrl?: string | null
  /** True while still polling GitHub for the run this dispatch started. */
  runLoading?: boolean
}>

/**
 * Requires an arm click, then a countdown before the real submit click is
 * accepted — guards against accidentally triggering a real deploy workflow.
 * Once a dispatch succeeds the control locks and only offers a page refresh,
 * so a second deploy can't be fired from a form holding stale state.
 */
export function ConfirmSubmitButton({
  disabled,
  isSubmitting,
  status,
  runUrl,
  runLoading,
}: ConfirmSubmitButtonProps): React.JSX.Element {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Disarm once a failed submission finishes, so a retry starts from the safe
  // "Run Workflow" state instead of resting one click away from a deploy.
  // A successful dispatch is handled by the locked refresh state below.
  useEffect(() => {
    if (wasSubmitting.current && !isSubmitting) setSecondsLeft(null)
    wasSubmitting.current = isSubmitting
  }, [isSubmitting])

  const armed = secondsLeft !== null
  const counting = armed && secondsLeft > 0

  function handleArm(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    setSecondsLeft(CONFIRM_SECONDS)
    // Ticks through the countdown, then keeps running for CONFIRM_WINDOW_SECONDS
    // so an armed-and-forgotten button disarms itself rather than sitting one
    // click away from a deploy.
    let elapsed = 0
    timerRef.current = setInterval(() => {
      elapsed += 1
      if (elapsed >= CONFIRM_SECONDS + CONFIRM_WINDOW_SECONDS) {
        if (timerRef.current) clearInterval(timerRef.current)
        setSecondsLeft(null)
        return
      }
      setSecondsLeft(Math.max(0, CONFIRM_SECONDS - elapsed))
    }, 1000)
  }

  if (status === "success") {
    return (
      <div className="space-y-2">
        <Button type="button" disabled className="w-full">
          <RocketLaunchIcon weight="fill" />
          Run Workflow
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full"
        >
          <ArrowClockwiseIcon weight="bold" />
          Refresh page
        </Button>
        {runUrl ? (
          <a
            href={runUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
          >
            <ArrowSquareOutIcon weight="bold" />
            View workflow run
          </a>
        ) : runLoading ? (
          <p className="text-center text-sm text-muted-foreground">
            Locating workflow run…
          </p>
        ) : null}
        <p className="text-center text-xs text-muted-foreground">
          Refresh the page to run another deploy — this form holds stale state.
        </p>
      </div>
    )
  }

  if (!armed) {
    return (
      <Button
        type="button"
        onClick={handleArm}
        disabled={disabled || isSubmitting}
        className="w-full"
      >
        <RocketLaunchIcon weight="fill" />
        Run Workflow
      </Button>
    )
  }

  return (
    <Button
      type="submit"
      onClick={() => {
        if (timerRef.current) clearInterval(timerRef.current)
      }}
      disabled={counting || isSubmitting}
      className="w-full"
    >
      <RocketLaunchIcon weight="fill" />
      {isSubmitting
        ? "Triggering…"
        : counting
          ? `Confirm in ${secondsLeft}s…`
          : "Confirm & Run Workflow"}
    </Button>
  )
}
