import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "VelocityMaid | Professional Cleaning Services in New Jersey",
  description: "Experience professional cleaning services with VelocityMaid. We provide residential and commercial cleaning solutions across New Jersey. Book your service today!",
  keywords: "cleaning services, maid service, house cleaning, commercial cleaning, New Jersey, professional cleaners",
  authors: [{ name: "VelocityMaid" }],
  openGraph: {
    title: "VelocityMaid | Professional Cleaning Services",
    description: "Experience professional cleaning services with VelocityMaid",
    type: "website",
    locale: "en_US",
    siteName: "VelocityMaid",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {children}
        <WhatsAppButton 
          phoneNumber="19732809190"
          message="Hi VelocityMaid! I'd like to book a cleaning service."
          position="right"
          showPopup={true}
        />
      </body>
    </html>
  );
}
