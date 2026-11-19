import { Metadata } from "next";
import { Suspense } from "react";
import HostIntakeForm from "./HostIntakeForm";
import { VermontHostMarketing } from "@/components/marketing/VermontHostMarketing";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Vermont turnover cleaning with a photo report | VelocityMaid";
const description =
  "Guest-ready Vermont rentals, every turnover. Your property's own checklist, a photo report after every clean, and one price agreed before we start.";

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
          <div className="rounded-vm-xl border border-vm-line bg-vm-white p-7 text-center font-body text-sm text-vm-muted">
            Loading form…
          </div>
        }
      >
        <HostIntakeForm />
      </Suspense>
    </VermontHostMarketing>
  );
}
