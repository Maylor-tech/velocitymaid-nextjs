import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "VelocityMaid | Professional Cleaning Services in New Jersey",
  description: "VelocityMaid provides reliable home and apartment cleaning services across New Jersey, specializing in move-in/out cleaning, deep cleaning, and maintenance cleaning.",
  keywords: "cleaning services, maid service, house cleaning, commercial cleaning, New Jersey, professional cleaners, Newark cleaning, Jersey City cleaning",
  authors: [{ name: "VelocityMaid" }],
  creator: "VelocityMaid",
  publisher: "VelocityMaid",
  openGraph: {
    title: "VelocityMaid | Professional Cleaning Services in New Jersey",
    description: "VelocityMaid provides reliable home and apartment cleaning services across New Jersey, specializing in move-in/out cleaning, deep cleaning, and maintenance cleaning.",
    type: "website",
    locale: "en_US",
    siteName: "VelocityMaid",
    url: "https://velocitymaid.com",
    // Add when you create og-image.jpg:
    // images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VelocityMaid | Professional Cleaning Services",
    description: "VelocityMaid provides reliable home and apartment cleaning services across New Jersey.",
    // Add when you create og-image.jpg:
    // images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add when you set up Google Search Console:
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured data for local business SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "VelocityMaid",
    "alternateName": "VelocityMaid Cleaning Services",
    "image": "https://velocitymaid.com/images/gallery/velocitymaid-cozy-bedroom-cleaning-nj.jpg",
    "description": "VelocityMaid provides reliable home and apartment cleaning services across New Jersey, specializing in move-in/out cleaning, deep cleaning, and maintenance cleaning.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "79 Main Street, Apt 7",
      "addressLocality": "Ludlow",
      "addressRegion": "VT",
      "postalCode": "05149",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "43.3956",
      "longitude": "-72.7023"
    },
    "url": "https://velocitymaid.com",
    "telephone": "+18027335348",
    "email": "hello@velocitymaid.com",
    "priceRange": "$$",
    "founder": {
      "@type": "Person",
      "name": "Brian Maylor"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "areaServed": {
      "@type": "State",
      "name": "New Jersey"
    },
    "serviceType": "Cleaning Service",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Cleaning Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Basic Cleaning"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Deep Cleaning"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Move In/Out Cleaning"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "reviewCount": "50"
    }
  };

  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <WhatsAppButton 
          phoneNumber="18027335348"
          message="Hi VelocityMaid! I'd like to book a cleaning service."
          position="right"
          showPopup={true}
        />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
