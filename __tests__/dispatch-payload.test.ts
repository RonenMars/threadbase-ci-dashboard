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
vi.mock("@/lib/github-app", () => ({
  getInstallationToken: vi.fn(async () => "test-token"),
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
      await triggerDispatch(mobile, {
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
      await triggerDispatch(streamer, {
        deploy_ref: "main",
        deployment_env: "fly-prod",
        publish: true,
      })
      const { url, body } = lastRequest()
      expect(url).toContain("owner/streamer/actions/workflows/release.yml")
      expect(body.ref).toBe("main")
      // workflow_dispatch inputs are always strings, so the boolean is serialized.
      expect(body.inputs.deployment_env).toBe("fly-prod")
      expect(body.inputs.publish).toBe("true")
    })
  })

  // Both workflows echo correlation_id into run-name; it is the only handle the
  // dashboard has on the run it started, since dispatch answers 204 with no id.
  describe("correlation id", () => {
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    it("sends a generated uuid to tb-mobile and returns it", async () => {
      const returned = await triggerDispatch(getProject("tb-mobile")!, {
        deploy_ref: "main",
        platform: "all",
        target: "testflight",
        android_track: "alpha",
      })
      expect(returned).toMatch(UUID)
      expect(lastRequest().body.inputs.correlation_id).toBe(returned)
    })

    it("sends a generated uuid to tb-streamer and returns it", async () => {
      const returned = await triggerDispatch(getProject("tb-streamer")!, {
        deploy_ref: "main",
        deployment_env: "fly-demo",
        publish: false,
      })
      expect(returned).toMatch(UUID)
      expect(lastRequest().body.inputs.correlation_id).toBe(returned)
    })

    it("uses a fresh id per dispatch so runs never collide", async () => {
      const mobile = getProject("tb-mobile")!
      const inputs = {
        deploy_ref: "main",
        platform: "all",
        target: "testflight",
        android_track: "alpha",
      } as const
      const first = await triggerDispatch(mobile, { ...inputs })
      const second = await triggerDispatch(mobile, { ...inputs })
      expect(first).not.toBe(second)
    })
  })
})
