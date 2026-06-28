import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import CleanerApplyForm from "@/components/cleaners/CleanerApplyForm";

export const metadata: Metadata = {
  title: "Become a Certified VelocityMaid Cleaning Professional",
  description:
    "Apply to join VelocityMaid as a certified cleaning professional. Premium residential cleaning, vacation rental turnovers, and five-star property care in Vermont and New Jersey.",
};

export default function CleanerApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-vm-surface">
          <header className="w-full bg-vm-navy px-6 py-5">
            <BrandLogo theme="dark" size="header" showTagline={false} />
          </header>
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        </div>
      }
    >
      <CleanerApplyForm />
    </Suspense>
  );
}
