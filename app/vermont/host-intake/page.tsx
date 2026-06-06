import { Metadata } from "next";
import HostIntakeForm from "./HostIntakeForm";

export const metadata: Metadata = {
  title: "Get a Quote | VelocityMaid Vermont",
  description:
    "Tell us about your Vermont rental property and we'll send you a custom cleaning quote within 24 hours.",
};

export default function HostIntakePage() {
  return <HostIntakeForm />;
}
