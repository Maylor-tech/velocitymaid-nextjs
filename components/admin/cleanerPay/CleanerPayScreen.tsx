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

type CleanerPayScreenProps = {
  cleanerName: string;
  lines: CleanerPayLine[];
  payments: CleanerPayEntry[];
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
