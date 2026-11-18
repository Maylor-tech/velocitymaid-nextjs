import { vmFocusRing } from "@/components/vm/focus";
import { cn } from "@/lib/utils";

const ROWS = [
  ["2 bedroom", "$195"],
  ["3 bedroom", "$325"],
  ["4 bedroom", "$390"],
  ["Large 4 bedroom", "$455"],
  ["5+ bedrooms, Middlebury & outlying towns", "Custom quote"],
] as const;

const bookButton = cn(
  "inline-flex min-h-[48px] items-center justify-center rounded-vm-md bg-vm-cyan px-[22px] py-3.5 font-heading text-base font-bold tracking-tight text-vm-navy hover:bg-vm-cyan/90",
  vmFocusRing
);

export function VermontTurnoverPrices({ bookHref }: { bookHref: string }) {
  return (
    <section aria-labelledby="vt-turnover-prices">
      <h2
        id="vt-turnover-prices"
        className="font-heading text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.2] tracking-tight text-vm-navy"
      >
        Turnover clean — Okemo Valley (Ludlow, Cavendish, Proctorsville, Okemo area)
      </h2>
      <div className="mt-5 overflow-hidden rounded-[14px] border border-vm-line bg-vm-white">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">
            Turnover clean — Okemo Valley (Ludlow, Cavendish, Proctorsville, Okemo area)
          </caption>
          <colgroup>
            <col />
            <col className="w-[9.5rem]" />
          </colgroup>
          <thead className="sr-only">
            <tr>
              <th scope="col">Home</th>
              <th scope="col">Price</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([home, price]) => (
              <tr key={home} className="border-t border-vm-line first:border-t-0">
                <th
                  scope="row"
                  className="px-3 py-3 text-left font-body text-sm font-semibold leading-snug text-vm-navy sm:px-5 sm:text-base"
                >
                  {home}
                </th>
                <td className="break-words px-3 py-3 text-right font-heading text-[15px] font-bold leading-snug tracking-tight text-vm-navy sm:px-5 sm:text-base">
                  {price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-3xl font-body text-sm leading-relaxed text-vm-muted">
        Flat price per turnover. Includes a photo report according to your booked
        service package. Deep cleans and first-time cleans are quoted separately.
      </p>
      <p className="mt-3 max-w-3xl font-body text-base leading-relaxed text-vm-text">
        After your photo report, you get one payment request. Zelle is our preferred
        way to pay. Card (by secure link) and PayPal are also accepted.
      </p>
      <a href={bookHref} className={cn(bookButton, "mt-5")}>
        Book a turnover
      </a>
      <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
        We reply within one business day.
      </p>
    </section>
  );
}
