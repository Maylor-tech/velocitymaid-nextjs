# Phase M: Miami Pilot Live Ops — Implementation Plan

**Date:** 2025-01-13  
**Status:** 🚀 **IN PROGRESS**

**Mission:** Launch Miami as a self-contained operating unit that proves repeatable cash flow in 30 days.

**Guiding Principle:** "One city. One standard. One source of truth."

---

## Overview

This phase shifts VelocityMaid from built to earning. The goal is simple and disciplined: prove repeatable cash flow in one city without breaking trust, margins, or people.

**Pilot Success Window:** 30 days  
**Outcome:** Decision-ready data to expand or refine.

---

## M1. Territory Definition (Lock the Map)

### Requirements

- **Service Area:** Miami-Dade core (start tight)
- **ZIP Whitelist:** 10–15 ZIPs max
- **Service Hours:** 8am–6pm (reduce edge cases)
- **Lock:** No ad-hoc jobs outside bounds

### Implementation

**Schema:**
- Add `ServiceTerritory` model
- Add `allowedZipCodes` to Branch
- Add `serviceHoursStart` and `serviceHoursEnd` to Branch

**API:**
- Territory validation on job creation
- ZIP code whitelist check
- Service hours validation

**Files:**
- `prisma/schema.prisma` - Territory fields
- `lib/territory/validation.ts` - ZIP and hours validation
- `app/api/jobs/validate-territory/route.ts` - Territory check endpoint

---

## M2. People Stack (Minimum Viable Team)

### Requirements

**Roles:**
1. Branch Owner (Ops-focused)
2. 3–5 Cleaners (verified + payout-ready)
3. Admin (light-touch)

**Rules:**
- No new roles during pilot
- No "friends & favors"
- Everyone follows the same onboarding

### Implementation

**Setup:**
- Create Miami branch in system
- Assign Branch Owner
- Onboard cleaners via Phase J flow
- Lock role assignments during pilot

**Files:**
- `scripts/setup_miami_pilot.sql` - Initial branch setup
- `lib/pilot/peopleStack.ts` - People stack validation

---

## M3. Cleaner Onboarding (Day 1–7)

### Requirements

**Use Phase J flow only**

**Require:**
- Identity verified
- Payment method verified
- Availability set

**Non-negotiable:**
- No payment method → no assignments

### Implementation

**Enforcement:**
- Check payout readiness before assignment
- Block assignments if payment method missing
- Use existing Phase J API

**Files:**
- `app/api/branch-owner/jobs/assign/route.ts` - Add payout readiness check
- `lib/pilot/cleanerValidation.ts` - Pre-assignment validation

---

## M4. Job Intake & Assignment (Daily Rhythm)

### Requirements

**Sources:**
- Website bookings
- Manual admin-created jobs (limited)

**Assignment Rules:**
- Branch Owner assigns within territory
- Use availability + proximity
- No price changes (Phase L enforced)

**SLA:**
- Assign within 60 minutes during business hours

### Implementation

**Tracking:**
- Assignment time metric
- SLA violation alerts
- Assignment queue dashboard

**Files:**
- `app/api/branch-owner/jobs/assign/route.ts` - Track assignment time
- `app/api/pilot/metrics/assignment-sla/route.ts` - SLA tracking
- `app/pilot/dashboard/page.tsx` - Assignment queue

---

## M5. Customer Experience Guardrails

### Requirements

**Automated:**
- Confirmation sent immediately
- Reminder at T–24h
- Clear cancellation window (locked rules)

**Branch Owner can:**
- Reassign
- Cancel (with reason)
- Flag for review

**Cannot:**
- Discount
- Refund
- Change price

### Implementation

**Automation:**
- Email confirmation on job creation
- SMS/Email reminder 24h before
- Cancellation window enforcement

**Files:**
- `app/api/jobs/[jobId]/confirm/route.ts` - Send confirmation
- `workers/send-job-reminders.ts` - 24h reminder worker
- `lib/pilot/customerExperience.ts` - Customer guardrails

---

## M6. Day-of-Job Operations

### Requirements

**Cleaner Workflow:**
1. Cleaner checks in
2. Completes job
3. Marks complete

**System Checks:**
- Completion timestamp
- Payout eligibility
- Snapshot integrity

**If issue:**
- Escalate to Admin (not WhatsApp chaos)

### Implementation

**Workflow:**
- Use existing cleaner job completion API
- Add escalation endpoint
- Track completion metrics

**Files:**
- `app/api/cleaner/jobs/[jobId]/complete/route.ts` - Already exists
- `app/api/pilot/escalate/route.ts` - Escalation endpoint
- `app/pilot/operations/page.tsx` - Day-of-job dashboard

---

## M7. Payout Cycle (Trust Moment)

### Requirements

**Schedule:** Weekly (same day/time)

**Rules:**
- Only completed + verified jobs
- No exceptions without admin override + reason

**Note:** The first payout is the most important trust event.

### Implementation

**Automation:**
- Weekly payout schedule
- Payout eligibility checks
- Clear communication

**Files:**
- `workers/weekly-payouts.ts` - Weekly payout worker
- `app/api/pilot/payouts/schedule/route.ts` - Payout schedule
- `lib/pilot/payoutCycle.ts` - Payout logic

---

## M8. Metrics to Track (Daily / Weekly)

### Daily Metrics

- Jobs booked
- Jobs completed
- Cancellations
- Assignment time

### Weekly Metrics

- Revenue (locked prices)
- Cleaner retention
- Avg job rating
- Support tickets count

**Principle:** Keep it boring. Boring scales.

### Implementation

**Dashboard:**
- Daily metrics view
- Weekly summary
- Trend analysis

**Files:**
- `app/pilot/metrics/daily/page.tsx` - Daily metrics
- `app/pilot/metrics/weekly/page.tsx` - Weekly summary
- `app/api/pilot/metrics/daily/route.ts` - Daily metrics API
- `app/api/pilot/metrics/weekly/route.ts` - Weekly metrics API

---

## M9. Failure Protocol (Plan for Reality)

### Scenarios

**If cleaner no-shows:**
- Reassign
- Apply rules
- Log incident

**If customer cancels late:**
- Apply fee (no emotion)
- Use Phase L refund rules

**If payout issue:**
- Pause payout
- Resolve within 48h
- Communicate clearly

### Implementation

**Handlers:**
- No-show detection and reassignment
- Late cancellation fee application
- Payout issue resolution workflow

**Files:**
- `lib/pilot/failureProtocol.ts` - Failure handlers
- `app/api/pilot/no-show/route.ts` - No-show handler
- `app/api/pilot/payout-issue/route.ts` - Payout issue handler

---

## M10. Pilot Exit Criteria (Day 30)

### Green Light Criteria

- ≥ 50 jobs completed
- ≤ 10% cancellations
- On-time payouts (100%)
- No pricing overrides
- Branch Owner operating independently

### Yellow Criteria

Fix one bottleneck, rerun 14 days.

### Red Criteria

Trust or payouts break → pause expansion.

### Implementation

**Checker:**
- Automated criteria evaluation
- Daily status report
- Decision framework

**Files:**
- `app/api/pilot/exit-criteria/route.ts` - Criteria checker
- `app/pilot/status/page.tsx` - Pilot status dashboard
- `lib/pilot/exitCriteria.ts` - Decision framework

---

## Implementation Order

1. **M1: Territory Definition** (Foundation)
2. **M2: People Stack** (Setup)
3. **M3: Cleaner Onboarding** (Enforcement)
4. **M4: Job Intake & Assignment** (Daily ops)
5. **M5: Customer Experience** (Automation)
6. **M6: Day-of-Job Operations** (Workflow)
7. **M7: Payout Cycle** (Trust)
8. **M8: Metrics Dashboard** (Visibility)
9. **M9: Failure Protocol** (Resilience)
10. **M10: Exit Criteria** (Decision)

---

## Success Metrics

**30-Day Targets:**
- 50+ jobs completed
- ≤ 10% cancellation rate
- 100% on-time payouts
- Zero pricing overrides
- Branch Owner independence

**What This Proves:**
- ✅ Proof of revenue
- ✅ Proof of delegation
- ✅ Proof of pricing discipline
- ✅ Confidence under pressure

---

**Status:** 🚀 Ready to build

**Next:** Start with M1 (Territory Definition)













