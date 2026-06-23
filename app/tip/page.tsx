import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand";
import TipFlow from "@/components/tip/TipFlow";

export const metadata: Metadata = {
  title: "Leave a Tip | VelocityMaid",
  description: "Thank your VelocityMaid cleaner with a quick tip.",
};

export default function TipPage() {
  return (
    <div className="min-h-screen bg-vm-navy">
      <header className="py-5 px-6">
        <BrandLogo variant="ivory" size="header" showTagline={false} />
      </header>
      <main className="flex flex-col items-center justify-center px-4 py-12">
        <TipFlow />
      </main>
    </div>
  );
}
