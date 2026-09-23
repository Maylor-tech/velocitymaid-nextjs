import { Metadata } from "next";
import { HostsLandingPage } from "@/components/hosts/HostsLandingPage";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Vermont Hosts | Guest-Ready Property Setup | VelocityMaid";
const description =
  "Request property setup for Vermont vacation rentals. Documented turnovers, property-specific standards, and local host support from VelocityMaid.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/hosts" },
  ...pageSocialMetadata({
    title,
    description,
    path: "/hosts",
    image: "vermont",
  }),
};

export default function HostsPage() {
  return <HostsLandingPage />;
}
