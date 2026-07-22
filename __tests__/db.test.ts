import { describe, it, expect } from "vitest"
import { users } from "@/lib/db/schema"

describe("schema", () => {
  it("users table has role column with correct enum", () => {
    expect(users.role).toBeDefined()
    expect(users.role.enumValues).toEqual(["admin", "deployer", "viewer"])
  })

  it("users table has github_id column", () => {
    expect(users.githubId).toBeDefined()
  })

  it("role column defaults to viewer and is not null", () => {
    expect(users.role.default).toBe("viewer")
    expect(users.role.notNull).toBe(true)
  })
})
