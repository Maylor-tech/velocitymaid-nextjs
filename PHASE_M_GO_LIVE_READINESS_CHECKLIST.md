# Phase M — Go-Live Readiness Checklist (Miami Pilot)

**Purpose:** Final checklist before public launch  
**Status:** 🚀 **FINAL PREPARATION**  
**Goal:** Finish the 4 critical items, then launch

---

## 🎯 WHAT YOU MUST DO BEFORE GO-LIVE

**Only 4 items. That's it.**

1. ✅ Finish Cleaner Payment Method Banner
2. ✅ Verify Customer Booking → Completion → Payout (2 test jobs)
3. ✅ Lock Standard Message Scripts
4. ✅ Confirm Support Channel Rules

**No new features. No expansion. No polishing. Just finish these 4 items.**

---

## PHASE 1 — CORE SYSTEM READINESS (FOUNDATION)

### 1️⃣ Authentication & Roles

**Status:** ✅ **DONE**

- [x] Admin role working
- [x] Branch Owner role working
- [x] Cleaner role working
- [x] Role-based access enforced server-side
- [x] No privilege leakage (Branch Owner cannot see money)

👉 **No action needed**

---

### 2️⃣ Pricing & Revenue Locks

**Status:** ✅ **DONE**

- [x] Central pricing source
- [x] Pricing snapshot on job confirmation
- [x] No post-confirm edits
- [x] Discounts admin-only
- [x] Refund logic deterministic

👉 **No action needed**

---

### 3️⃣ Payout Engine

**Status:** ✅ **DONE**

- [x] Weekly payout cycle implemented
- [x] Dry-run verified
- [x] Live payout executed successfully
- [x] Branch-scoped payouts
- [x] Audit logging enabled

👉 **No action needed**

---

## PHASE 2 — OPERATIONAL SAFETY (TRUST)

### 4️⃣ Cleaner Payment Readiness

**Status:** 🟡 **IN PROGRESS (Week 2 work)**

**⚠️ This must be done before public launch**

**Before go-live, ensure:**

- [ ] **Cleaner dashboard banner when payment missing**
  - Banner shows on `/cleaner/dashboard` or `/cleaners/dashboard`
  - Visible when `paymentMethodVerified === false`
  - Text: "⚠️ Add a payment method to receive payouts. Your completed jobs are ready—payouts release once payment is verified."
  - Link to `/cleaner/payments`

- [ ] **Clear "payment required to release payout" copy**
  - Message is clear and actionable
  - No confusion about what needs to happen
  - Tone: Helpful, not demanding

- [ ] **Cleaner knows where to add payment method**
  - Link is visible and works
  - Payment method page is accessible
  - Flow is clear

- [ ] **Payout automatically releases once verified**
  - When admin verifies payment method
  - Next payout cycle includes the cleaner
  - No manual intervention needed

**Implementation:**
- See: `PHASE_M_WEEK_2_IMPLEMENTATION_CHECKLIST.md` - Section 1A
- Time: 30-60 minutes
- Priority: **HIGHEST**

**Why this matters:**
- Prevents payout anxiety
- Reduces support overload
- Builds trust through clarity

---

### 5️⃣ Cleaner Onboarding Completion

**Status:** ✅ **DONE**

**Verify one last time:**

- [x] Identity verification enforced
- [x] Payment method setup flow works
- [x] Cleaner can see job + payout status
- [x] No confusion screens

👉 **No action needed**

---

### 6️⃣ Branch Owner Ops Readiness

**Status:** ✅ **DONE**

- [x] Branch dashboard clean & non-financial
- [x] Job assignment works
- [x] Reassignment / flagging works
- [x] Escalation path exists
- [x] Read-only financial boundaries enforced

👉 **No action needed**

---

## PHASE 3 — CUSTOMER EXPERIENCE (FRONT DOOR)

### 7️⃣ Booking Flow Verification

**Status:** 🔲 **MUST VERIFY**

**Before go-live, confirm:**

- [ ] **Customer can book without errors**
  - Test booking from customer perspective
  - No broken forms or validation errors
  - Payment processing works

- [ ] **Confirmation email/SMS sends**
  - Customer receives confirmation immediately
  - Email/SMS content is correct
  - Includes job details and timing

- [ ] **Job shows correctly in admin + branch owner views**
  - Job appears in admin dashboard
  - Job appears in branch owner dashboard
  - All details are correct

- [ ] **Cancellation policy visible**
  - Policy is displayed during booking
  - Policy is clear and understandable
  - Cancellation window is stated

- [ ] **No pricing edits post-booking**
  - Pricing is locked after booking
  - Admin cannot edit prices
  - Branch Owner cannot edit prices

**Action Required:**
👉 **Do 2 test bookings end-to-end.**

**Test Booking 1:**
1. Create booking as customer
2. Verify confirmation received
3. Check job appears in admin/branch owner views
4. Verify pricing is locked
5. Complete the job
6. Verify payout eligibility

**Test Booking 2:**
1. Create another booking
2. Test cancellation flow
3. Verify cancellation fee (if applicable)
4. Verify refund logic (if applicable)

---

### 8️⃣ Cancellation & No-Show Rules

**Status:** 🔲 **MUST VERIFY**

**Before go-live, confirm:**

- [ ] **Late cancellation fee applied correctly**
  - Fee is calculated correctly
  - Fee is applied automatically
  - Customer is notified

- [ ] **No-show logic triggers correctly**
  - No-show is detected automatically
  - Appropriate actions are taken
  - Cleaner is compensated correctly

- [ ] **Refunds follow locked rules**
  - Refund amount matches policy
  - Refund is processed correctly
  - No manual overrides

- [ ] **Branch Owner cannot override**
  - Branch Owner cannot change cancellation fees
  - Branch Owner cannot override refunds
  - All changes require admin approval

**⚠️ This protects cash flow.**

**Action Required:**
- Test cancellation within window (should be free)
- Test cancellation outside window (fee should apply)
- Test no-show scenario
- Verify Branch Owner cannot override

---

## PHASE 4 — COMMUNICATION & EXPECTATION SETTING

### 9️⃣ Standard Message Scripts

**Status:** 🔲 **REQUIRED**

**Have exact wording ready (no improvising):**

#### Cleaner Completion Message

**Exact Text:**
> "Thanks for completing your job. Payouts are processed weekly. Check your dashboard for status."

**When to send:** Immediately after job completion  
**Where:** In-app notification, optional SMS/Email

#### Payout Timing Message

**Exact Text:**
> "Payouts for last week are being processed today. Status will update in-app once complete. Thank you for your professionalism."

**When to send:** After live payout is processed  
**Where:** In-app notification, optional SMS/Email

#### Payment Missing Reminder

**Exact Text:**
> "Your payout is ready. Please add and verify your payment method to release it."

**When to send:** When payout is held due to missing payment method  
**Where:** In-app notification, optional SMS/Email  
**Link:** `/cleaner/payments`

#### Customer Confirmation

**Exact Text:**
> "Your cleaning service is confirmed for [DATE] at [TIME]. We'll send a reminder 24 hours before. Thank you for choosing VelocityMaid."

**When to send:** Immediately after booking  
**Where:** Email/SMS

#### Customer Reminder (T-24)

**Exact Text:**
> "Reminder: Your cleaning service is tomorrow at [TIME]. If you need to reschedule or cancel, please contact us at least 24 hours in advance."

**When to send:** 24 hours before scheduled service  
**Where:** Email/SMS

**Action Required:**
- [ ] Copy all messages into a document
- [ ] Store in easy-to-find location
- [ ] Use exact wording - no variations
- [ ] Test message delivery

👉 **Copy/paste only. Consistency = trust.**

**Implementation:**
- See: `PHASE_M_WEEK_2_IMPLEMENTATION_CHECKLIST.md` - Section 3
- Create: `lib/messages/standardMessages.ts` with all messages
- Use constants, never hardcode messages

---

### 🔟 Support Channel Discipline

**Status:** 🔲 **REQUIRED**

**Before go-live:**

- [ ] **One official support channel defined**
  - Choose: Email, SMS, WhatsApp, or in-app
  - Document the channel
  - Make it visible to customers and cleaners

- [ ] **No WhatsApp problem-solving**
  - All issues go through official channel
  - No side-channel resolutions
  - Everything logged and tracked

- [ ] **Escalation path documented**
  - Branch Owner → Admin escalation
  - Customer → Support escalation
  - Cleaner → Support escalation
  - Document: Who escalates to whom

- [ ] **"We'll respond within X hours" expectation set**
  - Define response time SLA
  - Communicate to customers/cleaners
  - Example: "We respond within 24 hours"

**Action Required:**
- [ ] Document support channel
- [ ] Create escalation flowchart
- [ ] Set response time expectations
- [ ] Communicate to team

**This prevents burnout.**

**Implementation:**
- Create: `SUPPORT_CHANNEL_DOCUMENTATION.md`
- Include: Channel, escalation path, response times
- Share with team

---

## PHASE 5 — LEGAL & RISK MINIMUMS (NOT HEAVY, JUST ENOUGH)

### 1️⃣1️⃣ Business Basics

**Status:** 🔲 **VERIFY**

**Before go-live, confirm:**

- [ ] **Business name displayed clearly**
  - Visible on website
  - Visible in communications
  - Consistent branding

- [ ] **Terms of Service link visible**
  - Link exists (can be placeholder)
  - Accessible from footer or menu
  - Customers can find it

- [ ] **Privacy Policy link visible**
  - Link exists (can be placeholder)
  - Accessible from footer or menu
  - Customers can find it

- [ ] **"Independent contractor" language for cleaners**
  - Cleaner agreement mentions independent contractor status
  - Clear that cleaners are not employees
  - Basic legal protection

**Note:** Does not need to be perfect — just present.

**Action Required:**
- [ ] Verify all links exist
- [ ] Check business name is consistent
- [ ] Review cleaner agreement language
- [ ] Add links to footer if missing

---

## PHASE 6 — FINAL GO-LIVE GATE (THE REAL QUESTION)

### 1️⃣2️⃣ Go-Live Decision Gate

**You are ready to go live when ALL of these are true:**

- [ ] **Cleaners get paid correctly**
  - Payout system works
  - Dry-run passes
  - Live payout executed successfully

- [ ] **Pricing cannot be tampered with**
  - Pricing locks work
  - No post-confirm edits
  - Branch Owner cannot override

- [ ] **Branch Owner cannot break rules**
  - Read-only financial boundaries
  - Escalation path works
  - No manual overrides

- [ ] **You are not manually fixing things daily**
  - System handles edge cases
  - Automation works
  - Minimal manual intervention

- [ ] **You feel calm, not anxious, reviewing the dashboard**
  - Numbers make sense
  - No surprises
  - Trust in the system

**If calm = green light.**

**If anxious = fix the anxiety source first.**

---

## 🎯 THE 4 CRITICAL ITEMS (DO THESE NOW)

### 1. Finish Cleaner Payment Method Banner

**Status:** 🟡 In Progress  
**Priority:** HIGHEST  
**Time:** 30-60 minutes

**What to do:**
1. Implement dashboard banner (see Week 2 Implementation Checklist)
2. Test with cleaner account
3. Verify banner appears when payment method missing
4. Verify link works
5. Mark complete ✅

**Reference:** `PHASE_M_WEEK_2_IMPLEMENTATION_CHECKLIST.md` - Section 1A

---

### 2. Verify Customer Booking → Completion → Payout (2 test jobs)

**Status:** 🔲 Must Verify  
**Priority:** HIGH  
**Time:** 30-45 minutes

**What to do:**

**Test Job 1:**
1. Create booking as customer
2. Verify confirmation email/SMS
3. Check job appears in admin/branch owner views
4. Assign cleaner
5. Complete job
6. Run payout dry-run
7. Verify payout eligibility

**Test Job 2:**
1. Create another booking
2. Test cancellation flow
3. Verify cancellation fee (if applicable)
4. Complete end-to-end if not cancelled

**Mark complete when:**
- [ ] Both test jobs completed successfully
- [ ] All steps verified
- [ ] No errors encountered

---

### 3. Lock Standard Message Scripts

**Status:** 🔲 Required  
**Priority:** HIGH  
**Time:** 30 minutes

**What to do:**
1. Create `lib/messages/standardMessages.ts`
2. Add all 5 message templates (exact wording)
3. Update code to use message constants
4. Test message delivery
5. Document message usage

**Messages to lock:**
- [ ] Cleaner completion message
- [ ] Payout timing message
- [ ] Payment missing reminder
- [ ] Customer confirmation
- [ ] Customer reminder (T-24)

**Reference:** See Section 9️⃣ above for exact text

**Mark complete when:**
- [ ] All messages in constants file
- [ ] Code uses constants (no hardcoded messages)
- [ ] Messages tested

---

### 4. Confirm Support Channel Rules

**Status:** 🔲 Required  
**Priority:** MEDIUM  
**Time:** 15-30 minutes

**What to do:**
1. Choose one official support channel
2. Document escalation path
3. Set response time expectations
4. Create support documentation
5. Share with team

**Document:**
- [ ] Official support channel (Email/SMS/WhatsApp/In-app)
- [ ] Escalation flowchart
- [ ] Response time SLA
- [ ] "No WhatsApp problem-solving" rule

**Create:** `SUPPORT_CHANNEL_DOCUMENTATION.md`

**Mark complete when:**
- [ ] Support channel documented
- [ ] Escalation path clear
- [ ] Team knows the rules

---

## ✅ Final Verification Checklist

**Before marking "Ready for Go-Live":**

- [ ] Cleaner payment method banner implemented and tested
- [ ] 2 test bookings completed end-to-end
- [ ] Standard message scripts locked and tested
- [ ] Support channel rules documented
- [ ] All Phase 1-3 items verified ✅
- [ ] All Phase 4-5 items completed 🔲
- [ ] Go-Live Decision Gate criteria met
- [ ] You feel calm reviewing the system

---

## 🚀 Go-Live Command

**When all 4 critical items are complete and you feel calm:**

**Reply with:**
> "✅ Go-Live Ready — All 4 critical items complete. Proceeding with public launch."

**Then:**
1. Enable public bookings
2. Monitor first day closely
3. Follow Day 1 Live Ops Checklist
4. Stay calm, let the system work

---

## 📋 Quick Reference

**The 4 Critical Items:**
1. ✅ Cleaner Payment Method Banner
2. ✅ 2 Test Bookings End-to-End
3. ✅ Standard Message Scripts Locked
4. ✅ Support Channel Rules Documented

**Everything Else:**
- Phase 1-3: ✅ Mostly done, verify
- Phase 4-5: 🔲 Complete as needed
- Phase 6: Decision gate when ready

---

**Status:** 📋 Ready to Finish  
**Last Updated:** 2025-01-13  
**Next:** Complete the 4 critical items, then launch

---

**Remember:** No new features. No expansion. No polishing. Just finish these 4 items and launch.











