# 🔧 Troubleshooting Guide - VelocityMaid Next.js

Quick solutions to common issues you might encounter.

---

## 🚨 Installation Issues

### "npm install" fails

**Error:** Cannot find package / Network error
```bash
# Solution 1: Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solution 2: Use different registry
npm install --registry=https://registry.npmjs.org

# Solution 3: Try yarn instead
npm install -g yarn
yarn install
```

### "Node version too old"

**Error:** Requires Node.js 18 or higher
```bash
# Check current version
node --version

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install latest Node.js
nvm install 20
nvm use 20
```

---

## 🏃 Development Issues

### Port 3000 already in use

**Error:** EADDRINUSE: address already in use :::3000
```bash
# Solution 1: Use different port
npm run dev -- -p 3001

# Solution 2: Kill process on port 3000
# On Mac/Linux:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Hot reload not working

**Issue:** Changes not reflecting automatically
```bash
# Solution 1: Restart dev server
# Ctrl+C to stop, then:
npm run dev

# Solution 2: Clear Next.js cache
rm -rf .next
npm run dev

# Solution 3: Check file watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### "Cannot find module" errors

**Error:** Module not found: Can't resolve 'X'
```bash
# Solution 1: Reinstall dependencies
rm -rf node_modules package-lock.json .next
npm install

# Solution 2: Check import paths
# Bad:  import Button from 'components/Button'
# Good: import Button from '@/components/Button'

# Solution 3: Verify file exists
ls components/Button.tsx
```

---

## 🏗️ Build Issues

### Build fails locally

**Error:** Build failed with error
```bash
# Solution 1: Clean build
rm -rf .next node_modules
npm install
npm run build

# Solution 2: Check for TypeScript errors
npm run build 2>&1 | grep "error TS"

# Solution 3: Bypass TypeScript (temporary)
# In next.config.js, add:
typescript: {
  ignoreBuildErrors: true,
}
```

### Out of memory during build

**Error:** FATAL ERROR: JavaScript heap out of memory
```bash
# Solution: Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build

# Or add to package.json scripts:
"build": "NODE_OPTIONS=--max_old_space_size=4096 next build"
```

### TypeScript errors

**Error:** Type 'X' is not assignable to type 'Y'
```bash
# Solution 1: Check types
# Make sure all components have proper types

# Solution 2: Skip type checking (not recommended)
# In next.config.js:
typescript: {
  ignoreBuildErrors: true,
}

# Solution 3: Update TypeScript
npm install typescript@latest --save-dev
```

---

## 🌐 Deployment Issues

### Vercel deployment fails

**Error:** Build failed on Vercel
```bash
# Solution 1: Test build locally first
npm run build
# If it works locally but not on Vercel:

# Solution 2: Check environment variables
# Make sure all needed env vars are set in Vercel

# Solution 3: Clear Vercel cache
vercel --prod --force

# Solution 4: Check Node version in Vercel
# Add to package.json:
"engines": {
  "node": ">=18.0.0"
}
```

### Site builds but shows 404

**Issue:** All pages show 404
```bash
# Solution: Check output configuration
# In next.config.js, ensure:
const nextConfig = {
  // No "output: 'export'" line
}
```

### "This Serverless Function has crashed"

**Error:** 500 error on deployed site
```bash
# Solution 1: Check Vercel logs
# Vercel Dashboard → Your Project → Functions

# Solution 2: Test production build locally
npm run build
npm run start

# Solution 3: Check API routes
# Make sure no API routes are breaking
```

---

## 🖼️ Image Issues

### Images not loading

**Error:** Invalid src prop
```bash
# Solution 1: Check next.config.js domains
images: {
  domains: ['images.unsplash.com', 'yourdomain.com'],
}

# Solution 2: Use correct path
# For public folder:
<img src="/images/photo.jpg" />

# For external images:
<img src="https://example.com/photo.jpg" />

# Solution 3: Clear browser cache
# Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
```

### Images too large

**Issue:** Slow loading images
```bash
# Solution: Optimize images
# Use online tools:
# - TinyPNG.com
# - Squoosh.app

# Or install sharp:
npm install sharp
# Next.js will automatically optimize images
```

---

## 🎨 Styling Issues

### Tailwind classes not working

**Issue:** Classes have no effect
```bash
# Solution 1: Check Tailwind is configured
# Verify tailwind.config.ts content paths:
content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
]

# Solution 2: Restart dev server
# Ctrl+C, then:
npm run dev

# Solution 3: Clear cache
rm -rf .next
npm run dev
```

### Custom CSS not applying

**Issue:** Styles in globals.css not working
```bash
# Solution 1: Check import in layout.tsx
import "./globals.css";

# Solution 2: Check CSS syntax
# Make sure @tailwind directives are first:
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom CSS below */

# Solution 3: Restart dev server
```

### Styles different in production

**Issue:** Looks different on deployed site
```bash
# Solution 1: Build and test locally
npm run build
npm run start
# Compare to production

# Solution 2: Clear browser cache on production
# Hard refresh: Ctrl+Shift+R

# Solution 3: Check for conflicting styles
# Use browser DevTools to inspect elements
```

---

## 🔗 Link & Navigation Issues

### Links cause full page reload

**Issue:** Page flashes white on navigation
```bash
# Solution: Use Next.js Link component
# Bad:
<a href="/about">About</a>

# Good:
import Link from 'next/link';
<Link href="/about">About</Link>
```

### External links not opening

**Issue:** Links to external sites broken
```bash
# Solution: Add target and rel
<a 
  href="https://example.com" 
  target="_blank" 
  rel="noopener noreferrer"
>
  Link
</a>
```

---

## 📱 Mobile Issues

### Site not responsive

**Issue:** Looks bad on mobile
```bash
# Solution 1: Test with mobile DevTools
# Chrome DevTools: Toggle device toolbar (Ctrl+Shift+M)

# Solution 2: Check meta viewport tag
# Should be in app/layout.tsx (Next.js adds automatically)

# Solution 3: Use responsive Tailwind classes
# sm: md: lg: xl: 2xl:
<div className="w-full md:w-1/2 lg:w-1/3">
```

### Touch targets too small

**Issue:** Buttons hard to tap on mobile
```bash
# Solution: Increase button padding
# Minimum 44x44px touch target
className="px-6 py-3"  // Good for mobile
```

---

## 🔍 SEO & Performance Issues

### Low Lighthouse score

**Issue:** Performance score below 90
```bash
# Solution 1: Optimize images
# Use Next.js Image component
import Image from 'next/image';

# Solution 2: Lazy load components
import dynamic from 'next/dynamic';
const Component = dynamic(() => import('./Component'));

# Solution 3: Check network requests
# Remove unnecessary external scripts
```

### Meta tags not showing

**Issue:** Wrong title/description on Google
```bash
# Solution: Update app/layout.tsx metadata
export const metadata: Metadata = {
  title: "Your Title",
  description: "Your Description",
}

# Solution 2: Wait for Google to re-index
# Can take 1-7 days
```

---

## 🔐 SSL / HTTPS Issues

### "Not Secure" warning

**Issue:** Site shows as not secure
```bash
# Solution 1: Wait for SSL certificate
# Vercel: Usually 1-2 minutes after domain connection

# Solution 2: Check domain DNS
# Must point to correct Vercel IP
# A record: 76.76.21.21

# Solution 3: Force HTTPS
# In next.config.js:
async redirects() {
  return [
    {
      source: '/:path*',
      has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
      destination: 'https://yourdomain.com/:path*',
      permanent: true,
    },
  ];
}
```

---

## 🗄️ Database / API Issues

### API route not working

**Error:** 404 on API endpoint
```bash
# Solution: Check API route location
# Must be in app/api/ folder
# Example: app/api/contact/route.ts

# Solution 2: Check export
export async function POST(request: Request) {
  // Your code
}
```

### CORS errors

**Error:** Access-Control-Allow-Origin
```bash
# Solution: Add CORS headers to API route
export async function POST(request: Request) {
  const response = NextResponse.json(data);
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
```

---

## 🔧 General Debugging Tips

### Enable verbose logging

```bash
# See detailed build info
npm run build -- --debug

# See detailed dev server info
npm run dev -- --turbo
```

### Clear everything and start fresh

```bash
# Nuclear option - clears everything
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
npm run dev
```

### Check for conflicting packages

```bash
# List outdated packages
npm outdated

# Update all packages (careful!)
npm update

# Or update specific package
npm install package-name@latest
```

---

## 📞 Still Stuck?

1. **Check Next.js Documentation:**
   - https://nextjs.org/docs

2. **Search GitHub Issues:**
   - https://github.com/vercel/next.js/issues

3. **Ask on Stack Overflow:**
   - Tag: next.js, typescript, tailwind-css

4. **Check Vercel Discussions:**
   - https://github.com/vercel/next.js/discussions

5. **Contact Support:**
   - VelocityMaid: hello@velocitymaid.com
   - Phone: (973) 280-9190

---

## 💡 Prevention Tips

**Before making changes:**
1. ✅ Test locally first
2. ✅ Commit to git
3. ✅ Create a backup
4. ✅ Test in incognito mode
5. ✅ Check mobile view

**Regular maintenance:**
1. 🔄 Update dependencies monthly
2. 🧹 Clear cache weekly
3. 📊 Monitor performance
4. 🔍 Check error logs
5. 💾 Backup database

---

**Last Updated:** October 24, 2025

*Most issues can be solved with a simple restart or cache clear!*
