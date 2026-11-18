/* eslint-disable react/no-unescaped-entities */
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    code: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Referral Link - VelocityMaid New Jersey`,
    description: 'A referral link for VelocityMaid cleaning.',
  };
}

export default async function ReferralPage({ params }: PageProps) {
  const { code } = params;

  // Find referral link
  const referralLink = (await prisma.referralLink.findUnique({
    where: { code },
    include: {
      customer: true,
      branch: true,
    },
  } as never)) as unknown as {
    isActive: boolean;
    branch: { slug: string };
    customer: { firstName: string | null };
  } | null;

  if (!referralLink || !referralLink.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#0A3D2F] mb-4">Invalid Referral Link</h1>
          <p className="text-vm-muted mb-6">This referral link is invalid or has expired.</p>
          <Link
            href="/booking?branch=new-jersey"
            className="btn-jamaica inline-flex items-center gap-2"
          >
            Book a Cleaning
          </Link>
        </div>
      </div>
    );
  }

  const bookingUrl = `/booking?branch=${referralLink.branch.slug}&ref=${code}`;

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Offer',
            name: 'VelocityMaid Referral',
            description: 'A referral link for VelocityMaid cleaning',
            url: `https://velocitymaid.com/ref/${code}`,
          }),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <Gift className="w-20 h-20 text-[#F8C548] mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              You've Been Referred!
            </h1>
            <p className="text-xl md:text-2xl text-vm-muted mb-8">
              Book a VelocityMaid cleaning with this referral
            </p>
          </div>

          <div className="bg-white text-[#0A3D2F] rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <div className="text-center mb-8">
              <div className="bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl inline-block mb-6">
                <div className="text-2xl font-bold">Referral saved</div>
              </div>
              <p className="text-lg text-vm-text mb-6">
                Your friend {referralLink.customer.firstName} referred you to VelocityMaid!
              </p>
            </div>

            <div className="bg-[#F3F1EB] rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#0A3D2F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Click "Book Now" below</h3>
                    <p className="text-vm-muted">This referral stays attached to the booking link</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#0A3D2F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Complete your booking</h3>
                    <p className="text-vm-muted">We confirm the price before service</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#0A3D2F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Your friend is credited after the clean</h3>
                    <p className="text-vm-muted">The referral is recorded on the completed booking</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href={bookingUrl}
                className="btn-jamaica inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                Book now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-vm-muted mt-4">
                We reply within one business day.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-lg mb-4">
              <strong>Referral Code:</strong> <code className="bg-white/20 px-3 py-1 rounded">{code}</code>
            </p>
            <p className="text-sm text-vm-muted">
              This code will be automatically applied when you book
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


