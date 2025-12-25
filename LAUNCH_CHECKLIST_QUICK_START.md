# 🚀 Launch Checklist Quick-Start Guide

**Purpose:** Run through the launch checklist in 30-45 minutes with confidence.

**Prerequisites:**
- ✅ Demo mode enabled (`NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`)
- ✅ Dev server running (`npm run dev`)
- ✅ Admin access to the system

---

## ⚡ Quick Setup (2 minutes)

### 1. Verify Demo Mode

```bash
# Check .env.local
cat .env.local | grep DEMO_MODE

# Should show:
# NEXT_PUBLIC_DEMO_MODE=true
# DEMO_MODE=true
```

### 2. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### 3. Verify Demo Banner

- Navigate to: `http://localhost:3000/dashboard/payouts`
- **Look for:** Yellow banner at top: "⚠️ DEMO MODE — No real payments are being processed"
- ✅ If you see it, you're ready

---

## 📋 Checklist Run-Through (30-45 minutes)

### Section 1: Core System Verification (10 min)

**Goal:** Verify the complete payout flow works.

#### Step 1.1: Reset Demo Data
```bash
# Option A: Use Dev Tools UI
# Navigate to: http://localhost:3000/admin/dev-tools
# Click "Reset Database"

# Option B: Use API directly
curl -X POST http://localhost:3000/api/admin/demo/reset \
  -H "Content-Type: application/json"
```

**✅ Check:** Response shows deleted records count.

#### Step 1.2: Seed Demo Jobs
```bash
# Option A: Use Dev Tools UI
# Navigate to: http://localhost:3000/admin/dev-tools
# Click "Seed Demo Data"

# Option B: Use API directly
curl -X POST http://localhost:3000/api/dev/seed \
  -H "Content-Type: application/json"
```

**✅ Check:** Response shows created records (customers, cleaners, jobs).

#### Step 1.3: Generate Payouts
```bash
# Navigate to: http://localhost:3000/dashboard/payouts
# Look for "Generate Payouts" button, OR use API:

curl -X POST http://localhost:3000/api/admin/payouts/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

**✅ Check:**
- Response shows `created` count > 0
- Response shows `skipped` count (may be 0)
- Response includes `debug` array

#### Step 1.4: View Payouts
- Navigate to: `http://localhost:3000/dashboard/payouts`
- **✅ Check:** Payouts appear in table
- **✅ Check:** Status shows `PENDING` or `READY`
- **✅ Check:** Currency formatted correctly ($X.XX)

#### Step 1.5: Approve Payout
- Click "Approve" on a payout (or use API below)
- **✅ Check:** Status changes to `APPROVED`

```bash
# API alternative:
curl -X POST http://localhost:3000/api/admin/payouts/[PAYOUT_ID]/approve \
  -H "Content-Type: application/json"
```

#### Step 1.6: Execute Payout
- Click "Execute" or "Mark Paid" on approved payout
- **✅ Check:** Status changes to `SENT` or `PAID`
- **✅ Check:** Response shows `demoMode: true` (if in demo mode)

```bash
# API alternative:
curl -X POST http://localhost:3000/api/admin/payouts/[PAYOUT_ID]/execute \
  -H "Content-Type: application/json" \
  -d '{"executionMethod": "MANUAL", "note": "Test execution"}'
```

**✅ Section 1 Complete:** You can explain every number on screen.

---

### Section 2: Debug Confidence (5 min)

**Goal:** Verify the "Why was this skipped?" panel is visible and clear.

#### Step 2.1: View Debug Panel
- After generating payouts, scroll down on `/dashboard/payouts`
- **✅ Check:** Debug panel appears (yellow box with "Skipped Jobs — Debug Details")
- **✅ Check:** Panel shows count of skipped jobs

#### Step 2.2: Inspect Skip Reasons
- Expand debug panel
- **✅ Check:** Each skipped job shows:
  - Job ID
  - Job details (status, cleaner, amount)
  - Skip reasons (human-readable)
- **✅ Check:** Reasons are specific (not generic errors)

#### Step 2.3: Test Intentional Skip (Optional)
If you want to test skip scenarios:

1. **Create job without cleaner:**
   - Use admin tools to create a job
   - Don't assign a cleaner
   - Mark as completed
   - Generate payouts
   - **✅ Check:** Job appears in debug panel with "No cleaner assigned"

2. **Create cleaner without payment method:**
   - Create cleaner via admin
   - Don't add payment method
   - Assign to completed job
   - Generate payouts
   - **✅ Check:** Job appears in debug panel with "No payment method on file"

**✅ Section 2 Complete:** Non-technical people understand why jobs were skipped.

---

### Section 3: Demo Mode Lock (5 min)

**Goal:** Verify demo mode works flawlessly without touching real data.

#### Step 3.1: Verify Demo Banner
- Navigate to any admin page
- **✅ Check:** Yellow banner visible at top
- **✅ Check:** Banner says "DEMO MODE"

#### Step 3.2: Test Reset → Seed → Generate Cycle
1. **Reset:** Use dev tools or API to reset
2. **Seed:** Use dev tools or API to seed
3. **Generate:** Generate payouts
4. **✅ Check:** No errors in console
5. **✅ Check:** Can repeat cycle multiple times

#### Step 3.3: Verify Demo Mode in Responses
- Execute a payout
- **✅ Check:** Response includes `demoMode: true`
- **✅ Check:** Response message says "[DEMO MODE]"
- **✅ Check:** No real payment processed

**✅ Section 3 Complete:** You can demo repeatedly without fear.

---

### Section 4: UI Polish Pass (5 min)

**Goal:** Verify UI is clear and professional.

#### Step 4.1: Currency Formatting
- View payouts table
- **✅ Check:** All amounts show `$` symbol
- **✅ Check:** All amounts show 2 decimal places (e.g., `$123.45`)
- **✅ Check:** Large numbers use commas (e.g., `$1,234.56`)

#### Step 4.2: Status Colors
- View payouts with different statuses
- **✅ Check:** `PENDING` / `READY` → Yellow/Orange
- **✅ Check:** `APPROVED` → Blue
- **✅ Check:** `PAID` / `SENT` → Green
- **✅ Check:** `FAILED` / `REJECTED` → Red

#### Step 4.3: Empty States
- Reset demo data (no payouts)
- Navigate to `/dashboard/payouts`
- **✅ Check:** Friendly message appears (not blank page)
- **✅ Check:** Message suggests generating payouts

#### Step 4.4: Action Buttons
- View payouts table
- **✅ Check:** "Approve" only shows for `PENDING` payouts
- **✅ Check:** "Execute" only shows for `APPROVED` payouts
- **✅ Check:** Buttons disable after clicking (no double-execution)

**✅ Section 4 Complete:** Non-technical people understand the flow.

---

### Section 5: Narrative Prep (5 min)

**Goal:** Practice the sales pitch.

#### Step 5.1: Read the Pitch
> "VelocityMaid automatically calculates cleaner pay based on completed jobs, verified payment methods, and branch policies. If something can't be paid, the system explains exactly why—no guessing, no disputes."

#### Step 5.2: Practice the Demo Script
1. **Start:** Navigate to `/dashboard/payouts`
2. **Reset:** "Let me reset the demo data to show you a fresh state"
3. **Generate:** "Now I'll generate payouts for all completed jobs"
4. **Show Debug Panel:** "See this panel? It shows exactly why some jobs were skipped"
5. **Approve:** "I can review and approve payouts individually or in bulk"
6. **Execute:** "Once approved, I execute the payout—this updates the status and creates a ledger entry"
7. **End:** "And here's the final state—all payouts processed, all numbers accounted for"

**✅ Section 5 Complete:** Trust is built instantly.

---

### Section 6: Screen Recording (10 min)

**Goal:** Record a 5-7 minute walkthrough.

#### Step 6.1: Prepare Recording Tool
- Use: Loom, OBS, QuickTime, or any screen recorder
- Set resolution: 1080p or higher
- Test audio: Make sure microphone works

#### Step 6.2: Record the Walkthrough
Follow this sequence:

1. **Start:** Open `/dashboard/payouts`
   - Show empty state or existing payouts
   - Say: "This is the VelocityMaid payout dashboard"

2. **Reset:** Use dev tools to reset
   - Say: "Let me reset the demo data"

3. **Seed:** Seed demo data (optional)
   - Say: "I'll create some demo jobs"

4. **Generate:** Generate payouts
   - Say: "Now I'll generate payouts for all completed jobs"
   - Show results: "Created X payouts, skipped Y jobs"

5. **Show Debug Panel:** Scroll to debug panel
   - Say: "This panel shows exactly why jobs were skipped"
   - Expand panel and explain a skip reason

6. **Approve & Execute:** Approve and execute a payout
   - Say: "I can approve and execute payouts"
   - Show status changes

7. **End:** Show final state
   - Say: "All payouts processed, all numbers accounted for"

#### Step 6.3: Export and Save
- Export as MP4
- Save to: `velocitymaid-payout-demo.mp4`
- Upload to: Google Drive, Dropbox, or Loom

**✅ Section 6 Complete:** You don't need to be in the room.

---

### Section 7: Launch Guardrails (5 min)

**Goal:** Verify production safety measures.

#### Step 7.1: Verify Demo Mode in Production
```bash
# Check production environment variables (Vercel dashboard)
# Verify:
# - NEXT_PUBLIC_DEMO_MODE=false
# - DEMO_MODE=false
```

**✅ Check:** Demo mode is disabled in production.

#### Step 7.2: Test Demo Routes in Production
- Deploy to staging/production
- Try to access `/api/admin/demo/reset`
- **✅ Check:** Returns 403 (forbidden) or error

#### Step 7.3: Verify Logging
- Check server logs after executing payout
- **✅ Check:** Logs show payout ID, amount, status, timestamp
- **✅ Check:** Logs show user/admin who executed

**✅ Section 7 Complete:** You stay in control.

---

## ✅ Final Verification

### Quick Test Sequence (5 min)

Run through this sequence one final time:

1. ✅ Reset demo data
2. ✅ Seed demo jobs
3. ✅ Generate payouts
4. ✅ View debug panel
5. ✅ Approve a payout
6. ✅ Execute a payout
7. ✅ Verify status updates

**If all 7 steps work without errors, you're ready for launch! 🚀**

---

## 🎯 Common Issues & Solutions

### Issue: Demo banner not showing
**Solution:** 
- Check `.env.local` has `NEXT_PUBLIC_DEMO_MODE=true`
- Restart dev server
- Clear browser cache

### Issue: Reset API returns 403
**Solution:**
- Verify `DEMO_MODE=true` in `.env.local`
- Check you're authenticated as admin
- Try using dev tools UI instead

### Issue: No payouts generated
**Solution:**
- Check that jobs exist and are marked `COMPLETED`
- Check that cleaners are assigned to jobs
- Check that cleaners have payment methods (if required)
- Review debug panel for skip reasons

### Issue: Debug panel not showing
**Solution:**
- Verify payouts were generated (check response)
- Scroll down on payout page
- Check browser console for errors
- Verify `debug` array exists in generate response

---

## 📝 Checklist Sign-Off

**Date:** _______________

**Completed By:** _______________

**Sections Completed:**
- [ ] Section 1: Core System Verification
- [ ] Section 2: Debug Confidence
- [ ] Section 3: Demo Mode Lock
- [ ] Section 4: UI Polish Pass
- [ ] Section 5: Narrative Prep
- [ ] Section 6: Screen Recording
- [ ] Section 7: Launch Guardrails

**Final Status:** [ ] Ready for Launch | [ ] Needs Work

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## 🚀 Next Steps

After completing this checklist:

1. **Save your screen recording** for future demos
2. **Practice the pitch** 3 more times
3. **Move to Phase J:** Cleaner Onboarding Experience

**You're ready to demo, pitch, and onboard! 🎉**

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Version:** 1.0  
**Status:** Ready for Use











