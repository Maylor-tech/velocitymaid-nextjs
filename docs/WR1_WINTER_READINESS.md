# WR-1 Winter Readiness — local work package notes

## Scope

Local-only product sprint for acquisition, recruitment, Home Watch discovery,
and cleaner mobile operations. No push, PR, deploy, or production changes.

## Vermont quick quote

- Path: `/vermont/quick-quote`
- Backend mode: existing `SETUP_REQUEST` on `POST /api/host-intake`
- Property/service details fold into `serviceInterest` (no schema change)
- FULL intake remains at `/vermont/host-intake`

## NJ progressive quote

- Path: `/lead/new-jersey` (unchanged URL)
- Shared validation: `lib/markets/njQuoteValidation.ts`
- Optional: street address, referral source, preferred date (when flexible)
- Quote-first: no Customer auto-create, deposit, WhatsApp booking, or nurture
- Short duplicate window (~90s) for phone+email double-taps

## Analytics events (implemented, PII-free)

| Event | Where |
| --- | --- |
| `quote_start` | VT quick quote, NJ quote |
| `quote_step_complete` | VT/NJ progressive steps |
| `quote_submit` | VT/NJ submit success |
| `market_select` | VT property type / NJ city |
| `service_select` | VT/NJ service choice |
| `recruitment_start` | Cleaner apply |
| `cleaner_applied` | Cleaner apply success (existing) |

### Downstream / future metrics (not claimed as implemented)

- Lead-to-booking conversion (ops CRM / Job creation)
- Cleaner activation after approval + certification
- Assignment coverage and on-time completion (ops + Job status timelines)
- Photo completion rates (existing QC photo events / admin review)

## Safety

Use `.env.local` in this worktree only. Loopback DB. Empty provider keys.
Do not copy `.env.staging` or production credentials.
