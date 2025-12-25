# Phase M — Day 1 Live Ops Checklist (Miami Pilot)

**Purpose:** Operational checklist for Day 1 of Miami Pilot launch  
**Status:** 📋 **READY FOR USE**  
**Date:** Use this checklist on Day 1 of Miami Pilot operations

---

## 🔒 Before Opening Bookings (T-60 minutes)

### System

- [ ] **Miami ZIP whitelist confirmed**
  - [ ] Verify 15 ZIP codes are active: 33101, 33125, 33126, 33127, 33130, 33131, 33132, 33133, 33134, 33135, 33136, 33137, 33138, 33139, 33140
  - [ ] Test territory validation: `GET /api/pilot/validate-territory?zipCode=33101`
  - [ ] Verify jobs outside ZIP whitelist are rejected

- [ ] **Pricing snapshot + locks verified (no editable inputs)**
  - [ ] Verify pricing is locked for all job types
  - [ ] Test that admin cannot edit prices during pilot
  - [ ] Confirm pricing snapshot is saved on job creation
  - [ ] Verify `priceLockedAt` timestamp is set

- [ ] **Cancellation rules visible to customers**
  - [ ] Verify cancellation policy is displayed on booking page
  - [ ] Confirm cancellation window is enforced (e.g., 24 hours)
  - [ ] Test cancellation fee calculation

- [ ] **Admin override path tested (but unused)**
  - [ ] Verify admin override exists for emergencies
  - [ ] Confirm override requires reason/logging
  - [ ] **Rule: Do not use on Day 1 unless critical**

### People

- [ ] **Branch Owner logged in and active**
  - [ ] Branch Owner account verified
  - [ ] Branch Owner can access dashboard
  - [ ] Escalation path tested
  - [ ] Contact info confirmed

- [ ] **Cleaners (min 3) verified:**
  - [ ] **ID ✔**
    - [ ] Identity verification complete
    - [ ] Background check passed (if required)
    - [ ] All cleaners have active accounts
  
  - [ ] **Payment method ✔**
    - [ ] All cleaners have payment methods added
    - [ ] All payment methods verified by admin
    - [ ] Test payout readiness: `GET /api/cleaner/payout-readiness` (as each cleaner)
    - [ ] Verify no blockers exist
  
  - [ ] **Availability ✔**
    - [ ] Cleaners have availability set for Day 1
    - [ ] Cleaners confirmed availability via phone/WhatsApp
    - [ ] Backup cleaners identified (if needed)

### Comms

- [ ] **Support channel live (single source)**
  - [ ] Support channel configured (email/SMS/WhatsApp)
  - [ ] Support routing tested
  - [ ] Response time SLA confirmed
  - [ ] Escalation path documented

- [ ] **Branch Owner escalation button tested**
  - [ ] Escalation endpoint accessible: `POST /api/pilot/escalate`
  - [ ] Test escalation creates ticket/log
  - [ ] Verify Branch Owner receives notification

---

## 🚀 Open Bookings (T-0)

- [ ] **Enable bookings for Miami ZIPs**
  - [ ] Verify territory validation is active
  - [ ] Test booking creation: `POST /api/checkout` or `POST /api/booking/create`
  - [ ] Confirm job is created with correct branch assignment

- [ ] **Confirm auto-confirmation email/SMS fires**
  - [ ] Test booking creation triggers confirmation
  - [ ] Verify customer receives confirmation
  - [ ] Check email/SMS content is correct
  - [ ] Confirm booking details are accurate

- [ ] **Confirm T-24 reminder scheduled**
  - [ ] Verify reminder is scheduled 24 hours before job
  - [ ] Test reminder system: `GET /api/pilot/send-reminders`
  - [ ] Confirm reminder content is correct

**Rule: No manual discounts. No exceptions.**

---

## 🧭 Assignment Rhythm (Throughout Day)

### SLA

- [ ] **Assign within 60 minutes of booking (business hours)**
  - [ ] Monitor assignment queue: `/pilot/assignment-queue`
  - [ ] Track assignment time: `GET /api/pilot/assignment-sla`
  - [ ] Verify SLA alerts fire if > 60 minutes
  - [ ] Document any SLA violations with reason

### Assignment Rules

- [ ] **Match by availability + proximity**
  - [ ] Verify assignment algorithm considers:
    - Cleaner availability
    - Geographic proximity
    - Cleaner capacity
  - [ ] Test manual assignment if needed
  - [ ] Confirm cleaner receives assignment notification

- [ ] **Confirm cleaner acceptance**
  - [ ] Verify cleaner accepts assignment
  - [ ] Track acceptance time
  - [ ] Document any rejections with reason

- [ ] **Log any reassignment (reason required)**
  - [ ] If reassignment needed, document reason
  - [ ] Update assignment log
  - [ ] Notify original cleaner (if applicable)

---

## 🧼 Day-of-Job Flow (For Each Job)

- [ ] **Cleaner check-in recorded**
  - [ ] Cleaner marks "on the way" or "arrived"
  - [ ] Verify check-in timestamp is recorded
  - [ ] Confirm location tracking (if enabled)

- [ ] **Job completed → marked complete**
  - [ ] Cleaner marks job as completed
  - [ ] Verify job status updates to `COMPLETED`
  - [ ] Confirm `completedAt` timestamp is set
  - [ ] Verify completion triggers payout eligibility check

- [ ] **Snapshot integrity intact**
  - [ ] Verify pricing snapshot matches original booking
  - [ ] Confirm no price changes occurred
  - [ ] Check audit log for any modifications

- [ ] **Any issue → Escalate (no side channels)**
  - [ ] Use escalation endpoint: `POST /api/pilot/escalate`
  - [ ] Document issue in system (not WhatsApp)
  - [ ] Follow escalation protocol
  - [ ] Update issue status in system

---

## 💳 Payout Readiness (End of Day)

- [ ] **Completed jobs counted**
  - [ ] Query completed jobs: `GET /api/admin/jobs?status=COMPLETED&branchId=<miami-branch-id>`
  - [ ] Verify count matches expectations
  - [ ] Document any discrepancies

- [ ] **No pending identity/payment issues**
  - [ ] Check cleaner payout readiness: `GET /api/cleaner/payout-readiness` (for each cleaner)
  - [ ] Verify all cleaners have verified payment methods
  - [ ] Resolve any blockers before payout cycle

- [ ] **Payout eligibility list generated (read-only)**
  - [ ] Preview payouts: `POST /api/pilot/payouts/schedule` (dryRun: true)
  - [ ] Review payout summary
  - [ ] Verify amounts are correct
  - [ ] **Do not generate actual payouts on Day 1** (wait for weekly cycle)

- [ ] **First payout date communicated clearly**
  - [ ] Communicate payout schedule to cleaners
  - [ ] Confirm payout day/time (e.g., "Every Monday")
  - [ ] Set expectations: "First payout will be [date]"

---

## 📊 End-of-Day Review (15 minutes)

### Metrics

- [ ] **Jobs booked / completed**
  - [ ] Total jobs booked today: _____
  - [ ] Total jobs completed today: _____
  - [ ] Completion rate: _____%

- [ ] **Avg assignment time**
  - [ ] Calculate average: _____ minutes
  - [ ] Target: < 60 minutes
  - [ ] Document any violations

- [ ] **Cancellations (count + reason)**
  - [ ] Total cancellations: _____
  - [ ] Cancellation rate: _____%
  - [ ] Reasons documented:
    - Customer: _____
    - Cleaner: _____
    - System: _____

- [ ] **Support tickets (count)**
  - [ ] Total tickets: _____
  - [ ] Resolved: _____
  - [ ] Pending: _____

### Signals

- [ ] **Any pricing override attempts? (should be zero)**
  - [ ] Check audit log for price modifications
  - [ ] Verify no manual discounts applied
  - [ ] **If any found: Document and investigate**

- [ ] **Any payout blockers? (resolve tomorrow)**
  - [ ] List any cleaners with payout blockers:
    - Cleaner 1: _____
    - Cleaner 2: _____
  - [ ] Action plan for resolution: _____

---

## 🚨 Day-1 Guardrails (Non-Negotiable)

### ❌ Do NOT:

- [ ] **No pricing changes**
  - [ ] No manual price edits
  - [ ] No discounts without approval
  - [ ] No "special cases"

- [ ] **No refunds without rules**
  - [ ] Follow cancellation policy strictly
  - [ ] No exceptions without documented reason
  - [ ] All refunds logged in system

- [ ] **No WhatsApp problem-solving**
  - [ ] All issues go through system
  - [ ] No side-channel resolutions
  - [ ] Everything logged and tracked

### ✅ DO:

- [ ] **Everything logged**
  - [ ] All actions have audit trail
  - [ ] All decisions documented
  - [ ] All escalations tracked

- [ ] **Calm, consistent communication**
  - [ ] Use standard templates
  - [ ] Follow communication protocol
  - [ ] Maintain professional tone

---

## 📝 Day-1 Notes

**Date:** _____  
**Branch Owner:** _____  
**Total Jobs:** _____  
**Issues Encountered:**  
- _____
- _____

**Action Items for Day 2:**
- [ ] _____
- [ ] _____

**Successes:**
- _____
- _____

---

## 🔗 Quick Links

- **Assignment Queue:** `/pilot/assignment-queue`
- **Payout Schedule:** `/api/pilot/payouts/schedule`
- **Territory Validation:** `/api/pilot/validate-territory`
- **Cleaner Eligibility:** `/api/pilot/cleaner-eligibility`
- **SLA Tracking:** `/api/pilot/assignment-sla`
- **Escalation:** `/api/pilot/escalate`

---

**Status:** 📋 Ready for Day 1  
**Last Updated:** 2025-01-13  
**Next:** Use this checklist on Day 1 of Miami Pilot launch











