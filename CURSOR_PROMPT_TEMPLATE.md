# 🎯 VelocityMaid Cursor Prompt Template

**Use this template when working on VelocityMaid Next.js platform**

---

## 🔥 **MASTER PROMPT FOR VELOCITYMAID**

Copy → Paste → Edit → Run in Cursor

```
You are the AI engineer for VelocityMaid Next.js platform.

Your goal is to modify the codebase exactly as instructed.

### PROJECT CONTEXT
- Project: VelocityMaid Next.js platform
- Tech Stack: 
  - Next.js 14 (App Router)
  - TypeScript
  - Prisma ORM
  - Supabase (PostgreSQL)
  - Stripe (payments)
  - Tailwind CSS
  - Lucide React (icons)
- Branches: new-jersey, vermont, jamaica, port-antonio
- Key Features: Booking system, Cleaner dashboard, Customer portal, Admin panel, Review system

### CODEBASE STRUCTURE
- `/app` - Next.js App Router pages and routes
- `/app/api` - API routes (server-side)
- `/lib` - Shared utilities and services
- `/prisma` - Database schema and migrations
- `/utils` - Helper functions
- `/public` - Static assets (images, brand materials)

### GENERAL RULES
- Always show me the exact files you will modify before making changes
- When editing files, show only the diff patch
- Never invent new files unless I request them
- If an error occurs during build, help me trace the root cause and propose a fix
- Ask clarifying questions if anything is ambiguous
- For client components, always include "use client" at the top
- For API routes using dynamic features (request.url, cookies, searchParams), add:
  ```typescript
  export const dynamic = 'force-dynamic';
  ```
- Never use Next.js Image component with onError handlers - use regular img tag instead

### TASK
<WRITE YOUR SPECIFIC TASK HERE>

### AFTER THE TASK
- Run a quick audit for related issues
- Check for linting errors
- Verify build compatibility
- Suggest improvements only if important
```

---

## 📋 **VELOCITYMAID-SPECIFIC PROMPT EXAMPLES**

### 1️⃣ **Fix Build Errors**

```
Fix the following build error in VelocityMaid:

<PASTE ERROR HERE>

Update only the required files. Show the diffs before applying.
After fixing, verify with: npm run build
```

---

### 2️⃣ **Add Review Page for New Branch**

```
Create a new review page at /review-us/{branch-name} following the pattern of /review-us/new-jersey.

Requirements:
- Client component ("use client")
- QR code section with fallback icon
- Google Review redirect button (uses NEXT_PUBLIC_{BRANCH}_GOOGLE_REVIEW_URL)
- Referral section
- Tailwind styling matching VelocityMaid brand colors (#0A3D2F, #F8C548)
- No metadata export

Show the file diff before writing changes.
```

---

### 3️⃣ **Fix API Route Dynamic Errors**

```
Find all API routes in /app/api that use:
- request.url
- cookies()
- nextUrl.searchParams

But do NOT have:
export const dynamic = 'force-dynamic';

Add the export where needed. Show all files impacted with diffs.
```

---

### 4️⃣ **Fix Client Component Errors**

```
Find all pages in /app that:
- use useEffect, useState, or event handlers
- but do NOT have "use client" at the top

Add "use client" where needed and show all diffs.
```

---

### 5️⃣ **Add Environment Variable**

```
Add a new environment variable for {BRANCH} Google Review URL.

1. Update .env.example (if exists)
2. Update the review page to use it
3. Update any API routes that need it
4. Document in GOOGLE_REVIEW_URL_SETUP.md

Show all file changes.
```

---

### 6️⃣ **Fix Prisma Client Issues**

```
Search the entire codebase for any PrismaClient instances created in:
- Client components ("use client")
- Files that don't have proper server-only guards

Move them into /lib/prisma.ts or server-only files.
Refactor safely and show diff patches only.
```

---

### 7️⃣ **Audit Review System**

```
Audit the review system for VelocityMaid:

1. Check /app/review-us/* pages
2. Check /app/api/reviews/* routes
3. Verify all use proper dynamic exports
4. Check for any Image component issues
5. Verify environment variables are set

Report any issues found and fix them.
```

---

### 8️⃣ **Add New Branch Configuration**

```
Add support for a new branch: {branch-name}

Required changes:
1. Update Prisma schema if needed
2. Add branch-specific pages/routes
3. Add environment variables
4. Update any branch filtering logic
5. Add to branch enum/constants

Show all files that need modification with diffs.
```

---

## 🎨 **VELOCITYMAID BRAND COLORS**

When creating UI components, use these colors:

```typescript
const brandColors = {
  primary: '#0A3D2F',    // Dark green
  accent: '#F8C548',     // Yellow/gold
  accent2: '#2B70C9',    // Blue (for some branches)
  white: '#FFFFFF',
  neutral: '#F3F1EB',    // Beige/cream
  gray: '#F1F1F1',
};
```

---

## 🔍 **COMMON VELOCITYMAID PATTERNS**

### Review Page Pattern
```typescript
"use client";
import { useState } from 'react';
import { Star, QrCode, ExternalLink, Sparkles, Gift } from 'lucide-react';
import Link from 'next/link';

export default function ReviewUsPage() {
  const [imageError, setImageError] = useState(false);
  const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL || "#";
  
  // Component code...
}
```

### API Route Pattern (Dynamic)
```typescript
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Route handler...
}
```

### API Route Pattern (Static)
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Route handler...
}
```

---

## ⚠️ **COMMON PITFALLS TO AVOID**

1. ❌ Using Next.js `Image` with `onError` handler → ✅ Use regular `img` tag
2. ❌ Missing `"use client"` in components with hooks → ✅ Always add it
3. ❌ Missing `export const dynamic = 'force-dynamic'` in dynamic API routes → ✅ Add it
4. ❌ Creating PrismaClient in client components → ✅ Use `/lib/prisma.ts`
5. ❌ Hardcoding branch names → ✅ Use environment variables or constants

---

## 🚀 **QUICK COMMANDS**

### Build Check
```
Run: npm run build
Check for: errors, warnings about dynamic routes
```

### Lint Check
```
Run: npm run lint
Or check specific file with linter
```

### Test Review Page
```
Visit: http://localhost:3000/review-us/new-jersey
Check: QR code, Google Review button, all sections render
```

---

## 📝 **WHEN TO USE THIS TEMPLATE**

- ✅ Adding new features
- ✅ Fixing build errors
- ✅ Refactoring code
- ✅ Adding new branches
- ✅ Updating review system
- ✅ Fixing deployment issues
- ✅ Adding new API routes
- ✅ Creating new pages

---

## 💡 **PRO TIPS**

1. **Always paste the exact error message** - Cursor solves errors fast when it sees the full context
2. **Specify the file path** - Helps Cursor find the right file quickly
3. **Ask for diffs first** - Review changes before applying
4. **Test after changes** - Run build/lint to verify
5. **Document changes** - Update relevant .md files if needed

---

## 🆘 **IF CURSOR GETS CONFUSED**

```
Stop. Reset your understanding. 

Summarize the current VelocityMaid codebase structure:
- Main directories
- Key features
- Current branch setup
- Review system architecture

Then proceed with the task.
```

---

**Last Updated:** Based on VelocityMaid Next.js platform structure
**Version:** 1.0


