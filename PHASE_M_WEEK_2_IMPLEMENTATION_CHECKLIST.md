# Week 2 — Implementation Checklist (Do in This Order)

**Purpose:** Step-by-step implementation guide for Week 2 optimizations  
**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Timeline:** Week 2 of Miami Pilot operations

---

## 🎯 Implementation Order

**Follow this exact order for maximum impact:**

1. Cleaner Payment Nudges (Highest ROI)
2. Branch Owner Daily Rhythm (Codify Calm)
3. Consistent Cleaner Messages (Zero Variants)
4. Metrics Lock (Only These 5)
5. Small UI Polish (Optional, Fast)

---

## 1️⃣ Cleaner Payment Nudges (Highest ROI)

### A. Cleaner Dashboard Banner (Immediate)

**Priority:** Highest - Implement first  
**Impact:** Reduces held payouts significantly  
**Time:** 30-60 minutes

#### When to Show

**Condition:** `paymentMethodVerified === false`

**Location:** Cleaner dashboard (`/cleaner/dashboard` or `/cleaners/dashboard`)

#### UI Copy (Exact)

**Banner Text:**
> ⚠️ **Add a payment method to receive payouts.**  
> Your completed jobs are ready—payouts release once payment is verified.

**Button Text:**
> "Add Payment Method"

**Link:** `/cleaner/payments`

#### Implementation (Example)

```tsx
{!cleaner.paymentMethodVerified && (
  <Alert variant="warning" className="mb-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Payment Method Needed</AlertTitle>
    <AlertDescription>
      Add a payment method to receive payouts. Completed jobs will be released once verified.
    </AlertDescription>
    <Button asChild className="mt-2">
      <Link href="/cleaner/payments">Add Payment Method</Link>
    </Button>
  </Alert>
)}
```

#### Implementation Steps

1. **Find cleaner dashboard page:**
   - Locate: `app/cleaner/dashboard/page.tsx` or `app/cleaners/dashboard/page.tsx`
   - Or: `app/cleaner/components/Dashboard.tsx`

2. **Add payment method check:**
   ```typescript
   // Fetch payment method status
   const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
     where: {
       cleanerId: auth.userId,
       isActive: true,
       verifiedAt: { not: null },
     },
   });
   
   const paymentMethodVerified = !!paymentMethod;
   ```

3. **Add banner component:**
   - Use the Alert component from your UI library
   - Place at top of dashboard, before other content
   - Make it dismissible (optional, but reappears if still missing)

4. **Test:**
   - Log in as cleaner without payment method
   - Verify banner appears
   - Click "Add Payment Method" - should navigate correctly
   - Add payment method - banner should disappear

#### Expected Result

- ✅ Banner visible to cleaners without payment methods
- ✅ Clear call-to-action
- ✅ Links to payment method page
- ✅ Reduces held payouts

---

### B. Pre-Assignment Warning (Soft Nudge)

**Priority:** High - Implement second  
**Impact:** Sets expectations upfront  
**Time:** 30-45 minutes

#### When to Show

**Condition:** When assigning a cleaner who has `paymentMethodVerified === false`

**Location:** Assignment confirmation modal/page

#### UI Copy (Exact)

**Warning Text:**
> ⚠️ **Payment method missing — payout will be held until added.**

**Display:** Show as warning/info message, but still allow assignment.

#### Implementation Steps

1. **Find assignment flow:**
   - Locate: Assignment API or UI component
   - Check: `app/api/pilot/assign` or assignment modal component

2. **Add payment method check before assignment:**
   ```typescript
   // Before assigning cleaner
   const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
     where: {
       cleanerId: cleanerId,
       isActive: true,
       verifiedAt: { not: null },
     },
   });
   
   const hasPaymentMethod = !!paymentMethod;
   ```

3. **Show warning (but allow assignment):**
   ```tsx
   {!hasPaymentMethod && (
     <Alert variant="warning" className="mb-4">
       <AlertTriangle className="h-4 w-4" />
       <AlertDescription>
         Payment method missing — payout will be held until added.
       </AlertDescription>
     </Alert>
   )}
   ```

4. **Still allow assignment:**
   - Don't block the assignment
   - Just show the warning
   - Branch Owner can proceed if needed

#### Guardrail (Week 3)

**Future Enhancement (Not Now):**
- Block second assignment without payment method
- First job: Warning only
- Second job: Require payment method

**Note:** Only implement if Week 2 nudges don't work.

#### Expected Result

- ✅ Warning shown to Branch Owner
- ✅ Assignment still allowed
- ✅ Expectations set upfront
- ✅ No surprises at payout time

---

## 2️⃣ Branch Owner Daily Rhythm (Codify Calm)

**Priority:** Medium - Implement third  
**Impact:** Establishes consistent operations  
**Time:** 1-2 hours

### Morning (≤10 min)

**Checklist:**
- [ ] **Open Jobs Today**
  - View: `/branch-owner/dashboard` or `/pilot/assignment-queue`
  - See jobs scheduled for today
  - Identify unassigned jobs

- [ ] **Assign within 60 minutes**
  - Assign cleaners to unassigned jobs
  - Track assignment time (SLA: 60 minutes)
  - Use assignment queue dashboard

- [ ] **Scan Needs Attention**
  - Check for flagged issues
  - Review escalations
  - Don't fix manually - escalate if needed

### Evening (≤5 min)

**Checklist:**
- [ ] **Confirm completions**
  - Review completed jobs for today
  - Verify completion status
  - Check for any issues

- [ ] **Flag issues (no manual fixes)**
  - If something looks wrong, flag it
  - Use: `POST /api/pilot/escalate`
  - Document the issue, don't try to fix it

### UI Hint (Small Text on Dashboard)

**Add to Branch Owner dashboard:**

```tsx
<div className="text-sm text-gray-500 mt-2">
  Daily rhythm: Assign early. Review once. Escalate, don't improvise.
</div>
```

**Location:** Top of dashboard, below main title

#### Implementation Steps

1. **Add daily rhythm hint to dashboard:**
   - Find: `app/branch-owner/dashboard/page.tsx`
   - Add hint text below title
   - Style: Small, subtle, gray text

2. **Create quick links section:**
   - Link to: "Jobs Today"
   - Link to: "Assignment Queue"
   - Link to: "Needs Attention"

3. **Add weekly payout reminder:**
   - Show on payout day
   - Reminder: "Weekly payout review today"
   - Link to: Payout schedule endpoint

#### Expected Result

- ✅ Clear daily routine established
- ✅ Consistent operations
- ✅ Less decision fatigue
- ✅ Calm, predictable workflow

---

## 3️⃣ Consistent Cleaner Messages (Zero Variants)

**Priority:** Medium - Implement fourth  
**Impact:** Builds trust through consistency  
**Time:** 1 hour

### Message Templates (Use Exact Wording)

#### A. After Completion (Auto or Manual Send)

**When:** Immediately after cleaner marks job as complete

**Message (Exact):**
> "Thanks for completing your job. Payouts are processed weekly. Check your dashboard for status."

**Delivery:**
- In-app notification
- Optional: SMS/Email (if configured)

**Implementation:**
```typescript
// After job completion
await sendCleanerNotification(cleanerId, {
  type: "JOB_COMPLETED",
  message: "Thanks for completing your job. Payouts are processed weekly. Check your dashboard for status.",
  link: "/cleaner/dashboard",
});
```

#### B. If Payment Missing (Triggered Banner or Manual Nudge)

**When:** After payout dry-run shows cleaner has no payment method

**Message (Exact):**
> "Your payout is ready. Please add and verify your payment method to release it."

**Delivery:**
- In-app notification
- Optional: SMS/Email (if configured)
- Link to: `/cleaner/payments`

**Implementation:**
```typescript
// When payout is held due to missing payment method
await sendCleanerNotification(cleanerId, {
  type: "PAYOUT_HELD",
  message: "Your payout is ready. Please add and verify your payment method to release it.",
  link: "/cleaner/payments",
});
```

### Rules

- ✅ **No timestamps** - Don't promise exact times
- ✅ **No promises** - Don't commit to specific dates
- ✅ **Consistency** - Use exact same wording every time
- ✅ **Zero variants** - No personalization or changes

#### Implementation Steps

1. **Create message constants:**
   ```typescript
   // lib/messages/cleanerMessages.ts
   export const CLEANER_MESSAGES = {
     JOB_COMPLETED: "Thanks for completing your job. Payouts are processed weekly. Check your dashboard for status.",
     PAYOUT_HELD: "Your payout is ready. Please add and verify your payment method to release it.",
   } as const;
   ```

2. **Update job completion flow:**
   - Find: `app/api/cleaner/jobs/[jobId]/complete/route.ts`
   - Add message send after completion
   - Use exact message from constants

3. **Update payout processing:**
   - Find: `lib/pilot/payoutCycle.ts`
   - When payout is skipped due to missing payment method
   - Send message to cleaner
   - Use exact message from constants

4. **Test:**
   - Complete a job - verify message sent
   - Process payout without payment method - verify message sent
   - Check message wording matches exactly

#### Expected Result

- ✅ Consistent messaging
- ✅ Predictable expectations
- ✅ Builds trust
- ✅ Reduces support questions

---

## 4️⃣ Metrics Lock (Only These 5)

**Priority:** Low - Implement fifth  
**Impact:** Focus on what matters  
**Time:** 30 minutes

### Track Weekly (Not Daily)

**Only these 5 metrics:**

1. **Jobs booked**
   - Count: Total jobs created this week
   - Target: Steady growth or stable
   - Action if spikes: Check for anomalies

2. **Jobs completed**
   - Count: Total jobs completed this week
   - Target: ≥ 90% of booked jobs
   - Action if low: Review completion process

3. **Avg assignment time**
   - Metric: Average time from booking to assignment
   - Target: ≤ 60 minutes
   - Action if high: Review assignment queue

4. **Held payouts (count)**
   - Count: Payouts held due to missing payment method
   - Target: ≤ 1 per cleaner per week
   - Action if high: Review payment method onboarding

5. **Support tickets**
   - Count: Total support tickets this week
   - Target: ≤ 2 per week
   - Action if high: Review common issues

### Rule: If One Spikes → Change One Thing Only

**Don't:**
- ❌ Change multiple things at once
- ❌ Over-analyze
- ❌ Panic

**Do:**
- ✅ Identify the one metric that's off
- ✅ Make one small change
- ✅ Wait a week to see impact
- ✅ Adjust again if needed

#### Implementation Steps

1. **Create metrics dashboard:**
   - Location: `/pilot/metrics` or `/branch-owner/metrics`
   - Show only these 5 metrics
   - Weekly view (not daily)

2. **Add metrics API:**
   ```typescript
   // app/api/pilot/metrics/weekly/route.ts
   export async function GET() {
     const weekStart = getLastWeekRange().start;
     const weekEnd = getLastWeekRange().end;
     
     return {
       jobsBooked: await countJobsBooked(weekStart, weekEnd),
       jobsCompleted: await countJobsCompleted(weekStart, weekEnd),
       avgAssignmentTime: await calculateAvgAssignmentTime(weekStart, weekEnd),
       heldPayouts: await countHeldPayouts(weekStart, weekEnd),
       supportTickets: await countSupportTickets(weekStart, weekEnd),
     };
   }
   ```

3. **Display metrics:**
   - Simple cards or table
   - Weekly comparison (this week vs last week)
   - Color coding: Green (good), Yellow (watch), Red (action needed)

#### Expected Result

- ✅ Focus on what matters
- ✅ Avoid analysis paralysis
- ✅ Clear action triggers
- ✅ Measurable progress

---

## 5️⃣ Small UI Polish (Optional, Fast)

**Priority:** Optional - Implement last  
**Impact:** Better UX, minimal effort  
**Time:** 30-45 minutes

### A. Grey Out "Request Reassignment" on Completed Jobs

**Location:** Job detail page or cleaner job list

**Implementation:**
```tsx
<Button
  variant="outline"
  disabled={job.status === "COMPLETED"}
  className={job.status === "COMPLETED" ? "opacity-50 cursor-not-allowed" : ""}
>
  Request Reassignment
  {job.status === "COMPLETED" && (
    <Tooltip>
      <TooltipContent>
        Cannot reassign completed jobs
      </TooltipContent>
    </Tooltip>
  )}
</Button>
```

**Impact:** Prevents confusion and invalid actions

### B. Tooltip on "No Payment Method"

**Location:** Cleaner oversight dashboard (`/branch-owner/cleaners`)

**Implementation:**
```tsx
{!cleaner.paymentMethodVerified && (
  <Tooltip>
    <TooltipTrigger>
      <Badge variant="destructive">No Payment Method</Badge>
    </TooltipTrigger>
    <TooltipContent>
      Payout will release once payment method is added and verified.
    </TooltipContent>
  </Tooltip>
)}
```

**Impact:** Clarifies what needs to happen

### C. Payment Method Status in Cleaner Dashboard

**Location:** Cleaner dashboard

**Implementation:**
```tsx
<div className="mb-4">
  <h3 className="text-sm font-medium mb-2">Payout Readiness</h3>
  {paymentMethodVerified ? (
    <Badge variant="success">✅ Payment method verified</Badge>
  ) : paymentMethodExists ? (
    <Badge variant="warning">⏳ Payment method pending verification</Badge>
  ) : (
    <Badge variant="destructive">❌ No payment method</Badge>
  )}
</div>
```

**Impact:** Cleaners see their payout readiness at a glance

### No Backend Changes Required

**All of these are frontend-only changes:**
- ✅ No API changes needed
- ✅ No database changes needed
- ✅ Just UI/UX improvements
- ✅ Quick to implement

#### Expected Result

- ✅ Better UX with minimal effort
- ✅ Fewer support questions
- ✅ Clearer expectations
- ✅ Professional appearance

---

## ✅ Verification (10 minutes)

### Test Checklist

**Create test scenarios and verify:**

1. **Create a cleaner without payment → banner shows**
   - [ ] Log in as cleaner without payment method
   - [ ] Verify banner appears on dashboard
   - [ ] Verify banner text matches exactly
   - [ ] Verify "Add Payment Method" link works

2. **Assign a job → pre-assignment warning shows**
   - [ ] Assign cleaner without payment method to a job
   - [ ] Verify warning appears
   - [ ] Verify assignment still proceeds
   - [ ] Verify warning text matches exactly

3. **Complete job → payout held, status visible**
   - [ ] Complete a job for cleaner without payment method
   - [ ] Run payout dry-run
   - [ ] Verify payout is skipped (not created)
   - [ ] Verify reason: "NO_PAYMENT_METHOD"
   - [ ] Verify cleaner sees payout readiness status

4. **Add payment method → payout advances automatically**
   - [ ] Add payment method for cleaner
   - [ ] Admin verifies payment method
   - [ ] Run payout dry-run again
   - [ ] Verify payout is now eligible
   - [ ] Verify payout would be created

### If All Pass → Week 2 is Green

**Success Criteria:**
- ✅ Banner shows correctly
- ✅ Warning shows correctly
- ✅ Payouts held correctly
- ✅ Status updates correctly

**If any fail:** Fix the issue before proceeding.

---

## 📋 Implementation Checklist Summary

### Week 2 Implementation Order

- [ ] **1A. Cleaner Dashboard Banner** (30-60 min)
  - [ ] Add payment method check
  - [ ] Add banner component
  - [ ] Test with cleaner account

- [ ] **1B. Pre-Assignment Warning** (30-45 min)
  - [ ] Add payment method check to assignment flow
  - [ ] Add warning message
  - [ ] Test assignment with warning

- [ ] **2. Branch Owner Daily Rhythm** (1-2 hours)
  - [ ] Add daily rhythm hint to dashboard
  - [ ] Add quick links section
  - [ ] Add weekly payout reminder

- [ ] **3. Consistent Cleaner Messages** (1 hour)
  - [ ] Create message constants
  - [ ] Update job completion flow
  - [ ] Update payout processing
  - [ ] Test message delivery

- [ ] **4. Metrics Lock** (30 min)
  - [ ] Create metrics API
  - [ ] Create metrics dashboard
  - [ ] Display 5 metrics only

- [ ] **5. Small UI Polish** (30-45 min)
  - [ ] Grey out reassignment on completed jobs
  - [ ] Add tooltip on "No Payment Method"
  - [ ] Add payment method status to cleaner dashboard

- [ ] **Verification** (10 min)
  - [ ] Test all scenarios
  - [ ] Verify all pass
  - [ ] Mark Week 2 as green

---

## 🚀 What I'll Help With Next (Your Choice)

### Option 1: Week 3 Hardening

**Block 2nd assignment without payment method**

- First job: Warning only
- Second job: Require payment method
- Implementation: Add assignment count check

### Option 2: City #2 Prep

**Clone Miami playbook**

- Document Miami process
- Create setup script for new city
- Prepare expansion checklist

### Option 3: Onboarding UX Polish

**Reduce time-to-first-payout**

- Streamline payment method flow
- Add progress indicators
- Improve verification process

---

## 📝 Reply Format

**When Week 2 is complete, reply with one line:**

- `"Week 2 changes deployed — review next."`
- or
- `"Implement Week 3 hardening next."`

---

## 🎯 Success Criteria

**Week 2 is successful if:**

- ✅ Cleaner dashboard banner implemented
- ✅ Pre-assignment warning implemented
- ✅ Branch Owner rhythm established
- ✅ Consistent messages in place
- ✅ Metrics dashboard created
- ✅ UI polish completed
- ✅ All verification tests pass

**If all criteria met:** Proceed to next phase.

**If any criteria unmet:** Fix issues before proceeding.

---

**Status:** 📋 Ready for Week 2 Implementation  
**Last Updated:** 2025-01-13  
**Next:** Implement in order, verify, then proceed

---

**Remember:** Steady progress. Protected cash. Calm ops.












