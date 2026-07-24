import { describe, expect, it } from "vitest"
import { availablePopoverHeight } from "@/components/ref-combobox"

describe("availablePopoverHeight", () => {
  it("uses space above when the trigger sits near the bottom of the viewport", () => {
    // Keyboard open: short visual viewport, trigger near bottom (as on iPhone).
    expect(
      availablePopoverHeight({
        triggerTop: 280,
        triggerBottom: 312,
        viewportTop: 0,
        viewportHeight: 360,
        padding: 12,
      }),
    ).toBe(268) // 280 - 0 - 12
  })

  it("uses space below when the trigger sits near the top", () => {
    expect(
      availablePopoverHeight({
        triggerTop: 40,
        triggerBottom: 72,
        viewportTop: 0,
        viewportHeight: 700,
        padding: 12,
      }),
    ).toBe(616) // 700 - 72 - 12
  })

  it("accounts for a scrolled visual viewport offset", () => {
    expect(
      availablePopoverHeight({
        triggerTop: 200,
        triggerBottom: 232,
        viewportTop: 80,
        viewportHeight: 300,
        padding: 12,
      }),
    ).toBe(136) // max(200-80-12, 80+300-232-12) = max(108, 136)
  })

  it("never returns a negative height", () => {
    expect(
      availablePopoverHeight({
        triggerTop: 10,
        triggerBottom: 50,
        viewportTop: 0,
        viewportHeight: 40,
        padding: 12,
      }),
    ).toBe(0)
  })
})
