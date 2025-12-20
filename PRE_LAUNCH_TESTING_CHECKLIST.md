# 🧪 Pre-Launch Testing Checklist for Vercel

**Date:** Today  
**Status:** Ready for Final Testing

---

## ✅ **ALREADY TESTED**

- ✅ Booking form submission
- ✅ Stripe payment flow
- ✅ Success page display
- ✅ Stripe connection verified

---

## 🔴 **CRITICAL: Test Before Going Live**

### 1. **Complete Booking Flow** (5 min)
- [ ] **Homepage** → Click "Book Now" button
- [ ] **Booking Form** → Fill out all fields
- [ ] **Payment** → Use test card: `4242 4242 4242 4242`
- [ ] **Success Page** → Verify order ID displays
- [ ] **Review Link** → Click "Leave a Review" button
- [ ] **Return Home** → Click "Return to Home" button

**Expected:** Smooth flow from start to finish, no errors

---

### 2. **Mobile Responsiveness** (10 min)
Test on a real mobile device or browser dev tools:

- [ ] **Homepage** - All sections visible, buttons clickable
- [ ] **Booking Form** - Form fields work, keyboard appears correctly
- [ ] **Payment Flow** - Stripe checkout works on mobile
- [ ] **Success Page** - All content readable
- [ ] **Navigation** - Menu/links work on mobile
- [ ] **WhatsApp Button** - Floating button works

**Test on:**
- iPhone (Safari)
- Android (Chrome)
- iPad (if applicable)

---

### 3. **All Main Pages Load** (5 min)
Visit each page and verify it loads:

- [ ] `/` - Homepage
- [ ] `/booking` - Booking form
- [ ] `/locations/new-jersey` - NJ landing page
- [ ] `/review-us/new-jersey` - Review page
- [ ] `/booking/success` - Success page (after booking)
- [ ] `/booking/failed` - Failed payment page
- [ ] `/jamaica` - Jamaica page (if applicable)
- [ ] `/locations/port-antonio` - Port Antonio page (if applicable)

**Expected:** All pages load without errors, no 404s

---

### 4. **Links & Navigation** (5 min)
Test all clickable elements:

- [ ] **Phone Number** - `(973) 280-9190` - Opens phone dialer
- [ ] **Email** - `hello@velocitymaid.com` - Opens email client
- [ ] **WhatsApp Button** - Opens WhatsApp chat
- [ ] **"Book Now" Buttons** - All link to `/booking`
- [ ] **Navigation Links** - All work correctly
- [ ] **Footer Links** - All work correctly
- [ ] **Social Media Links** - If any, verify they work

---

### 5. **Error Handling** (5 min)
Test error scenarios:

- [ ] **Invalid Form Submission** - Shows error messages
- [ ] **Payment Cancellation** - Redirects to `/booking/failed`
- [ ] **404 Page** - Visit `/nonexistent-page` - Shows custom 404
- [ ] **Network Error** - Test with slow connection (dev tools)

---

### 6. **Vercel Environment Variables** (2 min)
**CRITICAL:** Verify in Vercel Dashboard:

- [ ] Go to: Vercel → Your Project → Settings → Environment Variables
- [ ] Verify `STRIPE_SECRET_KEY` is set (use `sk_live_...` for production)
- [ ] Verify `NEXT_PUBLIC_BASE_URL` = `https://velocitymaid.com`
- [ ] Verify `DATABASE_URL` is set
- [ ] Verify `NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL` is set (even if placeholder)

**Important:** After adding/changing env vars, **redeploy** your site!

---

### 7. **Production Build Test** (3 min)
Before deploying, test the production build locally:

```bash
npm run build
npm run start
```

Then test:
- [ ] Homepage loads
- [ ] Booking form works
- [ ] No console errors

---

## 🟡 **IMPORTANT: Test After Deploying**

### 8. **Live Site Testing** (10 min)
Once deployed to Vercel, test on the live URL:

- [ ] **Homepage** - `https://velocitymaid.com` loads
- [ ] **Booking Flow** - Complete test booking on live site
- [ ] **Stripe Checkout** - Use test card on live site
- [ ] **Success Page** - Verify it works on live site
- [ ] **Mobile** - Test on real mobile device with live URL
- [ ] **Speed** - Check page load times (should be fast)

---

### 9. **Stripe Webhook** (If Configured)
If you have Stripe webhooks set up:

- [ ] Make a test booking
- [ ] Check Stripe Dashboard → Webhooks → See if event received
- [ ] Check Vercel logs for webhook processing
- [ ] Verify booking appears in your system

---

### 10. **Database Connection** (If Using)
If using Supabase/Prisma:

- [ ] Test booking creates record in database
- [ ] Check Vercel logs for database connection errors
- [ ] Verify data persists correctly

---

## 🟢 **NICE TO HAVE: Quick Checks**

### 11. **SEO Basics** (2 min)
- [ ] Page titles are correct (check browser tab)
- [ ] Meta descriptions show in search previews
- [ ] Images have alt text
- [ ] URLs are clean (no `/undefined` or errors)

---

### 12. **Analytics** (If Configured)
- [ ] Google Analytics tracking works
- [ ] Events fire correctly (check GA dashboard)
- [ ] Page views tracked

---

### 13. **Cross-Browser Testing** (5 min)
Test in different browsers:

- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

**Expected:** Site works in all major browsers

---

## 📋 **QUICK TEST SCRIPT**

Run through this in 5 minutes:

```
1. Visit homepage → Click "Book Now"
2. Fill booking form → Submit
3. Use test card: 4242 4242 4242 4242
4. Complete payment → Verify success page
5. Click "Leave a Review" → Verify review page loads
6. Test on mobile device
7. Check Vercel environment variables
```

---

## 🚨 **RED FLAGS: Don't Launch If**

- ❌ Booking form doesn't submit
- ❌ Stripe checkout doesn't work
- ❌ Success page shows errors
- ❌ Mobile site is broken
- ❌ Environment variables not set in Vercel
- ❌ Database connection fails
- ❌ Critical pages return 404

---

## ✅ **GREEN LIGHTS: Ready to Launch If**

- ✅ Booking flow works end-to-end
- ✅ Payment processes successfully
- ✅ Success page displays correctly
- ✅ Mobile site works
- ✅ All environment variables set
- ✅ No critical errors in console
- ✅ Pages load quickly

---

## 🎯 **PRIORITY ORDER**

### **MUST TEST (Before Launch):**
1. Complete booking flow (5 min)
2. Mobile responsiveness (10 min)
3. Vercel environment variables (2 min)
4. Production build test (3 min)

**Total Time:** ~20 minutes

### **SHOULD TEST (After Launch):**
5. Live site testing (10 min)
6. Cross-browser testing (5 min)
7. Error handling (5 min)

**Total Time:** ~20 minutes

### **NICE TO HAVE:**
8. SEO checks (2 min)
9. Analytics verification (2 min)

---

## 📝 **TESTING NOTES**

**Document any issues you find:**
- Page URL:
- Issue description:
- Steps to reproduce:
- Browser/Device:
- Screenshot (if possible):

---

## 🚀 **FINAL CHECKLIST**

Before going live, confirm:

- [ ] All critical tests passed
- [ ] Vercel environment variables set
- [ ] Production build successful
- [ ] Mobile site works
- [ ] No critical errors
- [ ] Ready to accept real bookings

---

## 🆘 **IF YOU FIND ISSUES**

1. **Document the issue** (what, where, when)
2. **Check Vercel logs** for errors
3. **Check browser console** for JavaScript errors
4. **Test in different browser** to isolate issue
5. **Fix and retest** before going live

---

**Last Updated:** Today  
**Next Step:** Complete critical tests, then deploy to Vercel! 🚀


