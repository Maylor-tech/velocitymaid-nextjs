import type { Metadata } from "next";
import {
  Inter,
  Space_Grotesk,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import WhatsAppButton from "../components/WhatsAppButton";
import { GoogleAnalytics } from '@next/third-parties/google';
import { DemoModeBanner } from "../components/DemoModeBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VelocityMaid | Professional Cleaning Services in New Jersey & Vermont",
  description:
    "VelocityMaid offers professional cleaning services in New Jersey and Vermont. Home and apartment cleaning for NJ families. Turnover cleaning for Vermont Airbnbs and short-term rentals. Book online in minutes.",
  keywords: "cleaning services, maid service, house cleaning, commercial cleaning, New Jersey, professional cleaners, Newark cleaning, Jersey City cleaning",
  authors: [{ name: "VelocityMaid" }],
  creator: "VelocityMaid",
  publisher: "VelocityMaid",
  openGraph: {
    title: "VelocityMaid | Professional Cleaning Services in New Jersey & Vermont",
    description:
      "VelocityMaid offers professional cleaning services in New Jersey and Vermont. Home and apartment cleaning for NJ families. Turnover cleaning for Vermont Airbnbs and short-term rentals. Book online in minutes.",
    type: "website",
    locale: "en_US",
    siteName: "VelocityMaid",
    url: "https://velocitymaid.com",
    images: [
      {
        url: '/images/home/modern-kitchen.jpg',
        width: 1200,
        height: 630,
        alt: 'VelocityMaid Professional Cleaning Services',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VelocityMaid | Professional Cleaning Services",
    description: "VelocityMaid provides reliable home and apartment cleaning services across New Jersey and Vermont.",
    images: ['/images/home/modern-kitchen.jpg'],
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured data for local business SEO - Multiple locations
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "VelocityMaid - New Jersey",
      "alternateName": "VelocityMaid Cleaning Services New Jersey",
      "image": "https://velocitymaid.com/images/home/modern-kitchen.jpg",
      "description": "VelocityMaid provides reliable home and apartment cleaning services across New Jersey, specializing in move-in/out cleaning, deep cleaning, and maintenance cleaning.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Newark",
        "addressRegion": "NJ",
        "addressCountry": "US"
      },
      "url": "https://velocitymaid.com/locations/new-jersey",
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
      "image": "https://velocitymaid.com/images/home/modern-kitchen.jpg",
      "description": "VelocityMaid provides reliable home and apartment cleaning services in Vermont, specializing in move-in/out cleaning, deep cleaning, and maintenance cleaning.",
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
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
