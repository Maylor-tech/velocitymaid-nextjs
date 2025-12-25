# ✅ Test Bookings — Step-by-Step Guide

**Goal:** Test the full booking flow from start to finish  
**Time:** About 15-20 minutes total  
**What You'll Need:** Your browser, admin access, and a test cleaner account

---

## 🎯 Test Booking #1 — Standard Service (Payment Ready)

### PART A: Book as a Customer (5 minutes)

#### Step 1: Open a New Private/Incognito Window
1. **In your browser**, press `Ctrl + Shift + N` (Windows) or `Cmd + Shift + N` (Mac)
   - This opens a private window (so you're not logged in as admin)
   - You'll see a dark/private window indicator

#### Step 2: Go to Your Booking Page
1. **In the address bar** (top of browser), type: `http://localhost:3000/booking`
2. **Press Enter**
3. **What you should see:** A booking form with fields like:
   - Service type dropdown
   - Date picker
   - Time selection
   - Address fields

#### Step 3: Fill Out the Booking Form
1. **Select Service Type:**
   - Click the dropdown that says "Service Type" or similar
   - Choose "Standard Cleaning" or "Standard Service"

2. **Select Location/Branch:**
   - Look for a location or branch selector
   - Choose "Miami" (or select Miami ZIP code if it asks for that)

3. **Choose Date:**
   - Click the date field
   - Pick **tomorrow's date** (not today)
   - This gives you time to test assignment

4. **Choose Time:**
   - Click the time dropdown
   - Pick any time (e.g., "Morning" or "9:00 AM")

5. **Enter Address:**
   - Type a test address like: `123 Test Street, Miami, FL 33101`

6. **Enter Customer Info:**
   - Name: `Test Customer 1`
   - Email: `test1@example.com`
   - Phone: `305-555-0101`

#### Step 4: Complete Checkout
1. **Click the "Book" or "Continue" button** (usually at bottom of form)
2. **If it asks for payment:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

3. **Click "Pay" or "Complete Booking"**

#### Step 5: Verify Confirmation
**What you should see:**
- ✅ A success/confirmation page saying "Booking Confirmed" or similar
- ✅ A booking reference number or ID
- ✅ Details of what you booked

**Write down the booking/order number** (you'll need it later)

**Check your email:**
- Look for a confirmation email (check spam folder too)
- It should have booking details

**✅ If you see the confirmation page → Part A is DONE!**

---

### PART B: Assign & Complete as Cleaner (5 minutes)

#### Step 6: Log in as Branch Owner
1. **Open a NEW browser tab** (keep the confirmation page open)
2. **Go to:** `http://localhost:3000/branch-owner/dashboard` or `/branch-owner/login`
3. **Log in** with your branch owner credentials
4. **What you should see:** A dashboard showing jobs/tasks

#### Step 7: Find the New Booking
1. **Look for a section** that says:
   - "Jobs Today" or "Pending Assignments" or "New Bookings"
2. **Find the booking** you just created:
   - Look for "Test Customer 1" or the address "123 Test Street"
   - It should show status: "PENDING" or "UNASSIGNED"

#### Step 8: Assign to a Cleaner
1. **Click on the job/booking** to open details
2. **Look for a button** that says:
   - "Assign Cleaner" or "Assign" or "Assign to Cleaner"
3. **Click it**
4. **A list of cleaners appears:**
   - **IMPORTANT:** Choose a cleaner who HAS a verified payment method
   - (You'll know because they won't have a "No Payment Method" badge)
5. **Click the cleaner's name** to assign
6. **Confirm the assignment** if it asks

**✅ If the job now shows "ASSIGNED" → Good!**

#### Step 9: Log in as the Cleaner
1. **Open another NEW browser tab**
2. **Go to:** `http://localhost:3000/cleaners/login`
3. **Log in** with the cleaner's credentials (the one you just assigned)
4. **What you should see:** Cleaner dashboard with jobs

#### Step 10: Find and Complete the Job
1. **On the cleaner dashboard**, look for:
   - "Today's Jobs" or "My Jobs" tab
2. **Find the job** you assigned:
   - Should show "Test Customer 1" or "123 Test Street"
3. **Click on the job** to see details
4. **Look for a button** that says:
   - "Mark Complete" or "Complete Job" or "Finish"
5. **Click it**
6. **Confirm** if it asks

**✅ If the job status changes to "COMPLETED" → Part B is DONE!**

---

### PART C: Check Payout State (3 minutes)

#### Step 11: Log in as Admin
1. **Open another NEW browser tab**
2. **Go to:** `http://localhost:3000/admin` or `/admin/dashboard`
3. **Log in** with admin credentials

#### Step 12: View Payouts
1. **Look for a menu item** that says:
   - "Payouts" or "Pilot Payouts" or "Miami Payouts"
2. **Click it**
3. **You should see:**
   - A list of payouts or a payout summary
   - Or a button to "View Payouts" or "Check Payout Status"

#### Step 13: Verify the Job is Included
1. **Look for the completed job** in the payout list:
   - Should show the cleaner's name
   - Should show the job amount
   - Status should be "READY" or "PENDING" (not "HELD" or "FAILED")

**✅ If you see the job in payouts with a normal status → Test #1 PASSED!**

---

## 🎯 Test Booking #2 — Add-On Service (Payment Missing)

### PART A: Book with Add-On (5 minutes)

#### Step 14: Book Another Service
1. **Go back to your private/incognito window** (or open a new one)
2. **Go to:** `http://localhost:3000/booking`
3. **Fill out the form again:**
   - Service: "Deep Cleaning" or "Deep Clean"
   - **IMPORTANT:** Look for an "Add-Ons" section
   - **Check the box** for "Organizing" or "Add-On Service"
   - Location: Miami
   - Date: Tomorrow
   - Address: `456 Test Avenue, Miami, FL 33101`
   - Name: `Test Customer 2`
   - Email: `test2@example.com`

4. **Check the total price:**
   - Should be higher than standard cleaning
   - Should show: Base price + Add-on price = Total

5. **Complete checkout** (same test card: `4242 4242 4242 4242`)

**✅ If you see confirmation with the add-on included → Good!**

---

### PART B: Assign to Cleaner WITHOUT Payment (5 minutes)

#### Step 15: Assign to Different Cleaner
1. **Go back to Branch Owner dashboard** (the tab from Step 6)
2. **Refresh the page** (press F5)
3. **Find the new booking** (Test Customer 2)
4. **Assign it to a DIFFERENT cleaner:**
   - **IMPORTANT:** Choose a cleaner who does NOT have a payment method
   - (You'll see a "No Payment Method" badge or warning)

#### Step 16: Complete as That Cleaner
1. **Log in as that cleaner** (the one without payment method)
2. **Find the job** on their dashboard
3. **Complete it** (same as Step 10)

#### Step 17: Check Cleaner Dashboard
1. **After completing**, look at the cleaner's dashboard
2. **You should see:**
   - A **yellow banner** at the top saying "Payment Method Required"
   - Text about payouts being ready but needing payment method
   - A button "Add Payment Method"

**✅ If you see the yellow payment banner → Good!**

---

### PART C: Check Payout is Held (3 minutes)

#### Step 18: Check Payout Status
1. **Go back to Admin dashboard** (Step 11)
2. **Go to Payouts section** (Step 12)
3. **Find the job** for the cleaner without payment method
4. **Check the status:**
   - Should say "HELD" or "PENDING VERIFICATION"
   - Should NOT say "FAILED" or "ERROR"
   - Should have a reason like "Payment method missing"

**✅ If payout shows HELD (not failed) → Good!**

---

### PART D: Release Test (Optional - 5 minutes)

#### Step 19: Add Payment Method as Cleaner
1. **Go back to the cleaner's dashboard** (the one without payment)
2. **Click the "Add Payment Method" button** in the yellow banner
3. **Fill out the payment form:**
   - Choose payment type (e.g., "Bank Transfer")
   - Enter test details:
     - Bank Name: `Test Bank`
     - Account Number: `123456789`
     - Routing Number: `987654321`
4. **Click "Save" or "Submit"**

#### Step 20: Verify as Admin
1. **Go to Admin dashboard**
2. **Find the payment method** you just added
3. **Look for a "Verify" button** or similar
4. **Click it** to verify the payment method

#### Step 21: Check Payout Again
1. **Go back to Payouts section**
2. **Refresh the page** (F5)
3. **Find the same job** (the one that was HELD)
4. **Check status:**
   - Should now say "READY" or "ELIGIBLE"
   - Should NOT say "HELD" anymore

**✅ If payout status changed from HELD to READY → Test #2 PASSED!**

---

## 🚨 Red Flags - STOP IF YOU SEE THESE

If any of these happen, **STOP and tell me which step**:

1. ❌ **Manual database edits needed**
   - If you have to manually edit the database to fix something

2. ❌ **Pricing changes after booking**
   - If the price changes after you complete checkout

3. ❌ **Missing confirmation messages**
   - No confirmation page appears
   - No email/SMS sent

4. ❌ **Payout requires rerunning**
   - If you have to manually trigger payout again

5. ❌ **Confusing status language**
   - Error messages that don't make sense
   - Status shows "ERROR" or "FAILED" when it should work

---

## 📝 What to Report Back

After completing both tests, tell me:

1. ✅ **Test #1:** Did it pass? (Yes/No)
   - Any issues?

2. ✅ **Test #2:** Did it pass? (Yes/No)
   - Any issues?

3. 🚨 **Red Flags:** Did you see any? (List which ones)

4. 💡 **Questions:** Anything confusing or unclear?

---

## 🆘 Need Help?

If you get stuck at any step:
1. **Tell me which step number** (e.g., "Step 7")
2. **Tell me what you see** on your screen
3. **Tell me what you expected** to see
4. I'll guide you through it!

---

**Ready to start? Begin with Step 1!** 🚀












