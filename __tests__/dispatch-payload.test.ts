import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// lib/projects reads validated env at import time; stub what it needs.
vi.mock("@/lib/env", () => ({
  env: {
    TB_MOBILE_REPO: "owner/mobile",
    TB_MOBILE_WORKFLOW_ID: "deploy.yml",
    TB_STREAMER_REPO: "owner/streamer",
    TB_STREAMER_WORKFLOW_ID: "release.yml",
  },
}))
// triggerDispatch calls getGitHubToken in-module, so intercept at the db layer:
// select().from().where() resolves to a single account row holding the token.
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({ where: async () => [{ access_token: "test-token" }] }),
    }),
  },
}))

const { triggerDispatch } = await import("@/lib/github")
const { getProject } = await import("@/lib/projects")

describe("triggerDispatch payload", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })))
  })
  afterEach(() => vi.unstubAllGlobals())

  function lastRequest() {
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    return { url: url as string, body: JSON.parse(init.body as string) }
  }

  describe("tb-mobile", () => {
    const mobile = getProject("tb-mobile")!

    async function dispatchAndReadBody(release_notes?: string) {
      await triggerDispatch("user-1", mobile, {
        deploy_ref: "feat/my-branch",
        platform: "all",
        target: "testflight",
        android_track: "alpha",
        ...(release_notes ? { release_notes } : {}),
      })
      return lastRequest().body
    }

    it("targets the mobile repo + workflow", async () => {
      await dispatchAndReadBody()
      expect(lastRequest().url).toContain("owner/mobile/actions/workflows/deploy.yml")
    })

    it("sends deploy_ref as the git ref", async () => {
      const body = await dispatchAndReadBody()
      expect(body.ref).toBe("feat/my-branch")
    })

    // deploy.yml checks out `inputs.deploy_ref`, not the dispatch `ref`. If this
    // is dropped, every run silently builds the workflow default ("main").
    it("also passes deploy_ref through as a workflow input", async () => {
      const body = await dispatchAndReadBody()
      expect(body.inputs.deploy_ref).toBe("feat/my-branch")
    })

    it("omits release_notes when not provided", async () => {
      const body = await dispatchAndReadBody()
      expect(body.inputs).not.toHaveProperty("release_notes")
    })

    it("includes release_notes when provided", async () => {
      const body = await dispatchAndReadBody("what's new")
      expect(body.inputs.release_notes).toBe("what's new")
    })
  })

  describe("tb-streamer", () => {
    const streamer = getProject("tb-streamer")!

    it("targets the streamer repo + workflow and serializes publish", async () => {
      await triggerDispatch("user-1", streamer, {
        deploy_ref: "main",
        publish: true,
      })
      const { url, body } = lastRequest()
      expect(url).toContain("owner/streamer/actions/workflows/release.yml")
      expect(body.ref).toBe("main")
      // workflow_dispatch inputs are strings, so the boolean is serialized.
      expect(body.inputs.publish).toBe("true")
    })
  })
})
