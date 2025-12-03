import type { Metadata } from "next";
import { Sparkles, FileText, Scale, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Terms of Service | VelocityMaid",
  description: "VelocityMaid Terms of Service - Read our terms and conditions for using our cleaning services.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold">VelocityMaid</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Scale className="w-6 h-6 mr-2 text-primary-600" />
              Agreement to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and VelocityMaid ("we," "us," or "our") regarding your use of our website (velocitymaid.com) and cleaning services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using our website and services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              VelocityMaid provides professional home and apartment cleaning services throughout New Jersey. Our services include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Basic Cleaning</li>
              <li>Deep Cleaning</li>
              <li>Move In/Out Cleaning</li>
              <li>Add-On Services (Laundry, Windows, Oven, Refrigerator)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We operate from a remote operations base in Ludlow, Vermont, and serve customers throughout New Jersey.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Area</h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are available throughout New Jersey. By booking a service, you confirm that your service address is within our service area. We reserve the right to refuse service to locations outside our service area.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking and Payment</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Booking Process</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To book a service, you must provide accurate and complete information, including your name, contact information, service address, and service preferences. All bookings are subject to availability and confirmation.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Payment is required at the time of booking. We accept payment through our secure payment processor (Stripe). All prices are in U.S. dollars and are subject to change without notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Pricing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our base pricing is as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Basic Cleaning: $120</li>
              <li>Deep Cleaning: $220</li>
              <li>Move In/Out Cleaning: $320</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Add-on services are priced separately. Final pricing may vary based on home size, condition, and specific requirements. We will provide a clear estimate before service begins.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-primary-600" />
              Cancellation and Rescheduling
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may cancel or reschedule your service by contacting us at least 24 hours before the scheduled service time. Cancellations made less than 24 hours before service may be subject to a cancellation fee.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to cancel or reschedule services due to inclement weather, emergencies, or other circumstances beyond our control. In such cases, we will work with you to reschedule at your convenience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate and complete information when booking</li>
              <li>Ensure safe access to your property for our cleaning team</li>
              <li>Secure or remove valuable, fragile, or personal items before service</li>
              <li>Notify us of any special requirements, allergies, or safety concerns</li>
              <li>Be available or provide access instructions for scheduled services</li>
              <li>Treat our staff with respect and professionalism</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Satisfaction Guarantee</h2>
            <p className="text-gray-700 leading-relaxed">
              We stand behind our work. If you are not satisfied with our service, please contact us within 24 hours of service completion. We will return to address any concerns at no additional cost, subject to our review and approval.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the maximum extent permitted by law, VelocityMaid shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our total liability for any claims arising from or related to our services shall not exceed the amount you paid for the specific service giving rise to the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Insurance</h2>
            <p className="text-gray-700 leading-relaxed">
              VelocityMaid maintains general liability insurance. While we take every precaution to protect your property, you are responsible for securing or removing valuable items before service. We are not responsible for damage to items that should have been secured or removed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content on our website, including text, graphics, logos, images, and software, is the property of VelocityMaid or its content suppliers and is protected by United States and international copyright laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Uses</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may not use our services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of our services after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Vermont, without regard to its conflict of law provisions. Any disputes arising from these Terms or our services shall be resolved in the courts of Vermont.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>VelocityMaid</strong></p>
              <p className="text-gray-700 mb-2">79 Main Street, Apt 7</p>
              <p className="text-gray-700 mb-2">Ludlow, VT 05149, USA</p>
              <p className="text-gray-700 mb-2">Email: <a href="mailto:hello@velocitymaid.com" className="text-primary-600 hover:underline">hello@velocitymaid.com</a></p>
              <p className="text-gray-700">Phone: <a href="tel:+18027335348" className="text-primary-600 hover:underline">(802) 733-5348</a></p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/" className="text-primary-600 hover:text-primary-700">Home</Link>
            <Link href="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</Link>
            <Link href="/refunds" className="text-primary-600 hover:text-primary-700">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}




