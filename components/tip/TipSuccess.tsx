import { CheckCircle2 } from 'lucide-react';

export interface TipSuccessProps {
  amountDollars: number;
  guestName?: string;
}

/**
 * Guest tip success — no cleaner identity, no notification promise,
 * no private feedback, no public-review CTA on this PEK path.
 */
export default function TipSuccess({ amountDollars }: TipSuccessProps) {
  const formattedAmount = amountDollars.toFixed(
    amountDollars % 1 === 0 ? 0 : 2
  );

  return (
    <div className="max-w-md mx-auto w-full text-center">
      <CheckCircle2
        className="mx-auto h-16 w-16 text-vm-cyan"
        strokeWidth={1.5}
      />
      <h2 className="font-heading text-4xl font-bold text-white text-center mt-6">
        Thank you!
      </h2>
      <p className="text-white/55 font-body text-center mt-2">
        Thank you. Your tip has been received and will be credited to the
        cleaning team.
      </p>
      <p className="mt-6 bg-white/8 rounded-xl px-8 py-4 text-vm-cyan font-heading text-2xl font-bold text-center">
        You tipped ${formattedAmount}
      </p>
      <p className="text-vm-cyan/40 font-heading text-xs tracking-widest text-center mt-12 uppercase">
        COME HOME TO CLEAN
      </p>
    </div>
  );
}
