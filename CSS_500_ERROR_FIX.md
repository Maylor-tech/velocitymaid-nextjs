# 🔧 CSS 500 Error Fix Guide

**Issue:** CSS files returning 500 errors during dev server  
**Symptoms:** `GET http://localhost:3000/_next/static/css/app/layout... net::ERR_ABORTED 500`

---

## 🚨 Quick Fix Steps

### Step 1: Stop Dev Server
```powershell
# In the terminal running npm run dev
Ctrl + C
```

### Step 2: Clear Next.js Cache
```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

### Step 3: Restart Dev Server
```powershell
npm run dev
```

---

## 🔍 Why This Happens

CSS 500 errors usually occur when:
1. **Build cache is corrupted** - `.next` folder has stale files
2. **Dev server needs restart** - After code changes
3. **CSS import issues** - Missing or incorrect CSS imports

---

## ✅ Expected After Fix

- ✅ CSS files load successfully (200 status)
- ✅ No 500 errors in console
- ✅ Page styles render correctly
- ✅ Booking form displays properly

---

## 📝 Note on Confirmation Page Error

The error about `confirmation?session_id=test123` is **expected** when testing with a fake session ID. This is not a real error - it's the API correctly rejecting invalid session IDs.

---

**Last Updated:** December 28, 2024











