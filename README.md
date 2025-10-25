# VelocityMaid - Next.js Website

A modern, professional website for VelocityMaid cleaning services built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- ✨ Modern, responsive design
- 📱 Mobile-first approach
- ⚡ Lightning-fast performance
- 🎨 Smooth animations and transitions
- 📧 Contact form integration
- 🔗 WhatsApp integration
- 📞 Click-to-call functionality
- 🎯 SEO optimized
- ♿ Accessibility compliant

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.x or higher
- npm or yarn package manager

## 🏗️ Installation

1. **Extract the project files** to your desired location

2. **Navigate to the project directory:**
   ```bash
   cd velocitymaid-nextjs
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
   or with yarn:
   ```bash
   yarn install
   ```

## 🚀 Development

To run the development server:

```bash
npm run dev
```
or
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🏭 Building for Production

To create a production build:

```bash
npm run build
```
or
```bash
yarn build
```

To run the production build locally:

```bash
npm run start
```
or
```bash
yarn start
```

## 📦 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is made by the creators of Next.js and offers the best experience:

1. **Sign up at [vercel.com](https://vercel.com)**

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Link to your Vercel account
   - Select the project settings (accept defaults)
   - Your site will be deployed automatically!

5. **Connect your domain:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Domains
   - Add `velocitymaid.com`
   - Update your domain's DNS records as instructed

**Advantages:**
- ✅ Automatic deployments on git push
- ✅ Preview deployments for branches
- ✅ Built-in SSL certificates
- ✅ Global CDN
- ✅ Instant rollbacks
- ✅ Zero configuration needed

### Option 2: Netlify

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Upload the `.next` folder** to Netlify via drag-and-drop or CLI

3. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

### Option 3: Self-Hosting (VPS/Dedicated Server)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Install PM2 for process management:**
   ```bash
   npm install -g pm2
   ```

3. **Start the application:**
   ```bash
   pm2 start npm --name "velocitymaid" -- start
   ```

4. **Set up Nginx as reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name velocitymaid.com www.velocitymaid.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable SSL with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d velocitymaid.com -d www.velocitymaid.com
   ```

## 🎨 Customization

### Contact Information

Update contact details in `app/page.tsx`:

```typescript
const bookingUrl = "https://forms.gle/sFQWSPxtgKmrnFEy5";
const phoneNumber = "(973) 280-9190";
const whatsappNumber = "19732809190";
const email = "hello@velocitymaid.com";
```

### Colors

Customize the color scheme in `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... customize as needed
  },
}
```

### Content

All content can be edited directly in `app/page.tsx`. The component is well-organized with clear sections:
- Hero Section
- Why Choose Us
- Services
- Pricing
- CTA Section
- Contact Section
- Footer

### Images

Replace placeholder images by updating the image URLs in `app/page.tsx`. Current images are from Unsplash.

To use your own images:
1. Place images in `public/images/` folder
2. Update image sources: `src="/images/your-image.jpg"`

## 📱 Progressive Web App (PWA)

To make this a PWA, install next-pwa:

```bash
npm install next-pwa
```

Then update `next.config.js` to include PWA configuration.

## 🔍 SEO

The site includes comprehensive SEO settings in `app/layout.tsx`:
- Meta tags
- Open Graph tags
- Structured data (can be added)
- Sitemap generation (can be added)

To add a sitemap, create `app/sitemap.ts`:

```typescript
export default function sitemap() {
  return [
    {
      url: 'https://velocitymaid.com',
      lastModified: new Date(),
    },
    // Add more pages...
  ]
}
```

## 📊 Analytics

To add Google Analytics:

1. **Install analytics package:**
   ```bash
   npm install @next/third-parties
   ```

2. **Add to layout:**
   ```typescript
   import { GoogleAnalytics } from '@next/third-parties/google'
   
   // In RootLayout component
   <GoogleAnalytics gaId="G-XXXXXXXXXX" />
   ```

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors:

1. **Clear cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Image Loading Issues

If external images don't load, check `next.config.js` and ensure the domain is listed:

```javascript
images: {
  domains: ['images.unsplash.com', 'yourdomain.com'],
}
```

## 📚 Project Structure

```
velocitymaid-nextjs/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable components (future)
├── public/               # Static files
│   └── images/          # Image assets
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## 🤝 Support

For questions or issues:
- Email: hello@velocitymaid.com
- Phone: (973) 280-9190

## 📄 License

This project is proprietary and confidential.

---

Built with ❤️ for VelocityMaid
