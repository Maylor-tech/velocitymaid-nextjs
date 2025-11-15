# 🚀 How to Start the Dev Server

## Quick Start

```bash
npm run dev
```

**Wait for this message:**
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

Then open: http://localhost:3000

---

## ⚠️ Common Issues

### Issue 1: "ERR_CONNECTION_REFUSED"

**Problem:** Server is not running

**Solution:**
1. Open terminal in the project folder
2. Make sure you're in: `velocitymaid-nextjs/velocitymaid-nextjs`
3. Run: `npm run dev`
4. Wait 15-20 seconds
5. Look for "Ready" message

### Issue 2: Port 3000 Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Option 1: Use different port
npm run dev -- -p 3001
# Then go to: http://localhost:3001

# Option 2: Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Issue 3: Server Keeps Stopping

**Problem:** Server crashes or stops

**Solution:**
1. Check terminal for error messages
2. Make sure you're in the correct directory
3. Try: `npm install` first
4. Then: `npm run dev`

---

## 📋 Step-by-Step

1. **Open Terminal**
   - VS Code: Terminal → New Terminal
   - Or: PowerShell/Command Prompt

2. **Navigate to Project**
   ```bash
   cd "C:\Users\18023\OneDrive\Documents\velocitymaid-nextjs\velocitymaid-nextjs"
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

4. **Wait for Ready**
   - Look for: `✓ Ready in X seconds`
   - Should see: `○ Local: http://localhost:3000`

5. **Open Browser**
   - Go to: http://localhost:3000
   - Or: http://localhost:3000/test (test page)

---

## ✅ Success Indicators

**Terminal shows:**
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

**Browser shows:**
- Your VelocityMaid homepage
- Or the test page at `/test`

---

## 🆘 Still Not Working?

1. **Check Node.js version:**
   ```bash
   node --version
   # Should be 18.x or 20.x
   ```

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

3. **Check for errors in terminal**
   - Copy any error messages
   - Share them for help

---

**The server MUST be running for the site to work!** 🚀

