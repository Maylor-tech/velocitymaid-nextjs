# VelocityMaid V1 — Canonical Demo Flow

**Purpose:** Single, repeatable demo that showcases core value proposition  
**Duration:** 10-15 minutes  
**Audience:** Investors, partners, board members

---

## Demo Flow Overview

**Act 1: Cleaner Onboarding (3-4 min)**  
**Act 2: Admin Governance (4-5 min)**  
**Act 3: Governance Explanation (3-4 min)**

---

## ACT 1: Cleaner Onboarding

### Step 1: Cleaner Login
- **URL:** `/cleaner/login`
- **Action:** Log in as a new cleaner (use test identifier)
- **Outcome:** Lands on `/cleaner/compliance` dashboard
- **Key Message:** "Cleaners see their compliance status immediately"

### Step 2: W-9 Submission
- **URL:** `/cleaner/tax-form`
- **Action:** 
  - Fill in legal name, address, tax classification, TIN
  - Save draft (optional)
  - Submit final W-9
- **Outcome:** Return to `/cleaner/compliance`, see W-9 status = "SUBMITTED"
- **Key Message:** "Self-service W-9 collection, no admin overhead"

### Step 3: Compliance Dashboard
- **URL:** `/cleaner/compliance`
- **Action:** Review checklist (W-9, Stripe placeholder, statements)
- **Outcome:** Clear visual of what's complete vs. incomplete
- **Key Message:** "Cleaners understand exactly what's needed"

---

## ACT 2: Admin Governance

### Step 4: Admin Login
- **URL:** `/admin/login`
- **Action:** Switch to admin account (separate browser session)
- **Outcome:** Admin dashboard
- **Key Message:** "Role separation is enforced"

### Step 5: W-9 Verification
- **URL:** `/admin/taxes/1099`
- **Action:**
  - Locate the cleaner from Step 2
  - Open their W-9
  - Click "Verify"
- **Outcome:** Status updates to "VERIFIED"
- **Key Message:** "Admin oversight with one-click verification"

### Step 6: Readiness Score
- **URL:** `/admin/taxes/1099?year=2025`
- **Action:** Observe:
  - Jan 31 Readiness Score
  - Countdown banner
  - Top blockers list
- **Outcome:** Clear visibility into compliance posture
- **Key Message:** "Proactive readiness, not reactive compliance"

### Step 7: Investor PDF
- **URL:** `/admin/taxes/1099/analytics`
- **Action:** Click "Download Investor Summary (PDF)"
- **Outcome:** Open PDF, verify:
  - No sensitive data exposed
  - Professional formatting
  - Branded cover page
- **Key Message:** "Investor-ready artifacts, zero manual work"

### Step 8: Data Room Export
- **URL:** `/admin/taxes/1099/analytics`
- **Action:** Click "Download Compliance Data Room (ZIP)"
- **Outcome:** Extract ZIP, verify:
  - Required files present
  - Folder structure organized
  - `MANIFEST.json` + `MANIFEST.sig` (signed checksum)
  - `README.txt` with verification instructions
- **Key Message:** "Cryptographic integrity verification for diligence"

---

## ACT 3: Governance Explanation

### Step 9: Contact System (Optional)
- **URL:** `/admin/contact`
- **Action:** Show:
  - Inbound messages
  - Status lifecycle (NEW → REVIEWED → REPLIED)
  - Reply templates
  - Internal notes
- **Outcome:** Demonstrate operational maturity
- **Key Message:** "Professional inbound management"

### Step 10: Closing Narrative
**Key Points to Emphasize:**

1. **Governance-First:** "We start with compliance infrastructure, not payments"
2. **Audit-Ready:** "Every action is timestamped, every document is tracked"
3. **Scalable:** "Works for 10 contractors or 1,000"
4. **Low-Disruption:** "Runs alongside existing payroll, no replacement required"
5. **Investor-Safe:** "Board and investor artifacts generated automatically"

---

## Demo Notes

### What to Skip (Post-Launch)
- Stripe Connect (placeholder page only)
- Payment processing
- Advanced analytics
- Multi-year archives

### What to Emphasize
- W-9 collection and verification
- Readiness scoring
- PDF generation
- Data room export with integrity verification
- Role separation and security

### Common Questions & Answers

**Q: "Is this payroll?"**  
A: "No. VelocityMaid is compliance infrastructure. We collect and verify documentation, track readiness, and generate audit trails. Payments are optional and staged later."

**Q: "Do we replace our current system?"**  
A: "No. VelocityMaid runs in parallel. We collect compliance data, you keep using your existing payroll and payment systems."

**Q: "What about legal advice?"**  
A: "VelocityMaid is not legal advice. We provide infrastructure to collect, verify, and track compliance documentation. You work with your legal and tax advisors."

---

## Demo Success Criteria

✅ Cleaner can submit W-9 without admin help  
✅ Admin can verify W-9 in < 30 seconds  
✅ Readiness score is visible and actionable  
✅ Investor PDF is professional and non-sensitive  
✅ Data room ZIP includes signed manifest  
✅ All flows complete without errors  
✅ Role separation is clear and enforced

---

**Last Updated:** 2025-01-03  
**Version:** V1.0

