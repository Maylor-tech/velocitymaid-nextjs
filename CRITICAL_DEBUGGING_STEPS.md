# 🔬 Critical Debugging Steps - For Claude

**These are the exact steps needed to diagnose the empty response issue:**

---

## 🎯 **Step 1: Verify API Route is Being Called**

### **Add This Log at the Very Start:**
```typescript
export async function POST(req: NextRequest) {
  console.log("[BOOKING CREATE] ====== ROUTE HIT ======");
  console.log("[BOOKING CREATE] Method:", req.method);
  console.log("[BOOKING CREATE] URL:", req.url);
  console.log("[BOOKING CREATE] Headers:", Object.fromEntries(req.headers.entries()));
  
  try {
    // ... rest of code
```

**Check:** Do you see "ROUTE HIT" in logs? If NO → route isn't being called at all.

---

## 🎯 **Step 2: Check Request Body Before Parsing**

### **Add This Before `req.json()`:**
```typescript
// Clone request to inspect body without consuming it
const clonedReq = req.clone();
const bodyText = await clonedReq.text();
console.log("[BOOKING CREATE] Raw body:", bodyText);
console.log("[BOOKING CREATE] Body length:", bodyText.length);

// Now try to parse
const body = await req.json();
```

**Check:** What does "Raw body" show? Empty string? Invalid JSON? Nothing?

---

## 🎯 **Step 3: Verify Response is Actually Being Sent**

### **Add This Before Every Return:**
```typescript
const response = NextResponse.json({ success: true, jobId: "..." });
console.log("[BOOKING CREATE] Response status:", response.status);
console.log("[BOOKING CREATE] Response headers:", Object.fromEntries(response.headers.entries()));
console.log("[BOOKING CREATE] Response body:", await response.clone().json());
return response;
```

**Check:** Is the response being created? What's in it?

---

## 🎯 **Step 4: Check for Unhandled Promise Rejections**

### **Add This at the Top of the File:**
```typescript
process.on('unhandledRejection', (reason, promise) => {
  console.error('[BOOKING CREATE] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[BOOKING CREATE] Uncaught Exception:', error);
});
```

**Check:** Are there unhandled errors killing the request?

---

## 🎯 **Step 5: Test with Minimal Route**

### **Create a Test Route:**
```typescript
// app/api/booking/test/route.ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({ success: true, received: body });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**Test:** Does this simple route work? If YES → issue is in complex logic. If NO → issue is with request body parsing.

---

## 🎯 **Step 6: Check Vercel Function Logs**

### **In Vercel Dashboard:**
1. Go to: Deployments → Latest → Functions
2. Click on `/api/booking/create`
3. Check "Logs" tab
4. Look for errors or timeouts

**Check:** Are there errors in Vercel logs that aren't in local logs?

---

## 🎯 **Step 7: Verify Environment Variables**

### **Add This Check:**
```typescript
console.log("[BOOKING CREATE] Env check:");
console.log("  - STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "SET" : "MISSING");
console.log("  - DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "MISSING");
console.log("  - NODE_ENV:", process.env.NODE_ENV);
```

**Check:** Are all required env vars set in production?

---

## 🎯 **Step 8: Check for Timeout Issues**

### **Add Timeout Handling:**
```typescript
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 seconds
});

try {
  await Promise.race([
    // Your actual logic
    timeoutPromise
  ]);
} catch (err) {
  if (err.message === 'Request timeout') {
    return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
  }
}
```

**Check:** Is the request timing out before it can respond?

---

## 🎯 **Step 9: Verify Next.js Version Compatibility**

### **Check package.json:**
```json
{
  "dependencies": {
    "next": "14.x.x"
  }
}
```

**Known Issue:** Next.js 14 has some quirks with request body parsing in API routes.

---

## 🎯 **Step 10: Test with curl/Postman**

### **Bypass Frontend Entirely:**
```bash
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -d '{"session_id":"cs_test_123"}'
```

**Check:** Does the API work when called directly? If YES → issue is in frontend fetch. If NO → issue is in API route.

---

## 🎯 **Most Likely Root Causes (Ranked)**

1. **API route throwing error before response** (90% likely)
   - Unhandled exception
   - Database connection failure
   - Stripe API failure

2. **Request body not reaching API** (5% likely)
   - Middleware consuming it
   - CORS issue
   - Network issue

3. **Response being sent but not received** (3% likely)
   - Network timeout
   - CORS blocking response
   - Browser blocking response

4. **Production code mismatch** (2% likely)
   - Old code deployed
   - Build cache issue
   - Environment mismatch

---

**Use these steps to systematically eliminate possibilities.**










