import type { Metadata } from 'next';
import { BrandLogo } from '@/components/brand';
import TipFlow from '@/components/tip/TipFlow';

export const metadata: Metadata = {
  title: 'Leave a Tip | VelocityMaid',
  description: 'Thank your VelocityMaid cleaner with an optional tip.',
};

export default function TipPage({
  searchParams,
}: {
  searchParams: { jobId?: string };
}) {
  return (
    <div className="min-h-screen bg-vm-navy">
      <header className="py-5 px-6">
        <BrandLogo theme="dark" size="header" showTagline={false} />
      </header>
      <main className="flex flex-col items-center justify-center px-4 py-12">
        <TipFlow jobId={searchParams.jobId ?? null} />
      </main>
    </div>
  );
}
