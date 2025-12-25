# 🔧 Fix CSS 500 Errors - Quick Guide

**Issue:** CSS files returning `500 (Internal Server Error)`  
**Solution:** Clear Next.js cache and restart dev server

---

## ✅ Step-by-Step Fix

### Step 1: Stop Dev Server
1. Go to the terminal where `npm run dev` is running
2. Press `Ctrl + C` to stop it
3. Wait until it says "Terminated" or the prompt returns

### Step 2: Clear Next.js Cache
```powershell
# Delete the .next folder (this clears the build cache)
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

### Step 3: Restart Dev Server
```powershell
npm run dev
```

### Step 4: Wait for Server to Start
- Wait for "Ready" message
- Should see: `✓ Ready in X seconds`

### Step 5: Refresh Browser
1. Go to: `http://localhost:3000/book`
2. Press `Ctrl + Shift + R` (hard refresh) to clear browser cache
3. Check console - CSS errors should be gone

---

## ✅ Expected Result

After fix:
- ✅ CSS files load successfully (200 status, not 500)
- ✅ No CSS errors in console
- ✅ Page styles render correctly
- ✅ Booking form displays properly

---

## 📝 Note on Other Errors

**Confirmation Page Error (`test123`):**
- This is **expected** when testing with a fake session ID
- The API correctly rejects invalid session IDs
- This is not a real error - it's working as designed

**Fast Refresh Messages:**
- These are normal during development
- They indicate hot-reloading is working

---

## 🚨 If Errors Persist

If CSS errors continue after clearing cache:

1. **Check if globals.css exists:**
   ```powershell
   Test-Path app/globals.css
   ```
   Should return `True`

2. **Verify file permissions:**
   - Make sure you can read `app/globals.css`
   - Check file isn't locked by another process

3. **Try full clean:**
   ```powershell
   # Stop server
   # Delete cache
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   # Delete node_modules (optional, takes longer)
   # Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   # npm install
   npm run dev
   ```

---

**Last Updated:** December 28, 2024










