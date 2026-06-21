import Link from "next/link";
import { BrandLogo } from "@/components/brand";
import TipSuccess from "@/components/tip/TipSuccess";

interface TipSuccessPageProps {
  searchParams: {
    payment_intent?: string;
    payment_intent_client_secret?: string;
    amount?: string;
    guestName?: string;
    redirect_status?: string;
  };
}

export default function TipSuccessPage({ searchParams }: TipSuccessPageProps) {
  const amountParam = searchParams.amount;
  const amountDollars = amountParam ? parseFloat(amountParam) : 0;
  const guestName = searchParams.guestName;
  const showSuccess =
    searchParams.redirect_status === "succeeded" || Boolean(searchParams.payment_intent);

  return (
    <div className="min-h-screen bg-vm-navy">
      <header className="py-5 px-6">
        <Link href="/">
          <BrandLogo variant="ivory" size="header" showTagline={false} />
        </Link>
      </header>
      <main className="flex flex-col items-center justify-center px-4 py-12">
        {showSuccess && amountDollars > 0 ? (
          <TipSuccess amountDollars={amountDollars} guestName={guestName} />
        ) : (
          <div className="max-w-md mx-auto w-full text-center">
            <p className="font-body text-white/70">
              We&apos;re confirming your tip. If you completed payment, thank you!
            </p>
            <Link
              href="/tip"
              className="mt-6 inline-block text-vm-cyan hover:text-vm-cyan-dark font-heading text-sm"
            >
              Leave another tip
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
