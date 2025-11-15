import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "VelocityMaid | Professional Cleaning Services in New Jersey",
  description: "Experience professional cleaning services with VelocityMaid. We provide residential and commercial cleaning solutions across New Jersey. Book your service today!",
  keywords: "cleaning services, maid service, house cleaning, commercial cleaning, New Jersey, professional cleaners, Newark cleaning, Jersey City cleaning",
  authors: [{ name: "VelocityMaid" }],
  creator: "VelocityMaid",
  publisher: "VelocityMaid",
  openGraph: {
    title: "VelocityMaid | Professional Cleaning Services in New Jersey",
    description: "Professional cleaning services for busy New Jersey families. Residential and commercial cleaning in Newark, Jersey City, and surrounding areas.",
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
    description: "Professional cleaning services for busy New Jersey families.",
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
    "image": "https://velocitymaid.com/images/gallery/velocitymaid-cozy-bedroom-cleaning-nj.jpg",
    "description": "Professional cleaning services for busy New Jersey families. Residential and commercial cleaning in Newark, Jersey City, and surrounding areas.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Newark",
      "addressRegion": "NJ",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "40.7357",
      "longitude": "-74.1724"
    },
    "url": "https://velocitymaid.com",
    "telephone": "+19732809190",
    "email": "hello@velocitymaid.com",
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": "Newark"
      },
      {
        "@type": "City",
        "name": "Jersey City"
      },
      {
        "@type": "City",
        "name": "Paterson"
      }
    ],
    "serviceType": "Cleaning Service",
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
          phoneNumber="19732809190"
          message="Hi VelocityMaid! I'd like to book a cleaning service."
          position="right"
          showPopup={true}
        />
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  );
}
