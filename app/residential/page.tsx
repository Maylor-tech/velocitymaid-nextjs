import { Metadata } from "next";
import { ResidentialLandingPage } from "@/components/residential/ResidentialLandingPage";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Vermont Residential Cleaning | VelocityMaid";
const description =
  "Request residential cleaning for Vermont homes — one-time, recurring, deep, and move-in/move-out. Homeowners, tenants, and landlords welcome.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/residential" },
  ...pageSocialMetadata({
    title,
    description,
    path: "/residential",
    image: "vermont",
  }),
};

export default function ResidentialPage() {
  return <ResidentialLandingPage />;
}
