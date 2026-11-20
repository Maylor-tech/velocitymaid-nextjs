import { CleanerPayScreen } from '@/components/admin/cleanerPay/CleanerPayScreen';
import { notFound } from 'next/navigation';

const lines = [
  {
    cleaner: 'Dorothy Staging',
    job: 'VM-STAGING-COMP-SOLO',
    date: 'Nov 18, 2026',
    method: 'Percentage',
    rate: '65%',
    hours: '—',
    expected: '$253.50',
    paid: '$0.00',
    balance: '$253.50',
    status: 'Owed',
  },
  {
    cleaner: 'Dorothy Staging',
    job: 'VM-STAGING-COMP-ASSIST',
    date: 'Nov 18, 2026',
    method: 'Hourly',
    rate: '$30 per hour',
    hours: '4.5',
    expected: '$135.00',
    paid: '$0.00',
    balance: '$135.00',
    status: 'Owed',
  },
  {
    cleaner: 'Dorothy Staging',
    job: 'VM-STAGING-COMP-HOURS',
    date: 'Nov 19, 2026',
    method: 'Hourly',
    rate: '$30 per hour',
    hours: 'Not verified',
    expected: '—',
    paid: '—',
    balance: '—',
    status: 'Needs hours',
  },
  {
    cleaner: 'Dorothy Staging',
    job: 'VM-STAGING-COMP-PAID',
    date: 'Nov 17, 2026',
    method: 'Percentage',
    rate: '65%',
    hours: '—',
    expected: '$253.50',
    paid: '$253.50',
    balance: '$0.00',
    status: 'Paid manually',
  },
];

export default function CleanerPayVisualPage() {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') notFound();
  return (
    <main className="min-h-screen bg-vm-canvas">
      <CleanerPayScreen
        cleanerName="Dorothy Staging"
        sample
        lines={lines}
        payments={[
          {
            date: 'Nov 17, 2026',
            amount: '$253.50',
            method: 'Zelle',
            memo: 'Staging test — disregard',
            allocated: 'Allocated to VM-STAGING-COMP-PAID',
          },
        ]}
      />
    </main>
  );
}
