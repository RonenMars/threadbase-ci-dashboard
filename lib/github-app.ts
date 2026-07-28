import { createPrivateKey, createSign } from "node:crypto"
import { env } from "@/lib/env"

const GH_API = "https://api.github.com"
const GH_API_VERSION = "2022-11-28"

/** Refresh a bit before GitHub's 1h expiry so in-flight calls don't race a 401. */
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000

type CachedToken = {
  token: string
  expiresAtMs: number
}

let cached: CachedToken | null = null
let inflight: Promise<string> | null = null

/** Vercel/env UIs often store PEMs with literal `\n` instead of real newlines. */
export function normalizePrivateKey(pem: string): string {
  const trimmed = pem.trim()
  if (trimmed.includes("-----BEGIN") && trimmed.includes("\n")) return trimmed
  return trimmed.replace(/\\n/g, "\n")
}

function base64url(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data
  return buf.toString("base64url")
}

/**
 * Short-lived RS256 JWT asserting this app (iss = app id). Used only to mint
 * installation tokens — never sent as a normal API Bearer for repo calls.
 */
export function createAppJwt(
  appId: string,
  privateKeyPem: string,
  nowSec = Math.floor(Date.now() / 1000)
): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const payload = base64url(
    JSON.stringify({
      // Backdate slightly for clock skew between this host and GitHub.
      iat: nowSec - 60,
      exp: nowSec + 9 * 60,
      iss: appId,
    })
  )
  const unsigned = `${header}.${payload}`
  const signer = createSign("RSA-SHA256")
  signer.update(unsigned)
  signer.end()
  const signature = signer.sign(createPrivateKey(normalizePrivateKey(privateKeyPem)))
  return `${unsigned}.${base64url(signature)}`
}

async function fetchInstallationToken(): Promise<CachedToken> {
  const jwt = createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY)
  const res = await fetch(
    `${GH_API}/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GH_API_VERSION,
      },
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub App installation token error: ${res.status} ${text}`)
  }
  const body = (await res.json()) as { token: string; expires_at: string }
  return {
    token: body.token,
    expiresAtMs: Date.parse(body.expires_at),
  }
}

/** Installation access token for repo/Actions API calls (cached ~55 minutes). */
export async function getInstallationToken(): Promise<string> {
  const now = Date.now()
  if (cached && cached.expiresAtMs - TOKEN_REFRESH_SKEW_MS > now) {
    return cached.token
  }
  if (!inflight) {
    inflight = fetchInstallationToken()
      .then((next) => {
        cached = next
        return next.token
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** Test helper — clears the in-memory cache between cases. */
export function resetInstallationTokenCache(): void {
  cached = null
  inflight = null
}
