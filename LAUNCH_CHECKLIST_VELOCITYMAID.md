# 🚀 Launch Checklist — VelocityMaid Ready-to-Show Edition

**Purpose:** This checklist ensures you can confidently demo, pitch, and onboard—whether in Vermont, Miami, or beyond.

**Status:** ⚠️ **IN PROGRESS** — Complete each section before launch

---

## ✅ 1. Core System Verification (Non-Negotiable)

**Do these once, then lock them.**

### Payout Flow Testing

Test the complete flow from job completion to payout execution:

- [ ] **Job → COMPLETED**
  - [ ] Mark a job as completed via cleaner portal or admin
  - [ ] Verify job status updates to `COMPLETED`
  - [ ] Verify `completedAt` timestamp is set

- [ ] **Cleaner Assigned**
  - [ ] Verify job has `assignedCleanerId` populated
  - [ ] Verify cleaner exists and is active
  - [ ] Verify cleaner has valid payment method (if required)

- [ ] **Payment Method Verified**
  - [ ] Check cleaner has payment method on file
  - [ ] Verify payment method is active/verified
  - [ ] Test with cleaner missing payment method (should skip)

- [ ] **Payout Policy Applied**
  - [ ] Verify branch has payout policy configured
  - [ ] Verify policy calculates correctly
  - [ ] Test with branch missing policy (should skip)

- [ ] **Generate Payouts**
  - [ ] Call `POST /api/admin/payouts/generate`
  - [ ] Verify payout records are created
  - [ ] Verify status is `READY` or `PENDING`
  - [ ] Check response includes `created` count

- [ ] **Approve Payout**
  - [ ] Call `POST /api/admin/payouts/[payoutId]/approve`
  - [ ] Verify status updates to `APPROVED`
  - [ ] Verify audit log entry created

- [ ] **Execute Payout**
  - [ ] Call `POST /api/admin/payouts/[payoutId]/execute`
  - [ ] Verify status updates to `SENT` or `PAID`
  - [ ] Verify `executedAt` timestamp is set
  - [ ] Verify execution method is recorded

- [ ] **Ledger Entry Created**
  - [ ] Check `TransactionLedger` table for entry
  - [ ] Verify amount matches payout amount
  - [ ] Verify transaction type is correct
  - [ ] Verify reference links to payout

- [ ] **Status Updates Reflected in UI**
  - [ ] Navigate to `/dashboard/payouts` or `/admin/payouts`
  - [ ] Verify payout appears in list
  - [ ] Verify status badge shows correct state
  - [ ] Verify currency formatting is correct

**👉 Outcome:** You can explain every number on screen.

---

## ✅ 2. Debug Confidence (Critical for Trust)

**"Why was this skipped?" panel must be visible and clear.**

- [ ] **Debug Panel Visible**
  - [ ] Navigate to payout generation page
  - [ ] After generating payouts, verify debug panel appears
  - [ ] Verify panel shows skipped jobs count
  - [ ] Verify panel is expandable/collapsible

- [ ] **At Least 2 Intentional Skip Scenarios Tested**
  
  **Scenario 1: No Cleaner Assigned**
  - [ ] Create job without `assignedCleanerId`
  - [ ] Mark job as completed
  - [ ] Generate payouts
  - [ ] Verify job appears in debug panel
  - [ ] Verify reason: "No cleaner assigned"

  **Scenario 2: No Payment Method**
  - [ ] Create cleaner without payment method
  - [ ] Assign cleaner to completed job
  - [ ] Generate payouts
  - [ ] Verify job appears in debug panel
  - [ ] Verify reason: "No payment method on file"

  **Scenario 3: Job Not Completed** (Optional)
  - [ ] Create job with status `pending` or `assigned`
  - [ ] Generate payouts
  - [ ] Verify job appears in debug panel
  - [ ] Verify reason: "Job not completed"

- [ ] **Debug Reasons are Human-Readable**
  - [ ] Verify skip reasons use plain English
  - [ ] Verify reasons are specific (not generic errors)
  - [ ] Verify job details are shown (ID, status, cleaner, amount)
  - [ ] Verify reasons are actionable (admin knows what to fix)

**👉 Outcome:** Non-technical people understand why jobs were skipped.

---

## ✅ 3. Demo Mode Lock (Investor-Safe)

**Buttons that must work flawlessly without touching real data.**

### Environment Setup

- [ ] **Demo Mode Enabled**
  - [ ] Verify `.env.local` has `NEXT_PUBLIC_DEMO_MODE=true`
  - [ ] Verify `DEMO_MODE=true` (server-side)
  - [ ] Restart dev server
  - [ ] Verify yellow banner appears at top of admin pages

### Demo Actions Testing

- [ ] **Reset Demo (No Errors)**
  - [ ] Navigate to `/admin/dev-tools` or use API directly
  - [ ] Click "Reset Database" or call `POST /api/admin/demo/reset`
  - [ ] Verify no errors in console
  - [ ] Verify response shows deleted records count
  - [ ] Verify real data is NOT touched (if any exists)

- [ ] **Seed Demo Jobs**
  - [ ] Click "Seed Demo Data" or call `POST /api/dev/seed`
  - [ ] Verify jobs are created
  - [ ] Verify jobs have various statuses (some completed)
  - [ ] Verify cleaners are assigned to some jobs
  - [ ] Verify demo data is clearly labeled (if possible)

- [ ] **Generate Payouts**
  - [ ] After seeding, call `POST /api/admin/payouts/generate`
  - [ ] Verify payouts are created
  - [ ] Verify debug panel shows skipped jobs (if any)
  - [ ] Verify payouts are marked as demo (if implemented)

- [ ] **Approve + Execute**
  - [ ] Approve a payout: `POST /api/admin/payouts/[payoutId]/approve`
  - [ ] Execute payout: `POST /api/admin/payouts/[payoutId]/execute`
  - [ ] Verify status updates correctly
  - [ ] Verify demo mode message appears in response
  - [ ] Verify no real payment is processed

- [ ] **Reset Again**
  - [ ] Reset demo data again
  - [ ] Verify all payouts are deleted
  - [ ] Verify jobs reset to appropriate states
  - [ ] Verify you can repeat the cycle multiple times

### Rules Verification

- [ ] **Demo Reset Never Touches Real Data**
  - [ ] Verify reset only affects demo/test data
  - [ ] Verify production data (if any) is untouched
  - [ ] Verify reset requires `DEMO_MODE=true`

- [ ] **Demo Data Clearly Labeled**
  - [ ] Verify demo banner is visible
  - [ ] Verify status badges show "(DEMO)" indicator (if implemented)
  - [ ] Verify console logs show `[DEMO_MODE]` prefix

**👉 Outcome:** You can demo repeatedly without fear.

---

## ✅ 4. UI Polish Pass (Fast, High Impact)

**You don't need perfection—just clarity.**

### Admin / Payouts Page

- [ ] **Currency Formatted Consistently**
  - [ ] All amounts show currency symbol ($)
  - [ ] All amounts show 2 decimal places
  - [ ] Large numbers use comma separators (1,234.56)
  - [ ] Currency matches branch (USD for NJ, JMD for Jamaica, etc.)

- [ ] **Status Colors Make Sense**
  - [ ] `PENDING` / `READY` → Yellow/Orange
  - [ ] `APPROVED` → Blue
  - [ ] `PAID` / `SENT` → Green
  - [ ] `FAILED` / `REJECTED` → Red
  - [ ] Colors are accessible (sufficient contrast)

- [ ] **Empty States are Friendly**
  - [ ] "No payouts yet" message when list is empty
  - [ ] Helpful guidance: "Generate payouts to get started"
  - [ ] No broken layouts or missing elements

- [ ] **Actions Disabled When Invalid**
  - [ ] "Execute" button disabled for non-approved payouts
  - [ ] "Approve" button disabled for already-approved payouts
  - [ ] "Generate" button shows loading state
  - [ ] No double-execution possible (button disables after click)

### Optional but Strong

- [ ] **Tooltip: "How Payouts are Calculated"**
  - [ ] Add tooltip or info icon near payout amount
  - [ ] Show formula: `baseEarnings + bonuses - deductions`
  - [ ] Link to payout policy or documentation

- [ ] **Tooltip: "Why a Job May be Skipped"**
  - [ ] Add tooltip near debug panel
  - [ ] List common skip reasons
  - [ ] Link to debug panel or documentation

**👉 Outcome:** Non-technical people understand the flow.

---

## ✅ 5. Narrative Prep (This Sells the System)

**Practice saying this out loud.**

### The Pitch

> "VelocityMaid automatically calculates cleaner pay based on completed jobs, verified payment methods, and branch policies. If something can't be paid, the system explains exactly why—no guessing, no disputes."

### The Demo Script

1. **Start:** Navigate to `/admin/payouts` or `/dashboard/payouts`
2. **Reset:** "Let me reset the demo data to show you a fresh state"
3. **Generate:** "Now I'll generate payouts for all completed jobs"
4. **Show Debug Panel:** "See this panel? It shows exactly why some jobs were skipped"
5. **Approve:** "I can review and approve payouts individually or in bulk"
6. **Execute:** "Once approved, I execute the payout—this updates the status and creates a ledger entry"
7. **End:** "And here's the final state—all payouts processed, all numbers accounted for"

### Practice Points

- [ ] Practice the pitch 3 times out loud
- [ ] Time yourself (should be 2-3 minutes)
- [ ] Prepare answers for common questions:
  - "What if a cleaner doesn't have a payment method?"
  - "Can you manually adjust a payout?"
  - "How do you handle disputes?"
  - "What happens if a payout fails?"

**👉 Outcome:** Trust is built instantly.

---

## ✅ 6. Screen Recording (Your Silent Salesperson)

**Record a 5–7 minute walkthrough.**

### Recording Checklist

- [ ] **Start on `/admin/payouts` or `/dashboard/payouts`**
  - [ ] Show empty state or existing payouts
  - [ ] Explain what you're looking at

- [ ] **Reset Demo**
  - [ ] Navigate to dev tools or use API
  - [ ] Click reset
  - [ ] Show confirmation message
  - [ ] Return to payouts page (now empty)

- [ ] **Seed Demo Jobs** (Optional)
  - [ ] Show seeding process
  - [ ] Explain what data is created
  - [ ] Return to payouts page

- [ ] **Generate Payouts**
  - [ ] Click "Generate Payouts" or call API
  - [ ] Show loading state
  - [ ] Show results: "Created X payouts, skipped Y jobs"
  - [ ] Show payouts appear in table

- [ ] **Show Debug Panel**
  - [ ] Expand debug panel
  - [ ] Explain why jobs were skipped
  - [ ] Show job details and reasons
  - [ ] Emphasize transparency

- [ ] **Approve & Execute**
  - [ ] Select a payout
  - [ ] Click "Approve"
  - [ ] Show status change
  - [ ] Click "Execute"
  - [ ] Show final status (PAID/SENT)
  - [ ] Show ledger entry (if visible)

- [ ] **End on "Paid" State**
  - [ ] Show completed payouts
  - [ ] Show summary/KPIs
  - [ ] Wrap up with key points

### Recording Tips

- [ ] Use screen recording tool (Loom, OBS, QuickTime, etc.)
- [ ] Record at 1080p or higher
- [ ] Use clear, slow narration
- [ ] Highlight important UI elements with cursor
- [ ] Keep recording under 7 minutes
- [ ] Export as MP4 for easy sharing

### Use Cases

- [ ] **Miami Ops:** Share with operations team
- [ ] **Vermont Partners:** Onboard new partners
- [ ] **Early Investors:** Show system capabilities
- [ ] **Future Hires:** Training material

**👉 Outcome:** You don't need to be in the room.

---

## ✅ 7. Launch Guardrails (Sleep Peacefully)

**Before real use, verify these safety measures.**

### Environment Configuration

- [ ] **DEMO_MODE=false in Production**
  - [ ] Verify `.env.production` or Vercel env vars
  - [ ] Verify `NEXT_PUBLIC_DEMO_MODE=false`
  - [ ] Verify `DEMO_MODE=false` (server-side)
  - [ ] Document where these are set

- [ ] **Demo Routes Locked**
  - [ ] Verify `/api/admin/demo/reset` requires `DEMO_MODE=true`
  - [ ] Verify `/api/dev/seed` only works in development
  - [ ] Verify demo routes return 403 in production
  - [ ] Test in production environment (staging)

### Logging & Monitoring

- [ ] **Logging Enabled for Payout Execution**
  - [ ] Verify all payout operations log to console/file
  - [ ] Verify logs include: payout ID, amount, status, timestamp
  - [ ] Verify logs include user/admin who executed
  - [ ] Set up log aggregation (if applicable)

- [ ] **One Admin-Only "Panic Stop"**
  - [ ] Implement or verify ability to disable payout execution
  - [ ] Document how to enable/disable
  - [ ] Test the panic stop mechanism
  - [ ] Ensure it's reversible

### Production Checklist

- [ ] **Database Backups**
  - [ ] Verify automated backups are configured
  - [ ] Test restore process
  - [ ] Document backup schedule

- [ ] **Error Handling**
  - [ ] Verify errors are caught and logged
  - [ ] Verify users see friendly error messages
  - [ ] Verify critical errors alert admins

- [ ] **Rate Limiting**
  - [ ] Verify API routes have rate limiting
  - [ ] Verify payout generation is rate-limited
  - [ ] Verify bulk operations are protected

**👉 Outcome:** You stay in control.

---

## 🌍 What This Unlocks (Big Picture)

**You now have:**

✅ A trust-based payout engine  
✅ An explainable financial system  
✅ A repeatable demo  
✅ A foundation that scales city → city  

**This is not a prototype anymore.**  
**This is operational infrastructure.**

---

## 📋 Quick Reference

### Key URLs

- Admin Payouts: `/admin/payouts` or `/dashboard/payouts`
- Dev Tools: `/admin/dev-tools`
- Demo Reset API: `POST /api/admin/demo/reset`
- Seed Demo Data: `POST /api/dev/seed`
- Generate Payouts: `POST /api/admin/payouts/generate`
- Approve Payout: `POST /api/admin/payouts/[payoutId]/approve`
- Execute Payout: `POST /api/admin/payouts/[payoutId]/execute`

### Environment Variables

```bash
# Demo Mode (development only)
NEXT_PUBLIC_DEMO_MODE=true
DEMO_MODE=true

# Production (never enable demo mode)
NEXT_PUBLIC_DEMO_MODE=false
DEMO_MODE=false
```

### Testing Commands

```bash
# Reset demo data
curl -X POST http://localhost:3000/api/admin/demo/reset \
  -H "Content-Type: application/json"

# Seed demo data
curl -X POST http://localhost:3000/api/dev/seed \
  -H "Content-Type: application/json"

# Generate payouts
curl -X POST http://localhost:3000/api/admin/payouts/generate \
  -H "Content-Type: application/json" \
  -d '{"branchId": "your-branch-id"}'
```

---

## 🎯 Final Sign-Off

**Before going live, verify:**

- [ ] All 7 sections above are complete
- [ ] Demo mode works flawlessly
- [ ] Debug panel is visible and clear
- [ ] Screen recording is ready
- [ ] Production guardrails are in place
- [ ] You've practiced the pitch 3+ times

**Status:** [ ] Ready for Launch | [ ] Needs Work

**Date Completed:** _______________

**Completed By:** _______________

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Version:** 1.0  
**Status:** Ready for Use












