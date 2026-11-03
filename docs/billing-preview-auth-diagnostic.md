# Temporary billing Preview authentication and diagnostic

Scope: codex/branded-invoice-reminders, PR #81 (draft). No Production deployment.
Only VERCEL_ENV=preview activates the new login/session enforcement. Production's
legacy paths are intentionally unchanged, NOT certified secure or approved for release.

Private configuration, on the billing branch's Preview target only:
- ADMIN_PASSWORD_STAGING_ADMIN_EXAMPLE_TEST: unique password, at least 16 characters.
- PREVIEW_ADMIN_SESSION_SECRET: independent random signing secret, at least 32 characters.
Enter as sensitive Vercel settings. Never commit, log or paste their values into chat.
Missing configuration fails closed. No development fallback signing key exists.

Preview login only accepts the existing active staging.admin@example.test administrator.
Every branch count requires password verification. No accounts, activity flags, role
assignments or UserBranch memberships are written. The inactive VT-only account remains
unchanged. Existing multi-branch authorization semantics are retained, not broadened.

Sessions: HMAC-SHA256 via Web Crypto, 30-minute absolute expiry, Preview-specific audience,
HttpOnly/Secure/SameSite=Strict host-only cookie. Middleware rejects unsigned/editable
legacy cookies and identity headers. Data access revalidates active user and exact
current memberships. Session changes and key rotation require a new login. Browser
cookies must never be fabricated to bypass authentication.

Historical diagnostic (removed by the cleanup change):
GET /api/admin/preview-isolation:
- Empty 404 outside Preview, before environment/auth/database reporting.
- Signed administrator session required; no provider calls.
- Credential presence, safety flags and generated invoice origin checks only.
- Connection identity checked with read-only transaction and pg_roles metadata, only
  when DATABASE_URL explicitly matches the previously verified staging project.
- No customer records inspected. fictionalRecords stays unverified.
- No secrets, URLs, raw role names, exception details or tokens returned; no-store.

Broader pre-existing authentication issues (separate release blockers):
- Production legacy admin login skips password for multi-branch/owner accounts.
- Production paths still accept editable JSON identity cookies / identity aliases.
- Multi-branch membership is treated as global admin access by legacy authorization.
- This temporary patch is not a full account/session/rate-limit/RBAC modernization.
Keep Production release blocked pending a separately reviewed authentication remediation.

Cleanup implementation:
The temporary diagnostic route and its dedicated tests are deleted. Its constants were
local to the deleted route. Signed-session/password protection and its regression tests
remain. The diagnostic-only login response flag and redirect are removed; successful
login uses the existing /admin/jobs destination. The restricted role is not authorized
for job access, so do not use that page as a staging acceptance test; check /api/admin/me
directly after login. Unexpected Invoice GET/PATCH errors now use fixed public messages; explicit
authorization responses and known invoice validation responses remain intact.

Deployment verification still required:
Redeploy protected Preview, log in, verify /api/admin/me, then verify the removed
/api/admin/preview-isolation path returns 404. Confirm a denied Invoice GET contains
only the fixed error message, with no SQL, database identity or connection details.
Do not exercise invoice writes using this read-only role. Production is not deployed
or certified by this cleanup. Do not remove signed-session/password protection merely
to remove diagnostics. Before merging/releasing, replace this temporary Preview-only
auth repair with an approved broader auth solution; never revert to passwordless access.
No production actions, migrations, account changes or reminder activation authorized.
