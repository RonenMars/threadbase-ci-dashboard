import { describe, it, expect } from "vitest"
import { canDeploy, isAdmin } from "@/lib/roles"

// Proxy logic is thin wrappers around role helpers — test the helpers directly.
// Full proxy integration is verified manually in Step 10.

describe("proxy role gates", () => {
  it("viewer cannot deploy", () => expect(canDeploy("viewer")).toBe(false))
  it("deployer can deploy", () => expect(canDeploy("deployer")).toBe(true))
  it("admin can deploy", () => expect(canDeploy("admin")).toBe(true))
  it("only admin passes isAdmin", () => {
    expect(isAdmin("admin")).toBe(true)
    expect(isAdmin("deployer")).toBe(false)
    expect(isAdmin("viewer")).toBe(false)
  })
})
