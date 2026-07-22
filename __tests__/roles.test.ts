import { describe, it, expect } from "vitest"
import { canDeploy, isAdmin } from "@/lib/roles"

describe("canDeploy", () => {
  it("returns true for admin", () => expect(canDeploy("admin")).toBe(true))
  it("returns true for deployer", () => expect(canDeploy("deployer")).toBe(true))
  it("returns false for viewer", () => expect(canDeploy("viewer")).toBe(false))
  it("returns false for undefined", () => expect(canDeploy(undefined)).toBe(false))
})

describe("isAdmin", () => {
  it("returns true for admin", () => expect(isAdmin("admin")).toBe(true))
  it("returns false for deployer", () => expect(isAdmin("deployer")).toBe(false))
  it("returns false for viewer", () => expect(isAdmin("viewer")).toBe(false))
})
