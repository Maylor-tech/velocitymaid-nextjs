import Link from "next/link";
import { brandClasses } from "@/lib/brand/tokens";

export default function PricingCTA() {
  return (
    <div className="rounded-xl border border-vm-border bg-white p-8 shadow-sm">
      <h3 className="text-lg font-heading font-semibold text-vm-navy">
        Let&apos;s Discuss Fit
      </h3>

      <p className="mt-3 max-w-2xl text-vm-muted font-sans">
        VelocityMaid pricing is designed to be fair, predictable, and aligned
        with real operational needs. We&apos;re happy to discuss pilots, volume
        considerations, and rollout timing.
      </p>

      <div className="mt-6">
        <Link href="/contact" className={brandClasses.btnPrimary}>
          Request a conversation
        </Link>
      </div>
    </div>
  );
}
