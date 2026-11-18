import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Script from "next/script";
import WhatsAppButton from "../components/WhatsAppButton";
import { DemoModeBanner } from "../components/DemoModeBanner";
import { BUSINESS_ADDRESS } from "@/lib/company/businessAddress";
import {
  SITE_ORIGIN,
  SOCIAL_IMAGES,
  socialImageAbsoluteUrl,
  socialImageMeta,
} from "@/lib/seo/socialImages";

const inter = localFont({
  src: [
    { path: "./fonts/inter-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: [
    {
      path: "./fonts/space-grotesk-latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/space-grotesk-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});

const playfair = localFont({
  src: [
    {
      path: "./fonts/playfair-display-latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/playfair-display-latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/playfair-display-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = localFont({
  src: [
    {
      path: "./fonts/plus-jakarta-sans-latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/plus-jakarta-sans-latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/plus-jakarta-sans-latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/plus-jakarta-sans-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const defaultSocialImage = socialImageMeta("default");

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_ORIGIN}/`),
  title: "VelocityMaid | Professional Cleaning Services in New Jersey and Vermont",
  description:
    "VelocityMaid offers professional cleaning services in New Jersey and Vermont. Home and apartment cleaning for NJ families. Turnover cleaning for Vermont Airbnbs and short-term rentals. Request a quote online in minutes.",
  keywords: "cleaning services, maid service, house cleaning, New Jersey, Vermont, professional cleaners, Montclair cleaning, Newark cleaning, Bloomfield cleaning",
  authors: [{ name: "VelocityMaid" }],
  creator: "VelocityMaid",
  publisher: "VelocityMaid",
  openGraph: {
    title: "VelocityMaid | Professional Cleaning Services in New Jersey and Vermont",
    description:
      "VelocityMaid offers professional cleaning services in New Jersey and Vermont. Home and apartment cleaning for NJ families. Turnover cleaning for Vermont Airbnbs and short-term rentals. Request a quote online in minutes.",
    type: "website",
    locale: "en_US",
    siteName: "VelocityMaid",
    url: SITE_ORIGIN,
    images: [defaultSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "VelocityMaid | Professional Cleaning Services",
    description: "VelocityMaid provides reliable home and apartment cleaning services across New Jersey and Vermont.",
    images: [SOCIAL_IMAGES.default.path],
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
    ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : {}),
  },
  icons: {
    icon: [
      { url: '/brand/velocitymaid/favicon.ico', sizes: 'any' },
      { url: '/brand/velocitymaid/web/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/velocitymaid/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/velocitymaid/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/velocitymaid/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/brand/velocitymaid/apple-touch-icon.png',
    shortcut: '/brand/velocitymaid/favicon.ico',
  },
  themeColor: '#0F1C2E',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Structured data for local business SEO - Multiple locations
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "VelocityMaid - New Jersey",
      "alternateName": "VelocityMaid Cleaning Services New Jersey",
      "image": socialImageAbsoluteUrl("default"),
      "description": "VelocityMaid provides recurring residential cleaning across Bloomfield, Montclair, Newark, East Orange, Irvington, South Orange, West Orange, and Nutley — with deep cleans and move-in/move-out available. Pricing confirmed after quote review.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Montclair",
        "addressRegion": "NJ",
        "addressCountry": "US"
      },
      "url": "https://velocitymaid.com/new-jersey",
      "telephone": "+18027335348",
      "email": "hello@velocitymaid.com",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "09:00",
          "closes": "18:00"
        }
      ],
      "areaServed": [
        { "@type": "City", "name": "Bloomfield" },
        { "@type": "City", "name": "Montclair" },
        { "@type": "City", "name": "Newark" },
        { "@type": "City", "name": "East Orange" },
        { "@type": "City", "name": "Irvington" },
        { "@type": "City", "name": "South Orange" },
        { "@type": "City", "name": "West Orange" },
        { "@type": "City", "name": "Nutley" }
      ],
      "serviceType": "Recurring Residential Cleaning",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Cleaning Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Residential Cleaning"
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
        "reviewCount": "100"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "VelocityMaid - Vermont",
      "alternateName": "VelocityMaid Cleaning Services Vermont",
      "image": socialImageAbsoluteUrl("default"),
      "description": "VelocityMaid provides reliable home and apartment cleaning services in Vermont, specializing in move-in/out cleaning, deep cleaning, and maintenance cleaning.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": BUSINESS_ADDRESS.street,
        "addressLocality": BUSINESS_ADDRESS.city,
        "addressRegion": BUSINESS_ADDRESS.state,
        "postalCode": BUSINESS_ADDRESS.zip,
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "43.3977",
        "longitude": "-72.7013"
      },
      "url": "https://velocitymaid.com/vermont",
      "telephone": "+18027335348",
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
      "areaServed": {
        "@type": "State",
        "name": "Vermont"
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
              "name": "Rental Turnover Cleaning"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Deep Winter Cleaning"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Second Home Care"
            }
          }
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "reviewCount": "50"
      }
    }
  ];

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable} ${plusJakarta.variable}`}
    >
      <body className={`${inter.className} font-body antialiased`}>
        <DemoModeBanner />
        {structuredData.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
        {children}
        <WhatsAppButton 
          phoneNumber="18027335348"
          message="Hi VelocityMaid! I'd like to book a cleaning service."
          position="right"
          showPopup={true}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
