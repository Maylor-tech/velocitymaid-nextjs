# 🧪 Complete System Testing Checklist

**Date:** December 28, 2024  
**Purpose:** End-to-end testing of the booking and customer portal system

---

## ✅ **Pre-Testing Setup**

### **1. Environment Variables Verified**
- [ ] `.env.local` exists with all required variables
- [ ] `DATABASE_URL` is set (Supabase connection)
- [ ] `STRIPE_SECRET_KEY` is set (test key: `sk_test_...`)
- [ ] `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- [ ] `RESEND_API_KEY` is set
- [ ] Dev server restarted after env changes

### **2. Database Connection**
- [ ] Prisma can connect to database
- [ ] Run: `npx prisma db push` (if schema changed)
- [ ] Run: `npx prisma generate` (if schema changed)

### **3. Dev Server Running**
- [ ] `npm run dev` is running
- [ ] No build errors in terminal
- [ ] Server accessible at `http://localhost:3000`

---

## 🧪 **Test 1: Booking Flow (End-to-End)**

### **Step 1: Access Booking Page**
- [ ] Go to: `http://localhost:3000/book`
- [ ] Page loads without errors
- [ ] Booking form displays correctly
- [ ] Can select service type (Standard, Deep Clean, Move In/Out)
- [ ] Can select location (Miami, New Jersey, Vermont)

### **Step 2: Fill Booking Form**
- [ ] Select service type
- [ ] Select location (use Miami for testing)
- [ ] Enter home details (bedrooms, bathrooms, sqft)
- [ ] Select date and time
- [ ] Add extras (optional)
- [ ] Enter contact information (name, email, phone, address)
- [ ] Review step shows correct summary

### **Step 3: Checkout & Payment**
- [ ] Click "Continue to Payment" or "Book Now"
- [ ] Redirects to Stripe Checkout
- [ ] Stripe checkout page loads
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: `12/25` (any future date)
- [ ] CVC: `123` (any 3 digits)
- [ ] ZIP: `12345` (any 5 digits)
- [ ] Complete payment

### **Step 4: Confirmation & Job Creation**
- [ ] Redirected to `/book/confirmation?session_id=...`
- [ ] Shows "Processing Your Booking" (2-5 seconds)
- [ ] Shows "Booking Confirmed" success message
- [ ] Auto-redirects to `/customer/jobs` after 2 seconds
- [ ] **Check terminal:** Should see `POST /api/booking/create 200`
- [ ] **Check database:** Job should be created in `Job` table

### **Step 5: Customer Jobs Page**
- [ ] Lands on `/customer/jobs?status=received`
- [ ] Page loads without "Loading..." stuck state
- [ ] Job appears in "Upcoming" tab
- [ ] Job shows correct details:
  - [ ] Service type
  - [ ] Date and time
  - [ ] Address
  - [ ] Price
  - [ ] Status: "RECEIVED" or "PENDING"

---

## 🧪 **Test 2: Customer Authentication**

### **Step 1: Access Customer Portal**
- [ ] Go to: `http://localhost:3000/customer/jobs`
- [ ] Redirects to `/customer/login` (if not logged in)
- [ ] Login page displays correctly

### **Step 2: Login Process**
- [ ] Enter email address
- [ ] Click "Send Login Code"
- [ ] Code appears in terminal (dev mode) or email
- [ ] Enter 6-digit code
- [ ] Click "Verify Code"
- [ ] Redirects to `/customer/dashboard` or `/customer/jobs`

### **Step 3: Authenticated State**
- [ ] Customer header/navigation displays
- [ ] Can navigate between:
  - [ ] My Jobs
  - [ ] Profile
- [ ] Logout button works

---

## 🧪 **Test 3: Job Details Page**

### **Step 1: View Job Details**
- [ ] From `/customer/jobs`, click on a job
- [ ] Navigates to `/customer/jobs/[jobId]`
- [ ] Page loads without errors
- [ ] Job details display correctly:
  - [ ] Service type
  - [ ] Scheduled date/time
  - [ ] Address
  - [ ] Price
  - [ ] Status
  - [ ] Cleaner assignment (if assigned)

### **Step 2: Job Actions**
- [ ] Cancel button works (if status allows)
- [ ] Reschedule option works (if available)
- [ ] Back to jobs list works

---

## 🧪 **Test 4: Error Handling**

### **Test 4.1: Invalid Stripe Session**
- [ ] Go to: `http://localhost:3000/book/confirmation?session_id=invalid123`
- [ ] Should show error message
- [ ] Should have "Try Again" and "Go Home" buttons

### **Test 4.2: Missing Payment**
- [ ] Try to access `/book/confirmation` without `session_id`
- [ ] Should redirect to home page

### **Test 4.3: Database Error Handling**
- [ ] Stop database connection (if possible)
- [ ] Try to access `/customer/jobs`
- [ ] Should show error page or redirect gracefully

### **Test 4.4: Auth Timeout**
- [ ] If auth check takes > 10 seconds
- [ ] Should redirect to login (safety mechanism)

---

## 🧪 **Test 5: API Endpoints**

### **Test 5.1: Booking Create API**
```powershell
# Test with valid session_id (from Stripe test)
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/booking/create" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "session_id": "cs_test_..." }'
```
- [ ] Returns `{ success: true, jobId: "..." }`
- [ ] Job created in database
- [ ] Customer session cookie set

### **Test 5.2: Customer Jobs API**
```powershell
# Test customer jobs endpoint
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/customer/jobs?type=upcoming" `
  -Method GET
```
- [ ] Returns jobs array
- [ ] Requires authentication (if not logged in, should fail)

### **Test 5.3: Customer Me API**
```powershell
# Test customer info endpoint
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/customer/me" `
  -Method GET
```
- [ ] Returns `{ authenticated: true/false, customer: {...} }`

---

## 🧪 **Test 6: Redirects & Navigation**

### **Test 6.1: Legacy Booking Route**
- [ ] Go to: `http://localhost:3000/booking`
- [ ] Should redirect to `/book` (301 redirect)
- [ ] Query parameters preserved (e.g., `?branch=miami`)

### **Test 6.2: Internal Links**
- [ ] Homepage "Book Now" links to `/book`
- [ ] Customer dashboard "Book a new cleaning" links to `/book`
- [ ] All internal links use `/book` (not `/booking`)

---

## 🧪 **Test 7: Production Readiness**

### **Check 1: Build Success**
```powershell
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No missing dependencies

### **Check 2: Environment Variables in Vercel**
- [ ] `DATABASE_URL` set in Vercel
- [ ] `STRIPE_SECRET_KEY` set (live key: `sk_live_...`)
- [ ] `NEXT_PUBLIC_BASE_URL=https://velocitymaid.com`
- [ ] `RESEND_API_KEY` set
- [ ] `CRON_SECRET` set (if using cron jobs)

### **Check 3: Vercel Deployment**
- [ ] Latest commit deployed
- [ ] Build succeeded
- [ ] Production URL works: `https://velocitymaid.com/book`
- [ ] No 404 errors on main routes

---

## 📊 **Test Results Summary**

### **Passing Tests:**
- [ ] Booking flow end-to-end
- [ ] Customer authentication
- [ ] Job creation and display
- [ ] Error handling
- [ ] API endpoints
- [ ] Redirects

### **Issues Found:**
- [ ] Issue 1: ________________
- [ ] Issue 2: ________________
- [ ] Issue 3: ________________

### **Next Steps:**
- [ ] Fix any failing tests
- [ ] Re-test after fixes
- [ ] Deploy to production
- [ ] Test on production URL

---

## 🚨 **Critical Issues to Watch For**

1. **Infinite Loading States**
   - Customer jobs page stuck on "Loading..."
   - Confirmation page stuck on "Processing..."

2. **404 Errors**
   - `/book` route not found
   - `/book/confirmation` not found
   - Static assets 404 (normal in dev, but check production)

3. **Payment Issues**
   - Stripe checkout not redirecting
   - Jobs created without payment
   - Payment status not updating

4. **Database Issues**
   - Jobs not saving
   - Customer data not loading
   - Prisma connection errors

5. **Authentication Issues**
   - Can't log in
   - Session not persisting
   - Redirect loops

---

## ✅ **Success Criteria**

**System is ready when:**
- ✅ Complete booking flow works end-to-end
- ✅ Jobs are created in database after payment
- ✅ Customer can view their jobs
- ✅ No infinite loading states
- ✅ Error handling works gracefully
- ✅ Build succeeds without errors
- ✅ All critical routes accessible

---

**Last Updated:** December 28, 2024








