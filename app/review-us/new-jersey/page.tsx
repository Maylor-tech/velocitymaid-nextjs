"use client";

import { useState } from 'react';
import { Star, QrCode, ExternalLink, Sparkles, Gift } from 'lucide-react';
import Link from 'next/link';



export default function ReviewUsPage() {

  const [imageError, setImageError] = useState(false);

  const GOOGLE_REVIEW_URL =

    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL || "#";



  return (

    <div className="min-h-screen bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white">

      {/* Header */}

      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          <Link href="/" className="flex items-center space-x-2">

            <Sparkles className="w-8 h-8 text-[#F8C548]" />

            <span className="text-2xl font-bold">VelocityMaid</span>

          </Link>

        </div>

      </header>



      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="text-center mb-12">

          <Star className="w-20 h-20 text-[#F8C548] mx-auto mb-6" />

          <h1 className="text-5xl md:text-6xl font-bold mb-4">Thank You! 🙏</h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-8">

            We'd love to hear about your experience with VelocityMaid New Jersey

          </p>

        </div>



        {/* Review Button */}

        <div className="bg-white text-[#0A3D2F] rounded-2xl shadow-2xl p-8 md:p-12 mb-8">

          <div className="text-center mb-8">

            <h2 className="text-3xl font-bold mb-4">

              Leave Us a Google Review

            </h2>

            <p className="text-lg text-gray-700 mb-6">

              Your feedback helps us improve and helps other customers find great services

            </p>

          </div>



          <div className="text-center mb-8">

            <a

              href={GOOGLE_REVIEW_URL}

              target="_blank"

              rel="noopener noreferrer"

              className="inline-flex items-center gap-3 bg-[#4285F4] hover:bg-[#357AE8] text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg"

            >

              Leave a Google Review

              <ExternalLink className="w-5 h-5" />

            </a>

          </div>



          <div className="text-center mb-8">

            <div className="inline-block bg-gray-100 p-4 rounded-xl">

              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-4 border-[#F8C548]">

                {!imageError ? (

                  <img

                    src="/brand/nj/reviews/qr.png"

                    alt="Review QR Code"

                    width={200}

                    height={200}

                    className="object-contain w-full h-full"

                    onError={() => setImageError(true)}

                  />

                ) : (

                  <div className="text-center p-4">

                    <QrCode className="w-24 h-24 text-[#0A3D2F] mx-auto mb-2" />

                    <p className="text-sm text-gray-600">Scan to review</p>

                  </div>

                )}

              </div>

            </div>

            <p className="text-sm text-gray-600 mt-4">

              Scan QR code to leave a review

            </p>

          </div>



          <div className="bg-[#F3F1EB] rounded-xl p-6 mb-6 text-[#0A3D2F]">

            <h3 className="text-xl font-bold mb-3">We Appreciate Your Feedback</h3>

            <ul className="list-disc list-inside space-y-2 text-gray-700">

              <li>Improve our services</li>

              <li>Help others choose VelocityMaid</li>

              <li>Recognize our amazing team</li>

            </ul>

          </div>



          <div className="bg-[#F8C548] text-[#0A3D2F] rounded-xl p-6 text-center">

            <Gift className="w-12 h-12 mx-auto mb-3" />

            <h3 className="text-xl font-bold mb-2">Refer a Friend & Get $20</h3>

            <Link

              href="/customer/referrals"

              className="inline-block bg-[#0A3D2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#083025]"

            >

              Get Your Referral Link

            </Link>

          </div>

        </div>



        <div className="text-center text-gray-300">

          <Link href="/locations/new-jersey" className="hover:text-white">

            Back to New Jersey Page

          </Link>

        </div>

      </div>

    </div>

  );

}
