/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import type { SubmitStatus } from "@/components/dispatch-shared"

/** Renders the button inside a form so submit clicks are observable. */
function renderInForm(
  isSubmitting = false,
  status: SubmitStatus = "idle",
  extra: { runUrl?: string | null; runLoading?: boolean } = {},
) {
  const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
  const view = render(
    <form onSubmit={onSubmit}>
      <ConfirmSubmitButton
        isSubmitting={isSubmitting}
        status={status}
        {...extra}
      />
    </form>,
  )
  return { onSubmit, view }
}

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
  })
}

function advance(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000)
  })
}

describe("ConfirmSubmitButton", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("does not submit on the first click", () => {
    const { onSubmit } = renderInForm()

    click(screen.getByRole("button", { name: /run workflow/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole("button")).toBeDisabled()
    expect(screen.getByRole("button")).toHaveTextContent(/confirm in 5s/i)
  })

  it("stays disabled through the countdown, then submits on the confirm click", () => {
    const { onSubmit } = renderInForm()

    click(screen.getByRole("button", { name: /run workflow/i }))

    advance(4)
    expect(screen.getByRole("button")).toBeDisabled()

    advance(1)
    const confirm = screen.getByRole("button")
    expect(confirm).toBeEnabled()
    expect(confirm).toHaveTextContent(/confirm & run workflow/i)

    click(confirm)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("disarms itself when the confirm window lapses unused", () => {
    const { onSubmit } = renderInForm()

    click(screen.getByRole("button", { name: /run workflow/i }))
    advance(5)
    expect(screen.getByRole("button")).toHaveTextContent(/confirm & run workflow/i)

    // Armed and abandoned: past the window it must fall back to the safe state.
    advance(15)
    const button = screen.getByRole("button")
    expect(button).toHaveTextContent(/^Run Workflow$/)

    click(button)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("locks the run button and offers a refresh once the dispatch succeeds", () => {
    const { onSubmit, view } = renderInForm()

    click(screen.getByRole("button", { name: /run workflow/i }))
    advance(5)
    click(screen.getByRole("button", { name: /confirm & run workflow/i }))
    expect(onSubmit).toHaveBeenCalledTimes(1)

    view.rerender(
      <form onSubmit={onSubmit}>
        <ConfirmSubmitButton isSubmitting={false} status="success" />
      </form>,
    )

    // The run button stays present but dead — no second deploy from stale state.
    const run = screen.getByRole("button", { name: /run workflow/i })
    expect(run).toBeDisabled()
    click(run)
    expect(onSubmit).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole("button", { name: /refresh page/i }),
    ).toBeEnabled()
    expect(screen.getByText(/holds stale state/i)).toBeInTheDocument()
  })

  it("reloads the page when refresh is clicked", () => {
    const reload = vi.fn()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    })

    renderInForm(false, "success")
    click(screen.getByRole("button", { name: /refresh page/i }))

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it("shows the run link under the refresh button once the run is found", () => {
    renderInForm(false, "success", {
      runUrl: "https://github.com/o/r/actions/runs/42",
      runLoading: false,
    })

    const link = screen.getByRole("link", { name: /view workflow run/i })
    expect(link).toHaveAttribute("href", "https://github.com/o/r/actions/runs/42")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"))

    // Must sit below the refresh button, per the requested layout.
    const refresh = screen.getByRole("button", { name: /refresh page/i })
    expect(
      refresh.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("shows a locating message while the run is still being resolved", () => {
    renderInForm(false, "success", { runUrl: null, runLoading: true })

    expect(screen.getByText(/locating workflow run/i)).toBeInTheDocument()
    expect(screen.queryByRole("link")).toBeNull()
    // The refresh path must not be blocked while the lookup is in flight.
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeEnabled()
  })

  it("omits the link entirely when the run is never found", () => {
    renderInForm(false, "success", { runUrl: null, runLoading: false })

    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.queryByText(/locating workflow run/i)).toBeNull()
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeEnabled()
  })

  it("stays retryable after a failed dispatch", () => {
    const { onSubmit, view } = renderInForm()

    click(screen.getByRole("button", { name: /run workflow/i }))
    advance(5)
    click(screen.getByRole("button", { name: /confirm & run workflow/i }))

    // Submission in flight, mirroring react-hook-form's isSubmitting.
    view.rerender(
      <form onSubmit={onSubmit}>
        <ConfirmSubmitButton isSubmitting={true} status="idle" />
      </form>,
    )

    // A failure must not lock the user out — they need to fix input and retry.
    view.rerender(
      <form onSubmit={onSubmit}>
        <ConfirmSubmitButton isSubmitting={false} status="error" />
      </form>,
    )

    expect(screen.queryByRole("button", { name: /refresh page/i })).toBeNull()
    const run = screen.getByRole("button", { name: /^run workflow$/i })
    expect(run).toBeEnabled()
  })
})
