# Phase 1D-B — Pilot property stay card installation record

Ops template for a 1–2 property physical pilot. **Do not** store this in Prisma yet.

Copy into Notion / Google Sheet / ops checklist. One row per installed card version.

| Field | Example / notes |
| --- | --- |
| Property (internal id + name) | Ops only — never printed on card |
| guestDisplayName | Must match QR-ready display name |
| tokenCreatedAt | From guest-access GET `tokenCreatedAt` |
| cardVersion | `VM-STAY-CARD-v1` |
| qrTested (pre-print) | Date + tester initials; phone scan → `/stay` |
| ownerApproval | Date + channel (email / text) |
| printDate | |
| installationDate | |
| physicalPlacement | e.g. kitchen binder / entry console |
| installedBy | |
| lastTested (post-install) | |
| status | `ACTIVE` \| `INVALID` \| `REPRINT_REQUIRED` |
| replacementRequiredAfterRotateRevoke | Always true when rotate/revoke confirmed |

## Status transitions

`ACTIVE` → rotate/revoke (confirmed) → `INVALID` / `REPRINT_REQUIRED` → old card removed → new QR tested → `ACTIVE`

## Encoded QR payload

Opaque stay URL only (`https://…/stay/[token]`). Never Job ID, grant token, Google Review URL, or referral URL.
