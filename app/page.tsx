import type { Metadata } from "next";
import { HomepageMarketing } from "@/components/marketing/HomepageMarketing";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title =
  "VelocityMaid | Professional Cleaning Services in New Jersey & Vermont";
const description =
  "VelocityMaid offers professional cleaning services in New Jersey and Vermont. Home and apartment cleaning for NJ families. Turnover cleaning for Vermont Airbnbs and short-term rentals. Book online in minutes.";

export const metadata: Metadata = {
  title,
  description,
  ...pageSocialMetadata({
    title,
    description,
    path: "/",
    image: "default",
  }),
};

export default function HomePage() {
  return <HomepageMarketing />;
}
