import { describe, it, expect } from "vitest"
import crypto from "crypto"
import { validateGitHubSignature } from "@/lib/webhook"

const SECRET = "test-secret"
const BODY = JSON.stringify({ action: "completed" })
const VALID_SIG = `sha256=${crypto
  .createHmac("sha256", SECRET)
  .update(BODY)
  .digest("hex")}`

describe("validateGitHubSignature", () => {
  it("accepts a valid HMAC signature", () => {
    expect(validateGitHubSignature(BODY, VALID_SIG, SECRET)).toBe(true)
  })

  it("rejects a wrong signature", () => {
    expect(validateGitHubSignature(BODY, "sha256=deadbeef", SECRET)).toBe(false)
  })

  it("rejects a tampered body", () => {
    expect(validateGitHubSignature(BODY + "x", VALID_SIG, SECRET)).toBe(false)
  })

  it("rejects a missing sha256= prefix", () => {
    expect(validateGitHubSignature(BODY, "invalid", SECRET)).toBe(false)
  })

  it("rejects mismatched buffer lengths gracefully", () => {
    expect(validateGitHubSignature(BODY, "sha256=abc", SECRET)).toBe(false)
  })
})
