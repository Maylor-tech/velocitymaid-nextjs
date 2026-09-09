import { Metadata } from "next";
import HostIntakeForm from "./HostIntakeForm";
import { VermontHostMarketing } from "@/components/marketing/VermontHostMarketing";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Get a Quote | VelocityMaid Vermont";
const description =
  "Tell us about your Vermont rental property and we'll send you a custom cleaning quote within 24 hours.";

export const metadata: Metadata = {
  title,
  description,
  ...pageSocialMetadata({
    title,
    description,
    path: "/vermont/host-intake",
    image: "vermont",
  }),
};

export default function HostIntakePage() {
  return (
    <VermontHostMarketing>
      <HostIntakeForm embedded />
    </VermontHostMarketing>
  );
}
