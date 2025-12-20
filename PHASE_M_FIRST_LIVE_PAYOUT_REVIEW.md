# Phase M — First Live Payout Review (Pre-Flight Checklist)

**Purpose:** Review checklist before processing the FIRST real payout for Miami Pilot  
**When to Use:** When you're ready to process actual payouts (not dry-run)  
**Status:** 📋 **READY FOR USE**

---

## 🎯 What This Checklist Is For

This checklist helps you **verify everything is correct** before processing the **first real payout** to cleaners. Think of it like a pre-flight checklist before takeoff—you want to make sure everything is safe before money moves.

**Important:** This is for when you're ready to **actually pay cleaners**, not for testing. Use the dry-run first to see what would happen.

---

## 📋 Step-by-Step: What You Need to Do

### Step 1: Run a Dry-Run First (Do This First!)

Before doing anything else, run a **dry-run** to see what payouts would be created:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/pilot/payouts/schedule?bypassAuth=true" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "dryRun": true }'
```

**What to look for:**
- How many jobs are included
- How many payouts would be created
- Total amounts
- Any errors or warnings

**If the dry-run looks good, proceed to Step 2.**

---

### Step 2: Review the Checklist Below

Go through each section and check off items. If anything is unclear or wrong, **STOP** and fix it before proceeding.

---

## 1️⃣ Payout Scope Confirmation (Lock the Window)

**What this means:** Make sure you're paying for the RIGHT jobs in the RIGHT time period.

- [ ] **Payout period is last full week (Mon–Sun)**
  - *Check the response from dry-run - it shows the week period*
  - *Example: "Week of Jan 13, 2025" means Jan 13-19*

- [ ] **Only Miami branch included**
  - *The system automatically filters to Miami only*
  - *Verify in dry-run response: `branchName: "Miami"`*

- [ ] **Only COMPLETED jobs included**
  - *The system only includes jobs with status = "COMPLETED"*
  - *Check dry-run: `totalJobs` should match completed jobs*

- [ ] **No jobs marked completed today included**
  - *This week's payout is for LAST week's jobs*
  - *Today's completed jobs will be in NEXT week's payout*

**If any answer is "no," STOP and adjust the window or fix the issue.**

---

## 2️⃣ Cleaner Eligibility Check (Trust First)

**What this means:** Make sure each cleaner can actually receive payment.

**How to check:**
1. Look at the dry-run response
2. Check the `results` array - it shows each job and whether it's eligible
3. For any job marked `eligible: false`, check the `reasons` array

**For each cleaner in the payout preview:**

- [ ] **Identity verified**
  - *Cleaner has completed identity verification*
  - *Check: No "CLEANER_NOT_ACTIVE" in reasons*

- [ ] **Payment method verified**
  - *Cleaner has an active, verified payment method*
  - *Check: No "NO_PAYMENT_METHOD" or "PAYMENT_METHOD_NOT_VERIFIED" in reasons*

- [ ] **Active status**
  - *Cleaner account is active*
  - *Check: No "CLEANER_NOT_ACTIVE" in reasons*

- [ ] **No suspensions or flags**
  - *Cleaner is not suspended or flagged*
  - *Check admin dashboard if needed*

**Rule:**
If any cleaner fails eligibility → their payout is skipped (logged), not forced. This is automatic—the system won't create payouts for ineligible cleaners.

---

## 3️⃣ Amount Verification (Quiet Double-Check)

**What this means:** Make sure the payout amounts look correct.

- [ ] **Payout amounts derived from pricing snapshot**
  - *Amounts come from the job's `totalPrice` at completion*
  - *No manual price changes after job completion*

- [ ] **No manual edits**
  - *You haven't manually edited any job prices*
  - *All prices are from the system*

- [ ] **No rounding surprises**
  - *Amounts are calculated as: 65% of job total (cleaner gets 65%)*
  - *Check: `cleanerAmount` should be roughly 65% of `grossAmount`*

- [ ] **Totals make intuitive sense**
  - *If a job was $100, cleaner should get ~$65*
  - *If a job was $200, cleaner should get ~$130*
  - *Total payout should match sum of individual payouts*

**You should feel calm looking at the numbers. If not, pause and review.**

---

## 4️⃣ Communication Readiness (Before Money Moves)

**What this means:** Prepare to tell cleaners what's happening.

### General Payout Message

**Prepare one short message (do not send yet):**

> "Payouts for last week are being processed today. Status will update in-app once complete. Thank you for your professionalism."

**When to send:**
- After you've run the live payout command
- After you've verified it completed successfully
- Send via your normal communication channel (email/SMS/WhatsApp)

**No promises of exact time. Just clarity.**

### Message for Cleaners Missing Payment Methods

**If a cleaner has no payment method (from eligibility check):**

📣 **Suggested Message to Cleaner (Optional):**

> "Your payout has been prepared. Please add and verify your payment method in the app so it can be released."

**When to send:**
- After reviewing the dry-run results
- If you see cleaners with "NO_PAYMENT_METHOD" in the reasons
- Send individually to affected cleaners
- Include link to payment method page: `/cleaner/payments`

**Tone:** No pressure. No blame. Just clarity.

**Note:** Cleaners can add payment methods via `/cleaner/payments` page. Once verified by admin, they'll be eligible for the next payout cycle.

---

## 5️⃣ Audit & Safety Net

**What this means:** Make sure everything is logged and you have a backup plan.

- [ ] **Live payout will be logged**
  - *Every payout creation is logged in `auditLog` table*
  - *You can see who created it and when*

- [ ] **Admin override path exists (unused)**
  - *If something goes wrong, you can manually adjust*
  - *But you shouldn't need to use it*

- [ ] **Rollback plan understood (rare, but ready)**
  - *If a payout is created incorrectly, you can:*
    - *Mark it as failed in the admin dashboard*
    - *Create a corrected payout manually*
    - *Contact support if needed*

---

## 🚦 Decision Gate

**Choose one:**

### ✅ **Proceed: All checks passed, peace in your spirit**
- Everything looks correct
- You're confident in the numbers
- Ready to process real payouts

### ⏸️ **Hold: One item needs clarification**
- Something doesn't look right
- Need to verify one more thing
- Better to wait than rush

**If Proceed, we execute together (see command below).**

---

## 🚀 The Live Payout Command (DO NOT RUN YET)

**⚠️ IMPORTANT:** Only run this when:
1. ✅ You've completed the dry-run
2. ✅ You've reviewed all checklist items
3. ✅ You've chosen "Proceed" above
4. ✅ You're ready to create REAL payout records

**When you're ready, run this command:**

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/pilot/payouts/schedule?bypassAuth=true" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "dryRun": false }'
```

**Notice:** `"dryRun": false` - This creates REAL payout records!

**This will:**
- ✅ Create payout records in the database
- ✅ Lock the week (prevents duplicate payouts)
- ✅ Update payout statuses to "READY"
- ✅ Log everything in audit trail
- ✅ Begin trust at scale

---

## 📝 After Running the Live Payout

1. **Check the response:**
   - Should show `"success": true`
   - Should show `"createdPayouts": X` (number of payouts created)
   - Should show `"dryRun": false`

2. **Verify in admin dashboard:**
   - Go to `/dashboard/payouts` or `/admin/payouts`
   - You should see the new payouts listed
   - Status should be "READY" or "PENDING"

3. **Send communication:**
   - Send the message you prepared in Step 4
   - Let cleaners know payouts are processing

4. **Monitor:**
   - Watch for any issues
   - Be ready to answer questions
   - Track when payouts are actually sent/executed

---

## 🆘 If Something Goes Wrong

**If the command fails:**
- Check the error message
- Review the checklist again
- Fix the issue
- Run dry-run again to verify

**If payouts are created but wrong:**
- Don't panic
- Mark incorrect payouts as failed
- Create corrected payouts manually if needed
- Document what happened

**If you're unsure:**
- Stop and ask for help
- Better to wait than make a mistake
- Review the dry-run output again

---

## 📋 Quick Reference

**Dry-Run (Safe - No Changes):**
```powershell
-Body '{ "dryRun": true }'
```

**Live Payout (Creates Real Records):**
```powershell
-Body '{ "dryRun": false }'
```

**Always test with dry-run first!**

---

## Summary: What You Must Do

1. **First:** Run dry-run to see what would happen
2. **Second:** Review the checklist above
3. **Third:** If everything looks good, choose "Proceed"
4. **Fourth:** Run the live payout command (with `dryRun: false`)
5. **Fifth:** Verify the results and communicate to cleaners

**That's it!** The checklist is just a safety check before you process real money.

---

**Status:** 📋 Ready for First Live Payout  
**Last Updated:** 2025-01-13

