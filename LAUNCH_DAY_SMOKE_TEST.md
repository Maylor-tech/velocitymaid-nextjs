# 🚀 VELOCITYMAID — PHASE 0 LAUNCH-DAY SMOKE TEST

*(30–45 minutes total, zero guesswork)*

---

## 🧘🏽‍♂️ PRE-FLIGHT (5 minutes)

**Rule for today:**
👉 *No refactors, no "one more fix," no Cursor experiments.*

### 1. Freeze the repo

- ✅ `main` branch only
- ❌ No new commits during testing
- ❌ No admin / pilot / finance changes

### 2. Confirm governance files exist

Check that these are present in repo root:

- `RULES.md`
- `PHASE_0_HOW_IT_WORKS.md`
- `.eslintrc.json`
- `LAUNCH_DAY_SMOKE_TEST.md` (this file)

**If yes → proceed**  
**If not → stop and add them first**

---

## 🏗️ BUILD & DEPLOY CHECK (10 minutes)

### 3. Local build (final confirmation)

Run:

```bash
npm run build
```

✅ **Must pass with zero errors**

**If this fails → do not deploy**

---

### 4. Vercel deployment

- Trigger a **fresh deploy**
- Watch logs

✅ **Success = green build, no ignored warnings**  
❌ **Failure = stop, do NOT "quick fix" without checking RULES.md**

---

## 🌍 PUBLIC FLOW TEST (CORE REVENUE PATH)

### 5. Booking flow (customer side)

Go to production URL.

#### Step-by-step

1. Click **Book a Cleaning**
2. Select **Country**
   - Jamaica (for Phase 0)
   - USA (if available)
3. Select **Branch**
   - Must be filtered by country
   - Cannot proceed without branch
4. Select **Service**
5. Enter **Home details**
6. Select **Date & time**
7. Proceed to **Stripe checkout**

✅ **PASS CRITERIA:**

- Cannot skip country
- Cannot skip branch
- No admin data loads
- No console errors

---

### 6. Stripe payment (test or live)

Depending on mode:

- **Test mode:** Stripe test card
- **Live mode:** small real payment (recommended)

After payment:

- Redirects to confirmation page
- No job created *before* payment
- No errors

✅ **PASS CRITERIA:**

- Payment succeeds
- Confirmation page loads
- No duplicate jobs

---

### 7. Customer dashboard

Navigate to:

```
/customer
```

Check:

- Job appears
- Correct branch shown
- Correct status
- No unpaid jobs visible

✅ **PASS CRITERIA:**

- Dashboard loads
- Data matches booking
- No admin fields shown

---

## 🧹 CLEANER FLOW TEST (SUPPLY SIDE)

### 8. Cleaner application

Go to:

```
/cleaners/apply
```

#### Step-by-step

1. Fill personal info
2. Select **Country**
3. Select **Branch**
   - Disabled until country selected
4. Submit form

✅ **PASS CRITERIA:**

- Branch required
- Branch filtered by country
- Submission succeeds
- No admin API calls

---

## 🔐 NEGATIVE TESTS (IMPORTANT)

### 9. Forbidden access checks

Try to visit:

```
/admin
/branch-owner
/pilot
/finance
```

✅ **Expected result:**

- 404
- or blocked
- or redirect away

❌ **If any load → STOP (Phase 0 violation)**

---

## 🧪 QUICK TECH CHECK (5 minutes)

### 10. Browser console

- Open DevTools
- Reload homepage, booking, cleaner apply

✅ **PASS:**

- No red errors
- Warnings acceptable only if cosmetic

---

### 11. Network tab (optional)

- Ensure:
  - `/api/branches` used
  - No `/api/admin/*` calls
  - Stripe calls only during checkout

---

## 🟢 LAUNCH DECISION

### ALL TRUE?

- ✅ Build passes
- ✅ Booking works
- ✅ Payment works
- ✅ Dashboard works
- ✅ Cleaner apply works
- ✅ Admin routes blocked

👉 **YOU ARE LIVE**

**Stop touching code.**  
**Celebrate.**  
**Monitor only.**

---

## 🚫 ABSOLUTE "DO NOT" LIST (TODAY)

- ❌ Do not re-enable admin
- ❌ Do not refactor "just one thing"
- ❌ Do not change schema
- ❌ Do not optimize performance today
- ❌ Do not let Cursor "suggest improvements"

**Today is execution, not iteration.**

---

## 🧭 IF SOMETHING FAILS

Ask **only one question**:

> "Does this violate RULES.md or Phase 0 scope?"

- **If yes → revert**
- **If no → document and fix after launch**

---

## 🕊️ FINAL WORD

You now have:

- ✅ Architecture
- ✅ Rules
- ✅ Enforcement
- ✅ A stable platform
- ✅ A clean launch path

**Most people never reach this point.**  
**You did.**

---

## 📋 CHECKLIST SUMMARY (Print This)

```
PRE-FLIGHT
[ ] Repo frozen (main branch only)
[ ] Governance files present

BUILD & DEPLOY
[ ] Local build passes
[ ] Vercel deploy succeeds

PUBLIC FLOW
[ ] Booking: Country → Branch → Service → Payment
[ ] Stripe payment completes
[ ] Customer dashboard shows job

CLEANER FLOW
[ ] Application: Country → Branch → Submit
[ ] Submission succeeds

NEGATIVE TESTS
[ ] /admin returns 404
[ ] /branch-owner returns 404
[ ] /pilot returns 404

TECH CHECK
[ ] No console errors
[ ] No admin API calls

LAUNCH DECISION
[ ] All checks pass → GO LIVE
```

---

## 🎯 NEXT STEPS (After Launch)

If you want next (after launch):

- **B** – Phase 1 roadmap (admin & branch owner, safely)
- **C** – Jamaica-only lock + marketing focus
- **D** – UX polish checklist (safe improvements)

But for now:

**Run the checklist.**  
**Ship calmly.**  
**You're ready.**

