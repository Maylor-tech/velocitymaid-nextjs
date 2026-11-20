import { CleanerPayScreen } from '@/components/admin/cleanerPay/CleanerPayScreen';
import { HomeSizeExceptionForm } from '@/components/admin/cleanerPay/HomeSizeExceptionForm';
import { notFound } from 'next/navigation';

const lines = [
  {
    cleaner: 'Dory (Dori)',
    job: 'VM-2026-0015',
    date: 'Aug 17, 2026',
    method: 'Historical as paid',
    rate: '—',
    hours: '—',
    expected: '$100.00',
    paid: '$100.00',
    balance: '$0.00',
    status: 'Paid manually',
  },
  {
    cleaner: 'Dory (Dori)',
    job: 'VM-2026-0031',
    date: 'Aug 31, 2026',
    method: 'Historical as paid',
    rate: '—',
    hours: '—',
    expected: '$170.00',
    paid: '$170.00',
    balance: '$0.00',
    status: 'Paid manually',
  },
  {
    cleaner: 'Dory (Dori)',
    job: 'VM-2026-0033',
    date: 'Aug 30, 2026',
    method: 'Historical as paid',
    rate: '—',
    hours: '—',
    expected: '$57.41',
    paid: '$57.41',
    balance: '$0.00',
    status: 'Paid manually',
  },
];

export default function CleanerPayVisualPage() {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    notFound();
  }

  return (
    <CleanerPayScreen
      sample
      cleanerName="Dory (Dori)"
      lines={lines}
      termsLabel="Terms from Oct 9, 2026: solo 65% · assisted $30 per hour. No home-size exception. No add-on pay rule."
      w9Label="Tax paperwork is missing. Solo percentage offers stay blocked. Assisted hourly is allowed."
      exceptionForm={<HomeSizeExceptionForm sample exception={null} />}
      ytd={{ total: '$360.00', threshold: '$2,000.00', warnAt: '$1,600.00', warning: false }}
      advances={[
        {
          date: 'Aug 31, 2026',
          amount: '$32.59',
          memo: 'TDS reset / advance',
          applied: 'Not applied to a job',
        },
      ]}
      reimbursements={[
        {
          person: 'Caryll',
          amount: '$100.00',
          detail: 'Aug 17, 2026 · Personal funds · listed once',
        },
      ]}
      unmatched={[
        {
          cleaner: 'Aurora Burroughs',
          amount: '$90.00',
          reference: 'MATCH:354 Grout Road 2026-10-27',
          basis: 'Hourly 3h × $30',
        },
      ]}
      payments={[
        {
          date: 'Aug 17, 2026',
          amount: '$100.00',
          method: 'Zelle',
          memo: 'Personal funds · Caryll',
          allocated: 'Allocated to VM-2026-0015',
        },
        {
          date: 'Aug 31, 2026',
          amount: '$260.00',
          method: 'Zelle',
          memo: 'Business account · VelocityMaid Chase',
          allocated: 'Allocated $170.00 + $57.41 + $32.59 advance',
        },
      ]}
    />
  );
}
