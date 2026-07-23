# Multi-repo deployments: manage tb-streamer alongside tb-mobile

**Status:** implemented — projects registry, per-project dispatch forms, and project-scoped history/webhooks are live.

**Goal:** the dashboard currently manages deploys for one repo (`tb-mobile`, hardcoded via `GITHUB_REPO` / `GITHUB_WORKFLOW_ID`). Extend it to also manage **`tb-streamer`** deploys, so the operator picks which project to deploy and sees each project's run history.

## The two projects differ in deploy model
This is the crux — they are not the same shape, and a naive "second repo" won't fit.

| | tb-mobile | tb-streamer |
|---|---|---|
| Repo | `RonenMars/threadbase-mobile` | `RonenMars/tb-streamer` |
| Workflow | `deploy.yml` | `release.yml` |
| Target | App Store / Play Store (Fastlane) | Fly.io (`threadbase` prod, `threadbase-demo`) |
| Dispatch inputs | `platform`, `target`, `android_track`, `deploy_ref`, `release_notes` | `publish` (boolean), plus the git ref |
| Release model | version bump PR auto-merged | semantic-release on push to `main`/`next` |

So the dispatch **form is per-project**: tb-mobile's five-field form vs. tb-streamer's much simpler publish toggle. The current single hardcoded `DispatchInputs` schema won't cover both.

## Design sketch

### Config, not env
Replace the two hardcoded env vars with a **projects registry** — a small typed config (`lib/projects.ts`) listing each deployable project:
```
{
  id: "tb-mobile",
  label: "Threadbase Mobile",
  repo: "RonenMars/threadbase-mobile",
  workflow: "deploy.yml",
  inputsSchema: mobileDispatchSchema,   // the existing schema
  formComponent: MobileDispatchForm,
}
{
  id: "tb-streamer",
  label: "Threadbase Streamer",
  repo: "RonenMars/tb-streamer",
  workflow: "release.yml",
  inputsSchema: streamerDispatchSchema, // { ref, publish: boolean }
  formComponent: StreamerDispatchForm,
}
```
Keep the values in env for secrets/overrides, but the *shape* lives in code because each project has a different input schema and form.

### API changes
- `/api/refs`, `/api/runs`, `/api/dispatch` take a `project` param (query or body), look the project up in the registry, and use its repo/workflow. Reject unknown project ids.
- `getRefs` / `getRuns` / `triggerDispatch` in `lib/github.ts` become parameterized by `(repo, workflow)` instead of reading module-level constants.
- The dispatch route validates against the **selected project's** schema, not a single global one.

### UI changes
- **Project switcher** on the dashboard and history (a Select or the same command-palette combobox), defaulting to tb-mobile.
- The dispatch form is chosen by the selected project (`formComponent`), so tb-streamer shows a publish toggle + ref picker, tb-mobile keeps its five fields.
- History filters runs by the selected project.

### Webhook / real-time
- Register the same `/api/webhook` on `tb-streamer` too (its `workflow_run` events).
- The Redis event entries need a `project` tag so the SSE stream and history can filter by project. Today the `ci:events` list is global; make it `ci:events:<project>` or add a `project` field to each entry.

## Roles
Role gating stays the same (deployer/admin can dispatch), but consider **per-project roles** later — someone might deploy streamer but not mobile. Out of scope for v1; note it.

## Verification
- Switch to tb-streamer on the dashboard → the form shows the publish toggle + ref picker; `/api/refs?project=tb-streamer` returns tb-streamer's branches/tags.
- Dispatch a tb-streamer publish → a run appears in tb-streamer's `release.yml` with the correct ref.
- History switched to tb-streamer shows only tb-streamer runs; a tb-streamer webhook pushes live to that view and not to tb-mobile's.
- Unknown `project` id → 400.

## Scope note (ponytail)
This is the largest roadmap item — it touches config, three API routes, `lib/github.ts`, the form, history, and the webhook/Redis keying.
Ship it in stages: (1) the projects registry + parameterized `lib/github.ts` + project param on read-only routes (refs/runs), (2) the tb-streamer form + dispatch, (3) per-project webhook/Redis keying for real-time. Each stage is its own PR.
