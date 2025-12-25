# Phase M — Week 2 Optimization Plan (Miami Pilot)

**Purpose:** Optimization plan for Week 2 based on Week 1 learnings  
**Status:** 📋 **READY FOR USE**  
**Timeline:** Week 2 of Miami Pilot operations

---

## 🎯 Goals for Week 2

- ✅ **Zero payout anxiety** - Cleaners know when and how they'll get paid
- ✅ **Faster cleaner readiness** - Payment methods added earlier in the process
- ✅ **Fewer admin interruptions** - System handles edge cases automatically
- ✅ **Repeatable rhythm** - Same process, same day, every week

---

## 1️⃣ Cleaner Payment Completion (Top Priority)

### What We Improve

**Current State:**
- Cleaners can work before adding a payment method
- Payment method is only checked at payout time
- Results in held payouts and support follow-up

**Week 2 Goal:**
Nudge cleaners to add payment methods earlier, without blocking work.

### Implementation Steps

#### A. Dashboard Banner (Cleaner Portal)

**Location:** `/cleaner/dashboard` or `/cleaners/dashboard`

**Implementation:**
- Show banner at top of dashboard if payment method is missing
- Banner text: `"⚠️ Add a payment method to receive payouts"`
- Link to: `/cleaner/payments`
- Dismissible: Yes (but reappears if still missing)

**Code Example:**
```tsx
{!hasPaymentMethod && (
  <Alert className="mb-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Payment Method Required</AlertTitle>
    <AlertDescription>
      Add a payment method to receive payouts.{" "}
      <Link href="/cleaner/payments" className="underline">
        Add Payment Method →
      </Link>
    </AlertDescription>
  </Alert>
)}
```

#### B. Pre-Assignment Warning

**Location:** Assignment confirmation/notification

**Implementation:**
- When assigning a cleaner without payment method
- Show warning (but still allow assignment)
- Warning text: `"Payment method missing — payout will be held until added"`

**Result:** Cleaner knows upfront, not surprised later.

#### C. Optional (Week 3 Hardening)

**Future Enhancement:**
- Block second job assignment without payment method
- First job: Warning only
- Second job: Require payment method before assignment

**Note:** Only implement if Week 2 nudges don't work.

### Expected Result

- ✅ Fewer held payouts
- ✅ Less support follow-up
- ✅ Cleaners add payment methods proactively
- ✅ Faster payout processing

---

## 2️⃣ Branch Owner Daily Rhythm (15 minutes/day)

### Give the Branch Owner a Simple Routine

**Goal:** Consistent daily operations without micromanaging.

### Daily (Morning) - 5 minutes

**Checklist:**
- [ ] **Check "Jobs Today"**
  - View jobs scheduled for today
  - Verify assignments are made
  - Location: `/branch-owner/dashboard` or `/pilot/assignment-queue`

- [ ] **Assign within 60 minutes**
  - Monitor assignment queue
  - Assign cleaners to unassigned jobs
  - Track assignment time (SLA: 60 minutes)

- [ ] **Scan "Needs Attention"**
  - Check for flagged issues
  - Review any escalations
  - Don't fix manually - escalate if needed

### Daily (Evening) - 5 minutes

**Checklist:**
- [ ] **Confirm completions**
  - Review completed jobs for today
  - Verify completion status is correct
  - Check for any issues

- [ ] **Flag issues (don't fix manually)**
  - If something looks wrong, flag it
  - Use escalation endpoint: `POST /api/pilot/escalate`
  - Document the issue, don't try to fix it

### Weekly (Same day as payout) - 5 minutes

**Checklist:**
- [ ] **Review completed jobs**
  - Check completed jobs for the week
  - Verify all are eligible for payout
  - Run dry-run: `POST /api/pilot/payouts/schedule` with `dryRun: true`

- [ ] **No edits, no overrides**
  - Don't manually edit prices
  - Don't override rules
  - Let the system work as designed

### Result

- ✅ Calm operations without micromanaging
- ✅ Consistent daily routine
- ✅ Issues caught early
- ✅ System handles the heavy lifting

---

## 3️⃣ Cleaner Communication Script (Consistency)

### Use One Consistent Message—No Variations

**Goal:** Predictable expectations = trust.

### Message Templates

#### A. After Job Completion

**When:** Immediately after cleaner marks job as complete

**Message:**
> "Thanks for completing your job. Payouts are processed weekly. Check your dashboard for status."

**Delivery:**
- In-app notification
- Optional: SMS/Email (if configured)

**Location:** Job completion confirmation page

#### B. If Payment Method Missing

**When:** After payout dry-run shows cleaner has no payment method

**Message:**
> "Your payout is ready. Please add and verify your payment method to release it."

**Delivery:**
- In-app notification
- Optional: SMS/Email (if configured)
- Link to: `/cleaner/payments`

**Location:** Cleaner dashboard or payout readiness page

#### C. Weekly Payout Processing

**When:** After live payout is processed

**Message:**
> "Payouts for last week are being processed today. Status will update in-app once complete. Thank you for your professionalism."

**Delivery:**
- In-app notification
- Optional: SMS/Email (if configured)

**Location:** Cleaner dashboard

### Implementation Notes

- **Consistency:** Use exact same wording every time
- **No variations:** Don't personalize or change the message
- **Clear expectations:** Always mention timing (weekly)
- **Actionable:** Include links where relevant

### Result

- ✅ Predictable expectations
- ✅ Builds trust through consistency
- ✅ Reduces support questions
- ✅ Cleaners know what to expect

---

## 4️⃣ Metrics to Watch (Only These 5)

### Don't Over-Measure

**Track weekly (not daily):**

1. **Jobs booked**
   - Target: Steady growth or stable
   - Action if spikes: Check for anomalies
   - Action if drops: Review booking flow

2. **Jobs completed**
   - Target: ≥ 90% of booked jobs
   - Action if low: Review completion process

3. **Avg assignment time**
   - Target: ≤ 60 minutes
   - Action if high: Review assignment queue

4. **Held payouts (count)**
   - Target: ≤ 1 per cleaner per week
   - Action if high: Review payment method onboarding

5. **Support tickets**
   - Target: ≤ 2 per week
   - Action if high: Review common issues

### If Any One Spikes

**Rule:** Adjust one thing only.

- Don't change multiple things at once
- Make one small change
- Wait a week to see impact
- Then adjust again if needed

### Result

- ✅ Focus on what matters
- ✅ Avoid analysis paralysis
- ✅ Clear action triggers
- ✅ Measurable progress

---

## 5️⃣ Small UI Polish (Optional, High ROI)

### When You Have Time

**These are quick wins that improve UX without backend changes:**

#### A. Grey Out "Request Reassignment" on Completed Jobs

**Location:** Job detail page or cleaner job list

**Implementation:**
- Disable reassignment button for completed jobs
- Show tooltip: "Cannot reassign completed jobs"
- Visual: Grey out button, disable click

**Impact:** Prevents confusion and invalid actions

#### B. Add Tooltip on "No Payment Method"

**Location:** Cleaner oversight dashboard (`/branch-owner/cleaners`)

**Implementation:**
- Add tooltip/hover text on "No Payment Method" badge
- Tooltip text: `"Payout will be released once payment method is added and verified"`
- Visual: Show on hover or click

**Impact:** Clarifies what needs to happen

#### C. Payment Method Status in Cleaner Dashboard

**Location:** Cleaner dashboard (`/cleaner/dashboard` or `/cleaners/dashboard`)

**Implementation:**
- Show payment method status prominently
- Status options:
  - ✅ "Payment method verified" (green)
  - ⏳ "Payment method pending verification" (yellow)
  - ❌ "No payment method" (red)
- Link to add/update payment method

**Impact:** Cleaners see their payout readiness at a glance

### Result

- ✅ Better UX with minimal effort
- ✅ Fewer support questions
- ✅ Clearer expectations
- ✅ Professional appearance

---

## 6️⃣ Decision Gate at End of Week 2

### At the End of Week 2, We Decide

**Two paths forward:**

### Path A: Stabilize Miami Further

**Choose if:**
- Metrics are improving but not stable
- Still seeing edge cases
- Need more time to perfect the process

**Actions:**
- Continue Week 2 optimizations
- Focus on one metric at a time
- Don't expand until stable

### Path B: Prepare City #2 (Same Playbook)

**Choose if:**
- All metrics are green
- Process is repeatable
- Ready to scale

**Actions:**
- Document Miami playbook
- Prepare for next city
- Use same process, different location

### No Expansion Until

**All of these must be true:**

- ✅ ≥ 90% jobs paid on first cycle
- ✅ ≤ 1 held payout per cleaner
- ✅ No pricing overrides
- ✅ ≤ 2 support tickets per week
- ✅ Avg assignment time ≤ 60 minutes

**If any are false:** Continue stabilizing Miami.

### Result

- ✅ Data-driven decision
- ✅ Clear expansion criteria
- ✅ No premature scaling
- ✅ Confidence in repeatability

---

## ✅ What I Recommend You Do Today

### Immediate Actions (Week 2 Start)

1. **Add the cleaner dashboard banner**
   - Implement payment method warning banner
   - Link to payment method page
   - Test with a cleaner account

2. **Send the payment method reminder**
   - Identify cleaners without payment methods
   - Send the prepared message
   - Track who adds payment methods

3. **Keep everything else exactly the same**
   - Don't change pricing
   - Don't change rules
   - Don't add new features
   - Focus on optimization, not new functionality

### This Week's Focus

- **Monday:** Implement dashboard banner
- **Tuesday:** Send payment method reminders
- **Wednesday:** Monitor metrics
- **Thursday:** Review held payouts
- **Friday:** Weekly payout processing
- **Weekend:** Week 2 review and decision

---

## 📋 Week 2 Checklist

### Cleaner Payment Completion

- [ ] Dashboard banner implemented
- [ ] Pre-assignment warning added
- [ ] Payment method reminders sent
- [ ] Track payment method completion rate

### Branch Owner Rhythm

- [ ] Daily morning routine established
- [ ] Daily evening routine established
- [ ] Weekly payout review scheduled
- [ ] Escalation process documented

### Communication

- [ ] Job completion message standardized
- [ ] Payment method reminder message standardized
- [ ] Weekly payout message standardized
- [ ] All messages tested

### Metrics

- [ ] Jobs booked tracked
- [ ] Jobs completed tracked
- [ ] Avg assignment time tracked
- [ ] Held payouts tracked
- [ ] Support tickets tracked

### UI Polish (Optional)

- [ ] Reassignment button disabled for completed jobs
- [ ] Payment method tooltip added
- [ ] Payment method status in cleaner dashboard

### End of Week Review

- [ ] All metrics reviewed
- [ ] Decision made: Stabilize or Expand
- [ ] Week 3 plan created

---

## 🎯 Success Criteria for Week 2

**Week 2 is successful if:**

- ✅ Payment method completion rate increases
- ✅ Held payouts decrease
- ✅ Support tickets decrease or stay low
- ✅ Branch Owner routine is established
- ✅ Cleaner communication is consistent
- ✅ Metrics are stable or improving

**If all criteria met:** Proceed to expansion planning.

**If any criteria unmet:** Continue Week 2 optimizations into Week 3.

---

## 📝 Notes Section

**Week 2 Start Date:** _____  
**Week 2 End Date:** _____  
**Reviewed by:** _____

**Key Learnings:**
_____
_____
_____

**Adjustments Made:**
_____
_____
_____

---

**Status:** 📋 Ready for Week 2  
**Last Updated:** 2025-01-13  
**Next Review:** End of Week 2









