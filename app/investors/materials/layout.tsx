/**
 * Investor Materials Layout
 * 
 * Provides metadata for the investor materials page
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor Materials | VelocityMaid",
  description: "Confidential materials for qualified investors. VelocityMaid shares detailed materials selectively to ensure context, alignment, and responsible use of information.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function InvestorMaterialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


