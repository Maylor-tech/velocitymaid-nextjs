import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Sparkles, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    code: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Referral Link - VelocityMaid New Jersey`,
    description: 'Get $20 off your first cleaning with this referral link!',
  };
}

export default async function ReferralPage({ params }: PageProps) {
  const { code } = params;

  // Find referral link
  const referralLink = await prisma.referralLink.findUnique({
    where: { code },
    include: {
      customer: true,
      branch: true,
    },
  });

  if (!referralLink || !referralLink.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#0A3D2F] mb-4">Invalid Referral Link</h1>
          <p className="text-gray-600 mb-6">This referral link is invalid or has expired.</p>
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
            name: 'VelocityMaid Referral Discount',
            description: 'Get $20 off your first cleaning with this referral link',
            price: '20',
            priceCurrency: 'USD',
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
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              Get $20 OFF your first VelocityMaid cleaning
            </p>
          </div>

          <div className="bg-white text-[#0A3D2F] rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <div className="text-center mb-8">
              <div className="bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl inline-block mb-6">
                <div className="text-5xl font-bold">$20</div>
                <div className="text-xl font-semibold">OFF First Clean</div>
              </div>
              <p className="text-lg text-gray-700 mb-6">
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
                    <p className="text-gray-600">Your $20 discount will be automatically applied</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#0A3D2F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Complete your booking</h3>
                    <p className="text-gray-600">Enjoy professional cleaning at a discounted rate</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#0A3D2F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Your friend gets $20 too!</h3>
                    <p className="text-gray-600">They'll receive a $20 credit for referring you</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href={bookingUrl}
                className="btn-jamaica inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                Book Now - $20 OFF
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-gray-600 mt-4">
                Discount automatically applied at checkout
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-lg mb-4">
              <strong>Referral Code:</strong> <code className="bg-white/20 px-3 py-1 rounded">{code}</code>
            </p>
            <p className="text-sm text-gray-300">
              This code will be automatically applied when you book
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

