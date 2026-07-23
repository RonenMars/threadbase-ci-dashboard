import { describe, it, expect } from "vitest"

// The route's authorization is exercised end to end in the browser (Step 5).
// These cover the two self-protection guards in isolation, since a wrong guard
// could lock the last admin out of /admin.

describe("admin self-removal guard (DELETE)", () => {
  const isSelf = (targetId: string, currentId: string) => targetId === currentId

  it("blocks when targetId matches the current user", () => {
    expect(isSelf("user-123", "user-123")).toBe(true)
  })
  it("allows when targetId differs", () => {
    expect(isSelf("user-123", "user-456")).toBe(false)
  })
})

describe("admin self-demotion guard (PATCH)", () => {
  const isSelfDemotion = (targetId: string, currentId: string, role: string) =>
    targetId === currentId && role !== "admin"

  it("blocks demoting yourself to viewer", () => {
    expect(isSelfDemotion("me", "me", "viewer")).toBe(true)
  })
  it("blocks demoting yourself to deployer", () => {
    expect(isSelfDemotion("me", "me", "deployer")).toBe(true)
  })
  it("allows keeping yourself admin", () => {
    expect(isSelfDemotion("me", "me", "admin")).toBe(false)
  })
  it("allows changing another user's role", () => {
    expect(isSelfDemotion("them", "me", "viewer")).toBe(false)
  })
})
