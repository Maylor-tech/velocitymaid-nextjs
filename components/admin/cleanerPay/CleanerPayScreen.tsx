'use client';

import { cleanerPayCsv } from '@/lib/cleanerComp/pay';

export type CleanerPayLine = {
  cleaner: string;
  job: string;
  date: string;
  method: string;
  rate: string;
  hours: string;
  expected: string;
  paid: string;
  balance: string;
  status: string;
};

export type CleanerPayEntry = {
  date: string;
  amount: string;
  method: string;
  memo: string;
  allocated: string;
};

export type CleanerPayAdvance = {
  date: string;
  amount: string;
  memo: string;
  applied: string;
};

export type CleanerPayReimbursement = {
  person: string;
  amount: string;
  detail: string;
};

export type CleanerPayUnmatched = {
  cleaner: string;
  amount: string;
  reference: string;
  basis: string;
};

export type CleanerPayYtd = {
  total: string;
  threshold: string;
  warnAt: string;
  warning: boolean;
};

type CleanerPayScreenProps = {
  cleanerName: string;
  lines: CleanerPayLine[];
  payments: CleanerPayEntry[];
  advances?: CleanerPayAdvance[];
  reimbursements?: CleanerPayReimbursement[];
  unmatched?: CleanerPayUnmatched[];
  ytd?: CleanerPayYtd | null;
  termsLabel?: string;
  w9Label?: string;
  sample?: boolean;
};

function money(value: string): number {
  const n = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function CleanerPayScreen({
  cleanerName,
  lines,
  payments,
  advances = [],
  reimbursements = [],
  unmatched = [],
  ytd = null,
  termsLabel,
  w9Label,
  sample = false,
}: CleanerPayScreenProps) {
  const expected = lines.reduce((sum, line) => sum + money(line.expected), 0);
  const paid = lines.reduce((sum, line) => sum + money(line.paid), 0);
  const balance = lines.reduce((sum, line) => sum + money(line.balance), 0);

  const download = () => {
    const csv = cleanerPayCsv(lines);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cleaner-pay.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-wide text-vm-cyan-dark">
            Cleaner pay
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-vm-navy">
            {cleanerName}
          </h1>
          <p className="mt-1 max-w-xl font-body text-sm text-vm-text">
            Review list only. Recording a payment here does not send money or email the cleaner.
          </p>
        </div>
        <button
          type="button"
          onClick={download}
          className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-bold text-white outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
        >
          Export CSV
        </button>
      </div>

      {sample ? (
        <p className="rounded-[14px] border border-vm-line bg-white px-4 py-3 font-body text-sm text-vm-text">
          Sample figures for review. Nothing on this page is saved.
        </p>
      ) : null}

      {termsLabel || w9Label ? (
        <p className="font-body text-sm text-vm-text">
          {termsLabel ? <span className="block">{termsLabel}</span> : null}
          {w9Label ? <span className="block">{w9Label}</span> : null}
        </p>
      ) : null}

      {ytd ? (
        <div className="rounded-[14px] border border-vm-line bg-white p-4">
          <p className="font-body text-sm text-vm-muted">Year to date</p>
          <p className="font-heading text-2xl font-bold text-vm-navy">{ytd.total}</p>
          <p className="mt-1 font-body text-sm text-vm-text">
            {ytd.warning
              ? `Year to date has reached ${ytd.warnAt}, 80% of the ${ytd.threshold} 1099 threshold.`
              : `1099 notice starts at ${ytd.warnAt}, 80% of ${ytd.threshold}.`}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Expected', formatMoney(expected)],
          ['Paid', formatMoney(paid)],
          ['Balance', formatMoney(balance)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[14px] border border-vm-line bg-white p-4">
            <p className="font-body text-sm text-vm-muted">{label}</p>
            <p className="font-heading text-2xl font-bold text-vm-navy">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[14px] border border-vm-line bg-white">
        <h2 className="border-b border-vm-line px-4 py-3 font-heading text-lg font-bold text-vm-navy">
          Jobs
        </h2>
        <div className="hidden md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-body text-xs font-bold uppercase tracking-wide text-vm-muted">
                {['Job', 'Date', 'Method', 'Rate', 'Hours', 'Expected', 'Paid', 'Balance', 'Status'].map(
                  (heading) => (
                    <th key={heading} className="px-3 py-2 font-semibold">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.job} className="border-t border-vm-line font-body text-sm text-vm-text">
                  <td className="px-3 py-3 font-semibold text-vm-navy">{line.job}</td>
                  <td className="px-3 py-3">{line.date}</td>
                  <td className="px-3 py-3">{line.method}</td>
                  <td className="px-3 py-3">{line.rate}</td>
                  <td className="px-3 py-3">{line.hours}</td>
                  <td className="px-3 py-3">{line.expected}</td>
                  <td className="px-3 py-3">{line.paid}</td>
                  <td className="px-3 py-3">{line.balance}</td>
                  <td className="px-3 py-3">{line.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-col gap-3 p-3 md:hidden">
          {lines.map((line) => (
            <li key={line.job} className="rounded-[10px] border border-vm-line p-3">
              <p className="font-heading text-base font-bold text-vm-navy">{line.job}</p>
              <p className="font-body text-sm text-vm-muted">
                {line.date} · {line.status}
              </p>
              <p className="mt-2 font-body text-sm text-vm-text">
                {line.method} · {line.rate}
                {line.hours === '—'
                  ? ''
                  : line.hours === 'Not verified'
                    ? ' · Hours not verified'
                    : ` · ${line.hours} verified hours`}
              </p>
              <p className="mt-1 font-body text-sm text-vm-text">
                Expected {line.expected} · Paid {line.paid} · Balance {line.balance}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {advances.length > 0 ? (
        <section className="rounded-[14px] border border-vm-line bg-white">
          <h2 className="border-b border-vm-line px-4 py-3 font-heading text-lg font-bold text-vm-navy">
            Advances
          </h2>
          <ul className="flex flex-col">
            {advances.map((advance) => (
              <li key={`${advance.date}-${advance.amount}`} className="border-b border-vm-line px-4 py-3 last:border-b-0">
                <p className="font-body text-sm font-semibold text-vm-navy">
                  {advance.date} · {advance.amount}
                </p>
                <p className="font-body text-sm text-vm-text">{advance.memo}</p>
                <p className="font-body text-sm text-vm-muted">{advance.applied}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-[14px] border border-vm-line bg-white">
        <h2 className="border-b border-vm-line px-4 py-3 font-heading text-lg font-bold text-vm-navy">
          Reimbursements owed
        </h2>
        {reimbursements.length === 0 ? (
          <p className="px-4 py-3 font-body text-sm text-vm-muted">No personal-funds reimbursements.</p>
        ) : (
          <ul className="flex flex-col">
            {reimbursements.map((row) => (
              <li key={`${row.person}-${row.amount}-${row.detail}`} className="border-b border-vm-line px-4 py-3 last:border-b-0">
                <p className="font-body text-sm font-semibold text-vm-navy">
                  Reimbursement owed to {row.person} · {row.amount}
                </p>
                <p className="font-body text-sm text-vm-muted">{row.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[14px] border border-vm-line bg-white">
        <h2 className="border-b border-vm-line px-4 py-3 font-heading text-lg font-bold text-vm-navy">
          Unmatched
        </h2>
        {unmatched.length === 0 ? (
          <p className="px-4 py-3 font-body text-sm text-vm-muted">No payments waiting for a job.</p>
        ) : (
          <ul className="flex flex-col">
            {unmatched.map((row) => (
              <li key={row.reference} className="border-b border-vm-line px-4 py-3 last:border-b-0">
                <p className="font-body text-sm font-semibold text-vm-navy">
                  {row.cleaner} · {row.amount}
                </p>
                <p className="font-body text-sm text-vm-text">{row.reference}</p>
                <p className="font-body text-sm text-vm-muted">{row.basis} · Waiting for an admin to link the job.</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[14px] border border-vm-line bg-white">
        <h2 className="border-b border-vm-line px-4 py-3 font-heading text-lg font-bold text-vm-navy">
          Manual payments
        </h2>
        <ul className="flex flex-col">
          {payments.map((payment) => (
            <li key={`${payment.date}-${payment.amount}`} className="border-b border-vm-line px-4 py-3 last:border-b-0">
              <p className="font-body text-sm font-semibold text-vm-navy">
                {payment.date} · {payment.method} · {payment.amount}
              </p>
              <p className="font-body text-sm text-vm-text">{payment.memo}</p>
              <p className="font-body text-sm text-vm-muted">{payment.allocated}</p>
            </li>
          ))}
        </ul>
      </section>

      <form className="rounded-[14px] border border-vm-line bg-white p-4" onSubmit={(event) => event.preventDefault()}>
        <h2 className="font-heading text-lg font-bold text-vm-navy">Record a payment</h2>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Zelle, cash, check, or other. Allocate the amount to a job after you record it.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="font-body text-sm font-medium text-vm-text" htmlFor="pay-date">
            Date
            <input id="pay-date" type="date" className="mt-1 min-h-11 w-full rounded-[10px] border border-gray-300 px-3" readOnly={sample} defaultValue="2026-11-19" />
          </label>
          <label className="font-body text-sm font-medium text-vm-text" htmlFor="pay-amount">
            Amount
            <input id="pay-amount" inputMode="decimal" className="mt-1 min-h-11 w-full rounded-[10px] border border-gray-300 px-3" placeholder="0.00" readOnly={sample} />
          </label>
          <label className="font-body text-sm font-medium text-vm-text" htmlFor="pay-method">
            Method
            <select id="pay-method" className="mt-1 min-h-11 w-full rounded-[10px] border border-gray-300 px-3" disabled={sample} defaultValue="ZELLE">
              <option value="ZELLE">Zelle</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="font-body text-sm font-medium text-vm-text" htmlFor="pay-memo">
            Memo
            <input id="pay-memo" className="mt-1 min-h-11 w-full rounded-[10px] border border-gray-300 px-3" placeholder="Optional" readOnly={sample} />
          </label>
        </div>
        <button
          type="submit"
          disabled={sample}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-bold text-white outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-50"
        >
          Record payment
        </button>
      </form>
    </div>
  );
}
