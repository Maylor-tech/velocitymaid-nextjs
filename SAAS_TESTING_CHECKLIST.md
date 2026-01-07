# SaaS Flow Testing Checklist

## ✅ Pre-Test Setup

- [ ] Ensure dev server is running: `npm run dev`
- [ ] Verify database connection is working
- [ ] Check that Stripe keys are set (even if using test mode)
- [ ] Ensure Prisma client is generated: `npx prisma generate`

## 🧪 API Endpoint Tests

### 1. Registration API (`/api/saas/register`)
- [ ] Test with valid data (name, email, companyName)
- [ ] Test with missing required fields (should return 400)
- [ ] Test with duplicate email (should return 409)
- [ ] Verify tenant is created in database
- [ ] Verify user is created with ADMIN role
- [ ] Verify Stripe customer is created
- [ ] Verify subscription record is created
- [ ] Verify session cookie is set

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/saas/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "test@example.com",
    "companyName": "Test Cleaning Co",
    "phone": "(555) 123-4567"
  }'
```

### 2. Login API (`/api/saas/login`)
- [ ] Test with valid email
- [ ] Test with invalid email (should return 401)
- [ ] Test with user without tenant (should return 403)
- [ ] Verify session cookie is set

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/saas/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 3. Get Current User (`/api/saas/me`)
- [ ] Test with valid session cookie
- [ ] Test without session (should return 401)
- [ ] Verify returns tenant and subscription data

**Test Command:**
```bash
curl http://localhost:3000/api/saas/me \
  -H "Cookie: saas_user_id=USER_ID_HERE"
```

### 4. Logout API (`/api/saas/logout`)
- [ ] Test logout clears session cookie
- [ ] Verify redirects to login

## 🌐 Page Route Tests

### 1. Landing Page (`/saas`)
- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] Features section shows all 3 features
- [ ] Pricing section shows 3 tiers
- [ ] "Sign Up" button links to `/saas/signup`
- [ ] Final CTA section displays

### 2. Signup Page (`/saas/signup`)
- [ ] Form displays correctly
- [ ] All fields are required
- [ ] Form validation works
- [ ] Submit creates account
- [ ] Success redirects to dashboard
- [ ] Error messages display correctly

### 3. Login Page (`/saas/login`)
- [ ] Form displays correctly
- [ ] Email validation works
- [ ] Submit authenticates user
- [ ] Success redirects to dashboard
- [ ] Error messages display correctly
- [ ] "Sign up" link works

### 4. Dashboard (`/saas/dashboard`)
- [ ] Requires authentication (redirects if not logged in)
- [ ] Displays tenant name
- [ ] Shows subscription status
- [ ] Shows trial/active badge correctly
- [ ] Feature cards display
- [ ] Logout button works
- [ ] "Manage Billing" button links correctly

### 5. Billing Page (`/saas/billing`)
- [ ] Requires authentication
- [ ] Shows current subscription status
- [ ] Displays all 3 pricing tiers
- [ ] "Subscribe" buttons work
- [ ] Redirects to Stripe Checkout
- [ ] Handles active subscription state

## 🔄 End-to-End Flow Test

### Complete User Journey:
1. [ ] Visit `/saas` landing page
2. [ ] Click "Sign Up" → goes to `/saas/signup`
3. [ ] Fill out signup form
4. [ ] Submit form → creates account → redirects to dashboard
5. [ ] Dashboard shows trial status
6. [ ] Click "Manage Billing" → goes to `/saas/billing`
7. [ ] Click "Subscribe" on a plan → redirects to Stripe
8. [ ] Logout → clears session
9. [ ] Visit `/saas/login`
10. [ ] Login with email → redirects to dashboard
11. [ ] Dashboard shows updated subscription status

## 🐛 Common Issues to Check

- [ ] Database connection errors
- [ ] Stripe API errors (check API keys)
- [ ] Session cookie not being set
- [ ] Redirect loops
- [ ] TypeScript compilation errors
- [ ] Missing environment variables
- [ ] Prisma client not generated

## 📝 Manual Testing Steps

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser and test:**
   - Navigate to `http://localhost:3000/saas`
   - Test signup flow
   - Test login flow
   - Test dashboard
   - Test billing page

3. **Check browser console:**
   - Look for JavaScript errors
   - Check network requests
   - Verify API responses

4. **Check server logs:**
   - Look for API errors
   - Check database queries
   - Verify Stripe API calls

## ✅ Success Criteria

- All API endpoints return correct status codes
- All pages load without errors
- User can complete full signup → login → dashboard flow
- Session management works correctly
- Stripe integration works (or fails gracefully if keys not set)
- Database operations succeed
- No TypeScript or runtime errors

