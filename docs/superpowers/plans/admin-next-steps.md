# Admin Panel — Next Steps Plan

> Planning doc for the next iteration of `/admin`. Not yet implemented.
> Current state (shipped in PR #3): list users, change role, remove user, with self-lockout guards.

The three features below are ordered by dependency: **invite** and **block** both need a schema change, so they share a migration; **audit log** is additive and can land independently.

---

## Feature 1: Invite user

**Goal:** an admin pre-authorizes a person before their first sign-in, choosing their role, instead of everyone landing as `viewer` and waiting to be promoted.

**The core question — how is identity matched?** GitHub OAuth gives us the user's `email` and GitHub `login` at sign-in. An invite must key on one of those so the role attaches when they first sign in. Email is the safer key (stable, unique in our schema); GitHub login is friendlier to type. Recommend keying on **email**, with GitHub username as an optional display hint.

### Schema
New table `invitations`:
```
id            text pk
email         text not null unique   -- lowercased match key
role          text not null          -- role to assign on first sign-in
invited_by    text -> users.id
created_at    timestamp
accepted_at   timestamp null         -- set when the invited user first signs in
```

### Auth wiring
In the `signIn` / `session` callback (where first-user-admin already lives): when a new user row is created, look up `invitations` by lowercased email. If a pending invite exists, assign its `role` (instead of the default `viewer`) and stamp `accepted_at`. This slots next to the existing bootstrap logic.

### API + UI
- `POST /api/admin/invitations` — `{ email, role }`, admin-only, zod-validated, reject duplicate/existing-user emails.
- `GET /api/admin/invitations` — list pending invites.
- `DELETE /api/admin/invitations?id=` — revoke a pending invite.
- Admin page: an "Invite" form (email + role Select) above the user table, and a "Pending invitations" section showing un-accepted invites with a revoke button.

### Edge cases
- Email already belongs to an existing user → 409, "already a member".
- Duplicate pending invite → update the role rather than erroring.
- Invited email never signs in → invite stays pending; revocable.

### Verification
- Invite an email as `deployer`, sign in with that GitHub account → lands as `deployer`, invite marked accepted.
- Invite an existing member's email → 409.

---

## Feature 2: Block user

**Goal:** revoke dashboard access **reversibly**, without deleting the row (which loses their history/token association). A blocked user can sign in via GitHub but is denied at the app boundary.

### Schema
Add to `users`:
```
status text not null default 'active'   -- 'active' | 'blocked'
```
(One migration can carry both this and the `invitations` table from Feature 1.)

### Enforcement — the important part
Blocking must be checked in **two** places, because a session may already exist when an admin blocks someone:
1. **`session` callback** — read `status`; if `blocked`, either return a session flagged blocked or (simpler) treat as unauthorized downstream.
2. **`proxy.ts` (middleware)** — the natural gate. If the session's user is blocked, redirect to a `/blocked` page (or `/` with a message) for all protected routes, and 403 all `/api/*` except auth. This catches an already-signed-in user the instant they're blocked.

Since `status` isn't in the session today, the cleanest path is to surface it on the session (like `role`) so the proxy can read it without a DB call per request. Note: the session callback already does one DB read for `role` — fold `status` into the same query, no extra round-trip.

### API + UI
- `PATCH /api/admin/users?id=` extended to accept `{ status }` (or a dedicated `/block` route).
- Self-block guard: an admin cannot block themselves (mirrors the existing self-demote/self-delete guards).
- Admin page: a "Block"/"Unblock" toggle per row; blocked rows render muted with a "blocked" status pill (the design system's danger pill fits).

### Verification
- Block a signed-in deployer → their next navigation redirects to `/blocked`; their `/api/dispatch` returns 403.
- Unblock → access restored.
- Admin cannot block own row (button disabled + API 400).

---

## Feature 3: Audit log

**Goal:** a record of admin/deploy actions (who, what, when) for accountability. Additive — no dependency on the above.

### Schema
New table `audit_events`:
```
id          text pk
actor_id    text -> users.id
action      text not null    -- 'role_changed' | 'user_removed' | 'user_invited'
                             --  'user_blocked' | 'user_unblocked' | 'deploy_dispatched'
target      text null        -- affected user id or deploy ref, human-readable
metadata    jsonb null       -- e.g. { from: 'viewer', to: 'admin' }
created_at  timestamp
```

### Write points
A small `logAudit(actorId, action, target, metadata)` helper, called from:
- `PATCH`/`DELETE /api/admin/users` (role change, removal)
- the invite/block routes (Features 1–2)
- `POST /api/dispatch` (deploy_dispatched — ties the audit log to the real product action)

### UI
- `GET /api/admin/audit?limit=` — recent events, admin-only.
- Admin page: an "Activity" section below the user table, each row = actor avatar + action sentence + relative time. Reuse the design system's table + mono-for-identifiers treatment.

### Verification
- Change a role → an `role_changed` event appears with `{ from, to }`.
- Dispatch a deploy → a `deploy_dispatched` event with the ref.

### Scope note (ponytail)
Audit is the biggest of the three and the least urgent for a personal tool. If cutting scope, ship invite + block first; audit can follow once there's more than one admin who needs accountability.

---

## Suggested sequencing

1. **One migration** adding `invitations` table + `users.status` column.
2. **Invite** (schema + auth wiring + API + UI).
3. **Block** (reuses the migration; middleware enforcement is the main work).
4. **Audit log** (independent; can slot in any time, or be deferred).

Each is its own PR per the branch/PR workflow.
