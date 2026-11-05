# Admin authentication rollout

Production deployment is on hold. Do not set the production signing secret or production admin passwords, and do not promote this branch, until this draft is reviewed.

Verification for this change is local and uses fictional accounts only (`owner@example.test`, `multi@example.test`, `single@example.test`). No production database, customer email, or live admin account was used.

## What changed

- `admin_session` is an HMAC-signed cookie (`ADMIN_SESSION_SECRET`, audience `velocitymaid-admin-v1`) that expires after 30 minutes.
- Every active admin must present a configured password. A matching email alone, several branch memberships, or `admin_session=true` no longer signs a session.
- Protected admin requests recheck that the user is an active `ADMIN` and that the signed branch ids still match `UserBranch`. A removed membership or inactive account fails closed.
- Owner authority is `ADMIN_EMAIL` only. Branch count does not grant it. Global invoice routes and `assertOwnerAuthorization` reject everyone else, including a multi-branch admin.

## Session readers

These now verify the signed cookie and, on the server, the live account:

- `middleware.ts` for `/admin`, `/dashboard`, and `/api/admin`
- `requireRole` and `getAdminAuthFromCookies` (`lib/auth/requireRole.ts`)
- `app/admin/layout.tsx` through `getAdminAuthFromCookies`
- `app/api/auth/admin-login/route.ts` issues the cookie
- `app/api/auth/admin-logout/route.ts` deletes it

## Legacy admin identity removed

These callers used to accept an unsigned cookie or a caller-supplied id. They no longer do:

- `requireRole`: `adminId` cookie, `adminSession` cookie, `x-admin-id`, `Authorization: Bearer <user id>`, and `admin_session=true`
- `requireAuth`: the same admin cookies and headers. SaaS still uses `saas_token`, then `saas_user_id`
- `app/api/admin/payment-methods/pending/route.ts`
- `app/api/admin/payment-methods/[id]/approve/route.ts`
- `app/api/admin/payment-methods/[id]/reject/route.ts`
- `app/api/admin/payment-methods/[id]/verify/route.ts`
- Middleware acceptance of any JSON `admin_session` that merely contained `userId`

Not admin-session identity, left unchanged:

- `x-admin-seed-secret` on `app/api/admin/seed/admin/route.ts` and `app/api/admin/find-admin-id/route.ts`
- `saas_token` and `saas_user_id`
- Stored `adminId` columns on payout and audit rows
- `scripts/billing-e2e-verify.ts` and `scripts/deposit-e2e-verify.ts`, which log in over HTTP. They need the new password and secret before they can run. They are not a production step.

## Multi-branch access, unchanged pending selection

A non-owner with more than one membership is not branch-scoped and is not the owner. This PR does not put them on the single-branch allowlist and does not add a branch picker. Their existing admin pages stay reachable. These routes are the ones that allowlist does **not** limit them to today:

Pages outside `/admin`, `/admin/jobs`, `/admin/feedback`, and `/admin/profitability`, including invoices, payouts, cleaners, customers, settings, and reports.

APIs outside the branch-scoped job, feedback, command-center, and owner-profitability allowlist, including payouts, finance overview, cleaners, customers, and settings.

This PR does change two owner gates that branch count used to unlock:

- `/api/admin/invoices` and nested invoice actions require `isOwner`
- `assertSuperAdmin` / `assertOwnerAuthorization`, including `/api/admin/dashboard/operations`, requires `isOwner`

A multi-branch admin can still open the invoice screens. The invoice API returns 403 until they are the explicit owner or a reviewed branch-selection model says otherwise.

## Proposed branch selection

Do not build this until it is reviewed.

1. After a successful password login, a non-owner with more than one current membership chooses one of those branches. The choice is not a request field on later API calls.
2. Login re-issues the signed session with that `branchId` and `isBranchScoped: true`.
3. Every protected request rechecks that the user is active and that `branchId` is still in `UserBranch`. A removed membership ends the session.
4. Page and API access then use the existing single-branch allowlist.
5. Changing branch is a separate authenticated action that re-issues the cookie. The browser cannot widen the signature.
6. The `ADMIN_EMAIL` owner remains the only unscoped account and the only account that can call global billing.

## Credential setup checklist

Use a preview or other isolated environment first. Keep production unset.

1. Generate `ADMIN_SESSION_SECRET` with at least 32 random characters. Store it as an environment secret. Do not commit it, log it, or reuse `PREVIEW_ADMIN_SESSION_SECRET`.
2. Set `ADMIN_EMAIL` to the one owner account.
3. For every active admin, including the owner, set `ADMIN_PASSWORD_<EMAIL>` where `@` and `.` in the email become `_`, uppercased. Example shape: `ADMIN_PASSWORD_OWNER_EXAMPLE_TEST`. Each value must be at least 16 characters. The existing `CARYLL_ADMIN_PASSWORD` name still applies to that one address.
4. Confirm each active admin has at least one `UserBranch` row. Login returns 403 without one.
5. Deploy only to the isolated preview. Unsigned cookies, `admin_session=true`, `adminId`, `adminSession`, `x-admin-id`, and bearer user ids fail. Everyone must sign in again.
6. Sign in as the fictional or preview owner and as a single-branch admin. Confirm the owner can open invoices and the single-branch admin cannot.
7. Sign in as a multi-branch non-owner. Confirm their existing non-invoice pages still open, and that `GET /api/admin/invoices` returns 403.
8. Deactivate a test admin and remove a test membership. The next request must reject the old cookie.
9. Wait 30 minutes or rotate `ADMIN_SESSION_SECRET` and confirm the old cookie is rejected.
10. Leave production `ADMIN_SESSION_SECRET` and production admin passwords unset until a separate release review. Rotating the secret or shipping this change forces every admin to log in again.
