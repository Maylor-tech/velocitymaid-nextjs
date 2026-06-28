import { CheckCircle2 } from "lucide-react";
import { DEFAULT_GOOGLE_REVIEW_URL } from "@/lib/reviews/googleReviewUrl";

export interface TipSuccessProps {
  amountDollars: number;
  guestName?: string;
}

export default function TipSuccess({ amountDollars, guestName }: TipSuccessProps) {
  const formattedAmount = amountDollars.toFixed(
    amountDollars % 1 === 0 ? 0 : 2
  );

  return (
    <div className="max-w-md mx-auto w-full text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-vm-cyan" strokeWidth={1.5} />
      <h2 className="font-heading text-4xl font-bold text-white text-center mt-6">
        Thank you!
      </h2>
      <p className="text-white/55 font-body text-center mt-2">
        Your tip is on its way.
      </p>
      {guestName ? (
        <p className="text-white/45 text-sm text-center mt-1 font-body">
          We&apos;ll make sure your cleaner knows it&apos;s from you, {guestName}.
        </p>
      ) : null}
      <p className="mt-6 bg-white/8 rounded-xl px-8 py-4 text-vm-cyan font-heading text-2xl font-bold text-center">
        You tipped ${formattedAmount}
      </p>
      <a
        href={DEFAULT_GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 bg-transparent border border-white/20 text-white/70 hover:border-vm-cyan hover:text-vm-cyan rounded-lg px-6 py-3 text-sm font-heading transition-colors text-center block"
      >
        Leave us a Google review
      </a>
      <p className="text-vm-cyan/40 font-heading text-xs tracking-widest text-center mt-12 uppercase">
        Come home to clean.
      </p>
    </div>
  );
}
