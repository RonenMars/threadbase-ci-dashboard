import { generateKeyPairSync } from "node:crypto"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
})

vi.mock("@/lib/env", () => ({
  env: {
    GITHUB_APP_ID: "123456",
    GITHUB_APP_PRIVATE_KEY: privateKey,
    GITHUB_APP_INSTALLATION_ID: "987654",
  },
}))

const {
  normalizePrivateKey,
  createAppJwt,
  getInstallationToken,
  resetInstallationTokenCache,
} = await import("@/lib/github-app")

describe("normalizePrivateKey", () => {
  it("expands literal \\n sequences used in env UIs", () => {
    expect(normalizePrivateKey("-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----")).toBe(
      "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----"
    )
  })

  it("leaves real multiline PEMs alone", () => {
    const pem = "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----"
    expect(normalizePrivateKey(pem)).toBe(pem)
  })
})

describe("createAppJwt", () => {
  it("returns a three-part RS256 JWT with iss/iat/exp claims", () => {
    const now = 1_700_000_000
    const jwt = createAppJwt("123456", privateKey, now)
    const [headerB64, payloadB64, signatureB64] = jwt.split(".")
    expect(headerB64 && payloadB64 && signatureB64).toBeTruthy()
    const payload = JSON.parse(Buffer.from(payloadB64!, "base64url").toString("utf8"))
    expect(payload).toEqual({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: "123456",
    })
  })
})

describe("getInstallationToken", () => {
  beforeEach(() => {
    resetInstallationTokenCache()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    resetInstallationTokenCache()
  })

  it("mints via the installation access_tokens endpoint and caches", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        {
          token: "ghs_test",
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        { status: 201 }
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(getInstallationToken()).resolves.toBe("ghs_test")
    await expect(getInstallationToken()).resolves.toBe("ghs_test")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const call = fetchMock.mock.calls[0] as unknown as [
      string,
      { method?: string; headers?: Record<string, string> },
    ]
    expect(call[0]).toBe(
      "https://api.github.com/app/installations/987654/access_tokens"
    )
    expect(call[1].method).toBe("POST")
    expect(call[1].headers?.Authorization).toMatch(/^Bearer eyJ/)
  })

  it("surfaces GitHub errors when minting fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 401 }))
    )
    await expect(getInstallationToken()).rejects.toThrow(
      /installation token error: 401/
    )
  })
})
