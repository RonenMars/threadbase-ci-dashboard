/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, vi, afterEach } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { DispatchForm } from "@/components/dispatch-form"

vi.mock("@/components/dispatch-shared", () => ({
  useRefs: () => ({ refs: { branches: ["main"], tags: [] }, loading: false }),
  submitDispatch: vi.fn(),
}))

describe("DispatchForm mobile width", () => {
  afterEach(() => cleanup())

  it("does not pin the project switcher to a fixed width that overflows phones", () => {
    const { container } = render(<DispatchForm includeLocalEnvironments={false} />)

    const trigger = container.querySelector(
      '[data-slot="card-header"] [data-slot="select-trigger"]',
    )
    expect(trigger).toBeTruthy()
    expect(trigger?.className).toContain("w-full")
    expect(trigger?.className).toContain("min-w-0")
    expect(trigger?.className).not.toMatch(/(?:^|\s)w-56(?:\s|$)/)
    expect(trigger?.className).toContain("sm:w-56")
    expect(screen.getByText("Threadbase Mobile")).toBeInTheDocument()
  })

  it("stacks the card header so title and switcher can share narrow viewports", () => {
    const { container } = render(<DispatchForm includeLocalEnvironments={false} />)
    const header = container.querySelector('[data-slot="card-header"]')
    expect(header?.className).toContain("flex-col")
    expect(header?.className).toContain("sm:flex-row")
  })
})
