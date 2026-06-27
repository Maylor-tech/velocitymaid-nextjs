'use client';

import { CheckCircle2, Home } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';

export default function CleanerApplySuccess() {
  return (
    <div className="min-h-screen bg-vm-surface">
      <header className="bg-vm-navy px-6 py-5">
        <Link href="/">
          <BrandLogo theme="dark" size="header" showTagline={false} />
        </Link>
      </header>

      <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-8">
        <div className="w-full max-w-xl rounded-2xl border border-vm-border bg-vm-white p-8 text-center shadow-sm sm:p-12">
          <CheckCircle2 className="mx-auto h-16 w-16 text-vm-success" />
          <h1 className="mt-6 font-heading text-2xl font-bold text-vm-navy sm:text-3xl">
            Thank you for applying to VelocityMaid
          </h1>
          <p className="mx-auto mt-4 max-w-md font-body text-base leading-relaxed text-vm-muted">
            Your application has been received. If selected, the next step will be the{' '}
            <strong className="text-vm-navy">VelocityMaid Certification Program</strong>.
          </p>
          <div className="mt-8 rounded-xl border border-vm-border bg-vm-surface p-5 text-left">
            <h2 className="font-heading text-sm font-semibold text-vm-navy">What happens next</h2>
            <ul className="mt-2 space-y-1.5 font-body text-sm text-vm-muted">
              <li>• Our talent team reviews every application within 2–3 business days</li>
              <li>• Strong candidates are invited to certification training</li>
              <li>• You&apos;ll receive email updates at the address you provided</li>
            </ul>
          </div>
          <Link
            href="/"
            className="btn-tactile mt-8 inline-flex items-center gap-2 rounded-lg bg-vm-navy px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider text-vm-white hover:bg-vm-navy/90"
          >
            <Home className="h-4 w-4" />
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
