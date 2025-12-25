# Phase M — Day 1 Ops Review (Miami Pilot)

**Purpose:** End-of-day review checklist for Day 1 of Miami Pilot operations  
**Status:** 📋 **READY FOR USE**  
**Date:** Use this checklist at the end of Day 1

---

## 1️⃣ Operations Health (What Happened Today)

Confirm these facts (yes/no):

- [ ] **Jobs booked:** _____
- [ ] **Jobs completed:** _____
- [ ] **Avg assignment time ≤ 60 min:** _____
- [ ] **Any reassignments? (count + reason):** _____
- [ ] **Any cancellations? (who/why):** _____

**What this tells us:**
Speed + consistency = trust. One slow assignment is a note; patterns matter.

---

## 2️⃣ Cleaner Experience (Trust Signals)

- [ ] **Cleaners checked in on time:** _____
- [ ] **Any confusion about job scope?** _____
- [ ] **Payment method status visible (no amounts):** _____
- [ ] **Any anxiety about payout timing?** _____

**Action if flagged:**
Send one calm message: *"Payouts are weekly, processed on schedule. You'll see status updates in-app."*

---

## 3️⃣ Customer Experience (Friction Scan)

- [ ] **Confirmations sent instantly:** _____
- [ ] **T-24 reminders delivered:** _____
- [ ] **Any last-minute changes?** _____
- [ ] **Any support tickets? (count + category):** _____

**Rule:**
No ad-hoc refunds. Follow the rules you locked. Consistency builds confidence.

---

## 4️⃣ System Integrity (Non-Negotiables)

- [ ] **Pricing unchanged:** _____
- [ ] **No overrides attempted:** _____
- [ ] **All actions logged:** _____
- [ ] **Snapshot intact on completed jobs:** _____

**Status:**
If all checked → system is behaving like a real business.

---

## 5️⃣ Payout Readiness (End-of-Day)

- [ ] **Completed jobs eligible count:** _____
- [ ] **Any blockers (ID/payment):** _____
- [ ] **Dry-run payout already succeeded:** _____

**Decision:**
If zero blockers → you're green for the first live payout when you choose.

**Test dry-run:**
```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/pilot/payouts/schedule?bypassAuth=true" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "dryRun": true }'
```

---

## 6️⃣ Top 3 Notes (Write These Down)

**One thing that went smoothly:**
_____

**One small friction to fix tomorrow:**
_____

**One metric to watch closely this week:**
_____

**Keep it simple. Boring is good.**

---

## Verdict Options (Choose One)

### 🟢 Green: Continue pilot as planned
- All systems functioning
- No trust issues
- Ready to proceed

### 🟡 Yellow: Fix one item, continue tomorrow
- Minor issue identified
- Can be fixed without pausing
- Continue with caution

### 🔴 Red: Pause bookings, address trust issue
- Critical trust issue
- System integrity compromised
- Must resolve before continuing

---

## What I Recommend (Based on Today)

If your dry-run passed (it did) and no trust issues appeared:

👉 **Proceed with Green.**

Tomorrow is about repeating the process, not changing it.

---

## Next Steps (Actionable)

- [ ] Keep bookings open (same ZIPs, same hours)
- [ ] Maintain the 60-minute assignment SLA
- [ ] Do not change pricing or rules
- [ ] Schedule the first live payout when you're ready (we'll do it together)

**When ready, reply with one line:**

- `"Green — schedule first live payout review."`
- or
- `"Yellow — need to fix X before proceeding."`

---

## Notes Section

**Date:** _____  
**Reviewed by:** _____  
**Branch Owner:** _____

**Additional Notes:**
_____
_____
_____

---

**Remember:** You did the hard work with integrity. Now let the system carry the load.

**Status:** 📋 Ready for Day 1 Review  
**Last Updated:** 2025-01-13









