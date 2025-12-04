import { Metadata } from 'next';
import { Star, QrCode, ExternalLink, Sparkles, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Leave a Review - VelocityMaid New Jersey',
  description: 'Share your experience with VelocityMaid New Jersey. Leave a Google review and help us serve you better!',
  openGraph: {
    title: 'Leave a Review - VelocityMaid New Jersey',
    description: 'Share your experience with VelocityMaid New Jersey',
    url: 'https://velocitymaid.com/review-us/new-jersey',
  },
};

// Google Review URL for New Jersey branch
const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL || 'https://g.page/r/YOUR_GOOGLE_REVIEW_URL';

export default function ReviewUsPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'VelocityMaid New Jersey',
            description: 'Professional cleaning services in New Jersey',
            url: 'https://velocitymaid.com/locations/new-jersey',
          }),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-[#F8C548]" />
              <span className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                VelocityMaid
              </span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Star className="w-20 h-20 text-[#F8C548] mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Thank You! 🙏
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              We'd love to hear about your experience with VelocityMaid New Jersey
            </p>
          </div>

          {/* Review Card */}
          <div className="bg-white text-[#0A3D2F] rounded-2xl shadow-2xl p-8 md:p-12 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                Leave Us a Google Review
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Your feedback helps us improve and helps other customers find great cleaning services
              </p>
            </div>

            {/* Google Review Button */}
            <div className="text-center mb-8">
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#4285F4] hover:bg-[#357AE8] text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Leave a Google Review
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            {/* QR Code */}
            <div className="text-center mb-8">
              <div className="inline-block bg-gray-100 p-4 rounded-xl">
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-4 border-[#F8C548]">
                  <Image
                    src="/brand/nj/reviews/qr.png"
                    alt="Review QR Code"
                    width={200}
                    height={200}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback if QR code doesn't exist
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="text-center p-4">
                            <QrCode class="w-24 h-24 text-[#0A3D2F] mx-auto mb-2" />
                            <p class="text-sm text-gray-600">Scan to review</p>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">Scan QR code to leave a review</p>
            </div>

            {/* Thank You Message */}
            <div className="bg-[#F3F1EB] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-3 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                We Appreciate Your Feedback
              </h3>
              <p className="text-gray-700 mb-4">
                Your review helps us:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Improve our services</li>
                <li>Help other customers make informed decisions</li>
                <li>Recognize our amazing cleaning team</li>
              </ul>
            </div>

            {/* Referral Link (Optional) */}
            <div className="bg-[#F8C548] text-[#0A3D2F] rounded-xl p-6 text-center">
              <Gift className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                Refer a Friend & Get $20
              </h3>
              <p className="mb-4">
                Love our service? Refer a friend and you both get $20 off!
              </p>
              <Link
                href="/customer/referrals"
                className="inline-block bg-[#0A3D2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#083025] transition"
              >
                Get Your Referral Link
              </Link>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center text-gray-300">
            <Link href="/locations/new-jersey" className="hover:text-white transition">
              Back to New Jersey Page
            </Link>
            <span className="mx-4">•</span>
            <Link href="/booking?branch=new-jersey" className="hover:text-white transition">
              Book Another Cleaning
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

