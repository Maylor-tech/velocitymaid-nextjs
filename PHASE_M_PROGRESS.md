# Phase M: Miami Pilot Live Ops — Progress Tracker

**Date:** 2025-01-13  
**Status:** 🚀 **IN PROGRESS**

---

## ✅ Completed

### M1. Territory Definition ✅

**Implemented:**
- ✅ `lib/pilot/territory.ts` - Territory validation functions
- ✅ `app/api/pilot/validate-territory/route.ts` - Territory validation API
- ✅ Miami-Dade core ZIP whitelist (15 ZIPs)
- ✅ Service hours: 8am-6pm
- ✅ ZIP code validation
- ✅ Service hours validation

**Next Steps:**
- Add territory validation to job creation endpoints:
  - `app/api/checkout/route.ts`
  - `app/api/booking/create/route.ts`
  - `app/api/webhooks/stripe/route.ts`

---

## 🚧 In Progress

### M2. People Stack
- Create Miami branch setup script
- Assign Branch Owner
- Lock role assignments during pilot

---

## 📋 Pending

### M3. Cleaner Onboarding
- Add payout readiness check to assignment API
- Block assignments if payment method missing

### M4. Job Intake & Assignment
- Track assignment time
- SLA violation alerts
- Assignment queue dashboard

### M5. Customer Experience
- Email confirmation on job creation
- SMS/Email reminder 24h before
- Cancellation window enforcement

### M6. Day-of-Job Operations
- Escalation endpoint
- Day-of-job dashboard

### M7. Payout Cycle
- Weekly payout schedule
- Payout eligibility checks

### M8. Metrics Dashboard
- Daily metrics view
- Weekly summary
- Trend analysis

### M9. Failure Protocol
- No-show detection and reassignment
- Late cancellation fee application
- Payout issue resolution workflow

### M10. Pilot Exit Criteria
- Automated criteria evaluation
- Daily status report
- Decision framework

---

## 🎯 30-Day Targets

- 50+ jobs completed
- ≤ 10% cancellation rate
- 100% on-time payouts
- Zero pricing overrides
- Branch Owner independence

---

**Last Updated:** 2025-01-13










