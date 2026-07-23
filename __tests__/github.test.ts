import { describe, it, expect } from "vitest"
import { mobileDispatchSchema as dispatchInputsSchema } from "@/lib/dispatch-schema"

describe("mobileDispatchSchema", () => {
  const valid = {
    deploy_ref: "main",
    platform: "ios" as const,
    target: "testflight" as const,
    android_track: "alpha" as const,
  }

  it("accepts valid minimal input", () => {
    expect(() => dispatchInputsSchema.parse(valid)).not.toThrow()
  })

  it("accepts optional release_notes", () => {
    expect(() =>
      dispatchInputsSchema.parse({ ...valid, release_notes: "v1.2 update" })
    ).not.toThrow()
  })

  it("rejects empty deploy_ref", () => {
    expect(() =>
      dispatchInputsSchema.parse({ ...valid, deploy_ref: "" })
    ).toThrow()
  })

  it("rejects invalid platform", () => {
    expect(() =>
      dispatchInputsSchema.parse({ ...valid, platform: "windows" })
    ).toThrow()
  })

  it("rejects invalid android_track", () => {
    expect(() =>
      dispatchInputsSchema.parse({ ...valid, android_track: "staging" })
    ).toThrow()
  })
})
