# Auth & GitHub access — remaining phases

Follow-on work after **Phase 1** (shipped in [#18](https://github.com/RonenMars/threadbase-ci-dashboard/pull/18)): repo/Actions API calls use a GitHub App installation token; GitHub OAuth is identity-only (`read:user user:email`).

**Goal:** support Vercel preview (hash) URLs and multiple login providers without depending on a per-user GitHub OAuth token for API access.

---

## Done — Phase 1: GitHub App for API calls

- [x] GitHub App installed on mobile + streamer repos
- [x] `GITHUB_APP_ID` / `GITHUB_APP_PRIVATE_KEY` / `GITHUB_APP_INSTALLATION_ID` in env
- [x] `lib/github-app.ts` + `lib/github.ts` use installation token
- [x] Login scopes narrowed to identity only

---

## Phase 2 — Preview login (hash Vercel URLs)

**Problem:** Preview hosts look like `tb-dashboard-<hash>-….vercel.app`. GitHub/Google OAuth apps need exact callback URLs, so Sign in with GitHub fails on those hosts.

**Approach:** Preview-only Credentials (shared access code), gated so production cannot enable it.

### Scope

- [ ] Register Auth.js Credentials provider only when `VERCEL_ENV === "preview"` (or `ENABLE_PREVIEW_AUTH=1`)
- [ ] Env: `PREVIEW_AUTH_SECRET` (required when preview auth is enabled)
- [ ] Login UI on `/`: show “Preview access code” form on preview; keep or hide GitHub button
- [ ] On success, create a normal Auth.js session with a synthetic user (e.g. `preview@local`) and a fixed role (`admin` or `deployer`)
- [ ] Fail closed: Credentials provider absent / rejected when `VERCEL_ENV === "production"`
- [ ] Optional: allowlist of emails + access code (instead of one shared identity)

### Verify

- [ ] Open a hash preview URL → enter access code → `/dashboard` works
- [ ] Refs / history / dispatch work (App token already in place)
- [ ] Production build has no Credentials path even if env is mis-set

### Out of scope for this phase

- Google OAuth
- Permanent password accounts
- Putting the secret in the URL query string

---

## Phase 3 — Multi-provider identity

**Problem:** Login is GitHub-only. Want Google (and Credentials where appropriate) while keeping one `users` row and existing roles.

**Approach:** Auth.js multiple providers + account linking by verified email. GitHub App remains the API credential.

### Scope

- [ ] Add Google provider (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`) with exact callback for production (and fixed staging host if any)
- [ ] Keep GitHub as an optional identity provider
- [ ] Link providers to the same `users` row via verified email (Auth.js `allowDangerousEmailAccountLinking` or explicit link flow — pick one and document)
- [ ] Admin users UI: show linked providers per user
- [ ] Sign-in allowlist (email and/or GitHub username) for non-production and/or production — today any successful OAuth creates a `viewer`
- [ ] Preview: keep Phase 2 Credentials; do not rely on Google/GitHub OAuth on hash URLs unless a callback proxy is added later

### Verify

- [ ] Sign in with Google on production → same roles/gates as GitHub users
- [ ] Linking: Google then GitHub (same email) → one user, not two
- [ ] Viewer / deployer / admin gates unchanged
- [ ] Dispatch still uses GitHub App (actor on GitHub remains the App)

### Out of scope for this phase

- OAuth callback proxy for arbitrary preview hosts (only needed if preview must use Google/GitHub instead of Credentials)
- Replacing Auth.js with Descope/Clerk/Auth0

---

## Phase 4 — Dispatch attribution (recommended)

**Problem:** After Phase 1, GitHub Actions shows the **App** as actor, not the human who clicked Deploy.

### Scope

- [ ] Persist `triggeredByUserId` (and name/email snapshot) when dispatch succeeds
- [ ] Surface who triggered the run in History / run detail (dashboard UI)
- [ ] Optional: pass a workflow input (e.g. `triggered_by`) if mobile/streamer workflows can echo it into `run-name` or job summary

### Verify

- [ ] Two different users dispatch → History shows the correct person for each run
- [ ] GitHub run page may still show the App; dashboard shows the human

---

## Deferred / not planned unless needed

| Idea | Why deferred |
|------|----------------|
| Per-user saved GitHub PAT | Weaker than App; secret sprawl |
| Mandatory “Connect GitHub” link for API | Unnecessary while App token works |
| OAuth callback proxy for every preview hash | Only if Phase 2 Credentials is rejected |
| Vercel Deployment Protection alone | Gates the deploy URL, not Auth.js / dashboard session |
| Wildcard OAuth callback URLs | Not supported by GitHub/Google |

---

## Suggested order

1. **Phase 2** — unblocks previewing real deploys on hash URLs
2. **Phase 4** — cheap clarity on who deployed (can parallel Phase 2)
3. **Phase 3** — multi-provider when daily Google login matters

## Related

- Original design/plan: [`../../superpowers/`](../../superpowers/)
- Admin invite/block ideas: [`../../superpowers/plans/admin-next-steps.md`](../../superpowers/plans/admin-next-steps.md)
