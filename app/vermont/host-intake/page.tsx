import { Metadata } from "next";
import { Suspense } from "react";
import HostIntakeForm from "./HostIntakeForm";
import { VermontHostMarketing } from "@/components/marketing/VermontHostMarketing";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Get a Quote | VelocityMaid Vermont";
const description =
  "Tell us about your Vermont rental property to request a walkthrough or custom cleaning quote.";

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
      <Suspense
        fallback={
          <div className="py-12 text-center font-body text-sm text-vm-muted">
            Loading form…
          </div>
        }
      >
        <HostIntakeForm embedded />
      </Suspense>
    </VermontHostMarketing>
  );
}
