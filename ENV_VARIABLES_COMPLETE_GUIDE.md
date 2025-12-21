# 🔑 Complete Environment Variables Guide

**This is the DEFINITIVE list of all environment variables needed for your system to work.**

---

## 📋 **REQUIRED Variables (Core System)**

### **1. Database (Prisma/Supabase)**
```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```
**Where to get:**
- Supabase Dashboard → Project Settings → Database → Connection String
- Use "Connection Pooling" URL for production

**Local:** Use your Supabase connection string  
**Vercel:** Same connection string (add in Vercel dashboard)

---

### **2. Stripe (Payment Processing)**
```env
STRIPE_SECRET_KEY=sk_test_... (local) or sk_live_... (production)
```
**Where to get:**
- Test: https://dashboard.stripe.com/test/apikeys
- Live: https://dashboard.stripe.com (toggle to Live mode)

**Local:** `sk_test_...` (test key)  
**Vercel:** `sk_live_...` (live key for production)

---

### **3. Base URL (Redirects & Links)**
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000 (local) or https://velocitymaid.com (production)
```
**Purpose:**
- Used for Stripe redirect URLs
- Used for email links
- Used for referral tracking

**Local:** `http://localhost:3000`  
**Vercel:** `https://velocitymaid.com`

---

### **4. Email (Resend)**
```env
RESEND_API_KEY=re_... (your Resend API key)
```
**Where to get:**
- https://resend.com/api-keys
- Create API key in Resend dashboard

**Local:** Your Resend API key  
**Vercel:** Same key (add in Vercel dashboard)

**Purpose:**
- Booking confirmations
- Admin notifications
- Estimate emails

---

## 🔒 **OPTIONAL Variables (Advanced Features)**

### **5. Cron Jobs Security**
```env
CRON_SECRET=your-random-secret-string-here
```
**Purpose:**
- Protects cron endpoints from unauthorized access
- Generate a random string (e.g., `openssl rand -hex 32`)

**Local:** Optional (can skip for dev)  
**Vercel:** **REQUIRED** if using cron jobs

---

### **6. WhatsApp Integration (Optional)**
```env
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```
**Where to get:**
- Meta Business Suite → WhatsApp API

**Local:** Optional  
**Vercel:** Optional (only if using WhatsApp notifications)

---

### **7. Zapier Webhook (Optional)**
```env
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
```
**Where to get:**
- Zapier → Create Webhook → Copy URL

**Local:** Optional  
**Vercel:** Optional (only if using Zapier automation)

---

### **8. Supabase (If using Supabase Auth)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
**Where to get:**
- Supabase Dashboard → Project Settings → API

**Local:** Only if using Supabase auth  
**Vercel:** Only if using Supabase auth

---

## 📝 **COMPLETE .env.local (Local Development)**

Create this file in your project root (`velocitymaid-nextjs/.env.local`):

```env
# ============================================
# REQUIRED - Core System
# ============================================

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres?sslmode=require

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_[YOUR-STRIPE-SECRET-KEY-HERE]

# Base URL (Local Development)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# ============================================
# OPTIONAL - Advanced Features
# ============================================

# Cron Jobs Security (Optional for local)
# CRON_SECRET=your-random-secret-here

# WhatsApp (Optional)
# WHATSAPP_TOKEN=your-token
# WHATSAPP_PHONE_NUMBER_ID=your-id

# Zapier (Optional)
# ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/...

# Supabase Auth (Only if using Supabase auth)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🚀 **COMPLETE Vercel Environment Variables**

Add these in **Vercel Dashboard → Your Project → Settings → Environment Variables**:

### **Production Environment:**
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key_here
NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
RESEND_API_KEY=re_your_resend_api_key_here
CRON_SECRET=your-random-secret-string-here
NODE_ENV=production
```

### **Preview Environment (Same as Production):**
- Use same values as Production
- Or use test keys if you want to test preview deployments

### **Development Environment (Optional):**
- Can use test keys
- Same as local `.env.local`

---

## ✅ **MINIMUM Required for System to Work**

**Absolute minimum (core booking flow):**
1. ✅ `DATABASE_URL` - Database connection
2. ✅ `STRIPE_SECRET_KEY` - Payment processing
3. ✅ `NEXT_PUBLIC_BASE_URL` - Redirect URLs
4. ✅ `RESEND_API_KEY` - Email confirmations

**Everything else is optional.**

---

## 🔍 **How to Verify Your Setup**

### **Local:**
1. Check `.env.local` exists in project root
2. Restart dev server: `npm run dev`
3. Test booking flow: http://localhost:3000/book
4. Check terminal for errors about missing env vars

### **Vercel:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all required variables are set
3. Check "Environment" scope (Production, Preview, Development)
4. Redeploy after adding variables

---

## 🚨 **Common Mistakes**

### ❌ **Wrong:**
```env
STRIPE_SECRET_KEY="sk_test_..."  # Don't use quotes
STRIPE_SECRET_KEY = sk_test_...  # Don't use spaces around =
```

### ✅ **Correct:**
```env
STRIPE_SECRET_KEY=sk_test_...  # No quotes, no spaces
```

### ❌ **Wrong:**
- Using `pk_test_...` (publishable key) instead of `sk_test_...` (secret key)
- Using test keys in production
- Missing `NEXT_PUBLIC_` prefix for client-side variables

### ✅ **Correct:**
- Use `sk_test_...` for local, `sk_live_...` for production
- All `NEXT_PUBLIC_*` variables are exposed to browser (safe for public values only)

---

## 📋 **Quick Checklist**

### **Local (.env.local):**
- [ ] `DATABASE_URL` set
- [ ] `STRIPE_SECRET_KEY` set (test key)
- [ ] `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- [ ] `RESEND_API_KEY` set
- [ ] File saved in project root
- [ ] Dev server restarted

### **Vercel (Environment Variables):**
- [ ] `DATABASE_URL` set (Production, Preview)
- [ ] `STRIPE_SECRET_KEY` set (live key for Production)
- [ ] `NEXT_PUBLIC_BASE_URL=https://velocitymaid.com`
- [ ] `RESEND_API_KEY` set
- [ ] `CRON_SECRET` set (if using cron jobs)
- [ ] All scoped correctly (Production/Preview/Development)
- [ ] Redeployed after adding variables

---

**Last Updated:** December 28, 2024

