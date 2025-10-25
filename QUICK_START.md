# ⚡ Quick Start Guide - 5 Minutes to Live!

Get your VelocityMaid website running in 5 minutes flat.

---

## 🚀 Option 1: Deploy with Vercel (EASIEST)

### **Step 1:** Install Dependencies (2 minutes)
```bash
cd velocitymaid-nextjs
npm install
```

### **Step 2:** Test Locally (1 minute)
```bash
npm run dev
```
Open http://localhost:3000 → See your site!

### **Step 3:** Deploy to Vercel (2 minutes)
```bash
npm install -g vercel
vercel --prod
```

**Done!** Your site is live at the URL Vercel provides. 🎉

### **Step 4:** Connect Domain (Optional)
In Vercel dashboard: Settings → Domains → Add `velocitymaid.com`

---

## 🎯 Option 2: GitHub + Auto-Deploy

### **Step 1:** Push to GitHub
```bash
cd velocitymaid-nextjs
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/velocitymaid-nextjs.git
git push -u origin main
```

### **Step 2:** Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repo
4. Click "Deploy"

**Done!** Every git push now auto-deploys. 🚀

---

## 📝 Customization Checklist

Before deploying, customize these in `app/page.tsx`:

```typescript
// Line 31-34
const bookingUrl = "YOUR_GOOGLE_FORM_URL";
const phoneNumber = "YOUR_PHONE";
const whatsappNumber = "YOUR_WHATSAPP";
const email = "YOUR_EMAIL";
```

---

## ✅ Pre-Launch Checklist

```
[ ] npm install completed
[ ] npm run dev works locally
[ ] Contact info updated
[ ] Booking URL updated
[ ] Tested on mobile
[ ] All links work
```

---

## 🆘 Quick Troubleshooting

**Build fails?**
```bash
rm -rf node_modules .next
npm install
npm run build
```

**Port 3000 busy?**
```bash
npm run dev -- -p 3001
```

**Images not loading?**
- Check `next.config.js` domains list
- Clear browser cache

---

## 📚 What's Next?

- Read `README.md` for full details
- Read `DEPLOYMENT.md` for deployment options
- Customize colors in `tailwind.config.ts`
- Add your own images in `public/images/`

---

## 🎊 That's It!

You now have a production-ready Next.js website!

**Need help?**
- Email: hello@velocitymaid.com
- Phone: (973) 280-9190

**Happy launching!** 🚀
