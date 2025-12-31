# Demo Quick Reference Guide

## ✅ Correct Demo Flow

### Cleaner Session (Use Incognito/Private Window)

1. **Login First**
   ```
   http://localhost:3000/cleaners/login
   ```
   - Enter cleaner email (e.g., `cleaner@test.com`)
   - Click "Login"
   - Sets `cleanerId` cookie automatically
   - Redirects to `/cleaner/compliance`

2. **View Compliance Checklist**
   ```
   http://localhost:3000/cleaner/compliance
   ```
   - Should show compliance checklist
   - W-9 section marked "NOT STARTED"
   - Overall status: "ACTION REQUIRED"

3. **Submit W-9 Form**
   ```
   http://localhost:3000/cleaner/tax-form
   ```
   - Fill out all required fields
   - Save draft (optional)
   - Submit final W-9
   - Status changes to "SUBMITTED"

4. **Return to Compliance**
   ```
   http://localhost:3000/cleaner/compliance
   ```
   - W-9 status: "SUBMITTED"
   - Overall status: "UNDER REVIEW"
   - No full TIN shown (only last 4 digits)

### Admin Session (Use Normal Window)

1. **Login as Admin**
   ```
   http://localhost:3000/admin/login
   ```
   - Use admin credentials
   - Sets `admin_session` cookie

2. **View 1099 Dashboard**
   ```
   http://localhost:3000/admin/taxes/1099?year=2025
   ```
   - Should load without errors
   - Shows readiness score
   - Shows countdown (if January)
   - Lists candidates table

3. **Verify W-9**
   - Find cleaner in candidates table
   - Click "Verify" button
   - Status updates to "VERIFIED"

4. **View Analytics**
   ```
   http://localhost:3000/admin/taxes/1099/analytics
   ```
   - Should load without database errors
   - Shows year-over-year trends
   - Download buttons available

5. **Download Investor PDF**
   - Click "Download Investor Summary (PDF)"
   - PDF should open/download
   - No sensitive data

6. **Download Data Room ZIP**
   - Click "Download Compliance Data Room (ZIP)"
   - ZIP should download
   - Extract and verify contents
   - Check MANIFEST.json and MANIFEST.sig

## 🔐 Authentication Routes

### Cleaner Login
- **Page:** `/cleaners/login` (note: plural "cleaners")
- **API:** `POST /api/cleaners/login`
- **Body:** `{ "identifier": "cleaner@test.com" }`
- **Cookie Set:** `cleanerId` (HTTP-only, 7 days)

### Admin Login
- **Page:** `/admin/login`
- **Cookie Set:** `admin_session` (value: "true")

## 🚨 Common Issues & Fixes

### Issue: "Unauthorized: Cleaner authentication required"
**Fix:** Log in at `/cleaners/login` first

### Issue: Database error "Tenant or user not found"
**Fix:** Check `.env.local` has correct `DATABASE_URL` and `DIRECT_URL`

### Issue: Analytics page stuck loading
**Fix:** 
- Check database connection
- Verify `TaxYearArchive` table exists
- Check browser console for errors

### Issue: Can't access cleaner routes
**Fix:** 
- Use separate browser session (Incognito)
- Don't mix admin and cleaner sessions
- Clear cookies and log in again

## 📝 Test Credentials

### Cleaner
- Email: `cleaner@test.com` (or any cleaner email in database)
- Phone: `+19735556677` (if using mock data)

### Admin
- Email: `maylortech007@gmail.com` (from requireRole.ts)
- Or any user with `role: ADMIN` in database

## ✅ Success Checklist

- [ ] Cleaner can log in at `/cleaners/login`
- [ ] Cleaner can access `/cleaner/compliance` after login
- [ ] Cleaner can access `/cleaner/tax-form` after login
- [ ] Admin can log in at `/admin/login`
- [ ] Admin can access `/admin/taxes/1099` without errors
- [ ] Admin can access `/admin/taxes/1099/analytics` without database errors
- [ ] PDFs download successfully
- [ ] ZIP downloads successfully
- [ ] No sensitive data exposed
- [ ] Authentication works correctly (routes protected)

## 🎯 Demo Script Order

1. **Cleaner Login** → `/cleaners/login`
2. **Compliance Checklist** → `/cleaner/compliance`
3. **W-9 Form** → `/cleaner/tax-form`
4. **Submit W-9** → Fill form and submit
5. **Switch to Admin** → `/admin/login`
6. **1099 Dashboard** → `/admin/taxes/1099?year=2025`
7. **Verify W-9** → Click verify on cleaner
8. **Analytics** → `/admin/taxes/1099/analytics`
9. **Download PDF** → Click investor summary
10. **Download ZIP** → Click data room export

## 🔒 Security Notes

- ✅ Authentication is working correctly
- ✅ Routes are properly protected
- ✅ Admin and Cleaner sessions are separate
- ✅ No data leakage between roles
- ✅ This is the expected behavior

**DO NOT:**
- Disable authentication
- Bypass middleware
- Weaken security for demo
- Mix admin/cleaner sessions

The system is doing the right thing by requiring authentication!


