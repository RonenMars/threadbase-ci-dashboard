import crypto from "crypto"

export function validateGitHubSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!signature.startsWith("sha256=")) return false
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  } catch {
    return false
  }
}
