import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import CleanerApplyForm from "@/components/cleaners/CleanerApplyForm";
import {
  APPLY_MARKET_CONFIG,
  parseApplyMarket,
} from "@/lib/cleaners/applyMarket";

type PageProps = {
  searchParams?: { market?: string; branch?: string };
};

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const market = parseApplyMarket(
    searchParams?.market,
    searchParams?.branch
  );
  const config = APPLY_MARKET_CONFIG[market];

  return {
    title: config.title,
    description: config.description,
  };
}

export default function CleanerApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-vm-surface flex flex-col">
          <header className="w-full bg-vm-navy py-5 px-6">
            <div className="max-w-xl mx-auto">
              <BrandLogo theme="dark" size="header" showTagline={false} />
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-vm-cyan" />
          </div>
        </div>
      }
    >
      <CleanerApplyForm />
    </Suspense>
  );
}
