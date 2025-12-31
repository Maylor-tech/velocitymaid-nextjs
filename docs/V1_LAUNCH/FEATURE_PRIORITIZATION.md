# VelocityMaid V1 — Feature Prioritization

**Purpose:** Clear separation of demo-critical vs. post-launch features  
**Decision Framework:** Must-have for demo vs. nice-to-have for launch

---

## Demo-Critical Features (Must Work)

### Core Compliance
- ✅ **W-9 Collection** — Cleaner self-service form
- ✅ **W-9 Verification** — Admin one-click verification
- ✅ **Compliance Checklist** — Visual status dashboard
- ✅ **Status Lifecycle** — NOT_STARTED → SUBMITTED → VERIFIED

### Governance & Reporting
- ✅ **1099 Readiness Score** — Jan 31 countdown and blockers
- ✅ **Investor PDF Export** — Professional, non-sensitive summary
- ✅ **Board PDF Export** — Year-end compliance summary
- ✅ **Data Room ZIP Export** — Signed checksum manifest included
- ✅ **Partner Pilot Proposal PDF** — Branded, audience-specific

### Admin Infrastructure
- ✅ **Role-Based Access** — Admin vs. Cleaner separation
- ✅ **Admin Dashboard** — Central oversight
- ✅ **Contact Message System** — Inbound management
- ✅ **Reply Templates** — Role-filtered, UI-managed
- ✅ **Internal Notes** — Admin context (not emailed)
- ✅ **Conversation Export** — PDF for diligence

### Security & Audit
- ✅ **Cryptographic Signing** — Ed25519 manifest signatures
- ✅ **SHA-256 Checksums** — File integrity verification
- ✅ **Audit Trails** — Timestamped actions
- ✅ **No Sensitive Data Exposure** — TIN masking, safe PDFs

---

## Post-Launch Features (Not Demo-Critical)

### Payment Infrastructure (Staged)
- ⏸️ **Stripe Connect** — Placeholder page only
- ⏸️ **Payout Processing** — Not in V1
- ⏸️ **Payment Ledger** — Schema exists, not activated

### Advanced Features
- ⏸️ **Multi-Year Archives** — Auto-archive after Jan 31 (scheduled)
- ⏸️ **Call List & Scripts** — 1099 outreach tools (scheduled)
- ⏸️ **Advanced Analytics** — Year-over-year trends
- ⏸️ **Bulk Operations** — Mass status updates

### Operational Enhancements
- ⏸️ **Email Notifications** — Automated reminders (cron ready)
- ⏸️ **SLA Tracking** — Response time metrics
- ⏸️ **Template Variables** — Dynamic content in replies
- ⏸️ **CRM Integration** — External system sync

### User Experience
- ⏸️ **Mobile Optimization** — Responsive improvements
- ⏸️ **Dark Mode** — UI theme option
- ⏸️ **Keyboard Shortcuts** — Power user features
- ⏸️ **Bulk Export** — Multiple conversations at once

---

## Feature Status Legend

- ✅ **Demo-Critical** — Must work for V1 demo
- ⏸️ **Post-Launch** — Planned but not required for V1
- 🚫 **Not Planned** — Out of scope for V1

---

## Launch Decision Matrix

| Feature | Demo Required? | Launch Required? | Status |
|---------|---------------|------------------|--------|
| W-9 Collection | ✅ Yes | ✅ Yes | ✅ Complete |
| W-9 Verification | ✅ Yes | ✅ Yes | ✅ Complete |
| Readiness Score | ✅ Yes | ✅ Yes | ✅ Complete |
| Investor PDF | ✅ Yes | ✅ Yes | ✅ Complete |
| Data Room Export | ✅ Yes | ✅ Yes | ✅ Complete |
| Contact System | ✅ Yes | ✅ Yes | ✅ Complete |
| Reply Templates | ✅ Yes | ✅ Yes | ✅ Complete |
| Stripe Connect | ❌ No | ⏸️ Later | ⏸️ Placeholder |
| Payment Processing | ❌ No | ⏸️ Later | ⏸️ Not Started |
| Auto-Archive | ⏸️ Nice-to-Have | ✅ Yes | ⏸️ Scheduled |

---

## V1 Launch Criteria

**Must Have (Blocking):**
- All demo-critical features working
- No critical bugs in demo flow
- Security and audit trails functional
- PDF exports professional and accurate

**Should Have (Non-Blocking):**
- Contact system fully operational
- Template management UI complete
- Internal notes functional

**Nice to Have (Post-Launch):**
- Auto-archive cron jobs
- Call list generation
- Advanced analytics

---

**Last Updated:** 2025-01-03  
**Version:** V1.0

