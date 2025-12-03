import type { Metadata } from "next";
import { Sparkles, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Refund Policy | VelocityMaid",
  description: "VelocityMaid Refund Policy - Learn about our refund and cancellation policies.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundPolicy() {
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
            <RefreshCw className="w-8 h-8 text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">Refund Policy</h1>
          </div>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At VelocityMaid, we are committed to providing exceptional cleaning services. This Refund Policy outlines the circumstances under which refunds may be issued and our procedures for handling refund requests.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By booking our services, you agree to this Refund Policy. Please read it carefully before making a booking.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
              Satisfaction Guarantee
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We stand behind our work with a 100% satisfaction guarantee. If you are not completely satisfied with our cleaning service, we will return to address any concerns at no additional cost.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700">
                <strong>To request a re-cleaning:</strong> Contact us within 24 hours of service completion at <a href="mailto:hello@velocitymaid.com" className="text-primary-600 hover:underline">hello@velocitymaid.com</a> or <a href="tel:+18027335348" className="text-primary-600 hover:underline">(802) 733-5348</a>. We will schedule a return visit to address any areas of concern.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-primary-600" />
              Cancellation Policy
            </h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Cancellation by Customer</h3>
            <div className="space-y-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">More than 24 hours before service:</p>
                <p className="text-gray-700">Full refund or reschedule at no charge</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">Less than 24 hours before service:</p>
                <p className="text-gray-700">50% refund or reschedule (subject to availability)</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">Same-day cancellation or no-show:</p>
                <p className="text-gray-700">No refund (service may be rescheduled for a fee)</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Cancellation by VelocityMaid</h3>
            <p className="text-gray-700 leading-relaxed">
              In rare circumstances, we may need to cancel your service due to inclement weather, emergencies, or other circumstances beyond our control. In such cases, you will receive a full refund or the option to reschedule at your convenience at no additional cost.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <XCircle className="w-6 h-6 mr-2 text-red-600" />
              Non-Refundable Situations
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Refunds will not be issued in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Services that have been completed to our standard specifications</li>
              <li>Customer fails to provide access to the property at the scheduled time</li>
              <li>Customer requests cancellation after our team has arrived at the property</li>
              <li>Damage to property that was not caused by our cleaning team</li>
              <li>Customer dissatisfaction due to pre-existing conditions or damage not related to cleaning</li>
              <li>Special requests or add-on services that were completed as requested</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Process</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Request a Refund</h3>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
              <li>Contact us within 24 hours of service completion (or before service for cancellations)</li>
              <li>Provide your booking reference number and reason for refund request</li>
              <li>We will review your request and respond within 2-3 business days</li>
              <li>If approved, refunds will be processed to the original payment method within 5-10 business days</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Refund Methods</h3>
            <p className="text-gray-700 leading-relaxed">
              Refunds will be issued to the original payment method used for the booking. Processing times may vary depending on your payment provider:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
              <li>Credit/Debit Cards: 5-10 business days</li>
              <li>Bank Transfers: 3-5 business days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Partial Refunds</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In some cases, we may offer partial refunds if:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Service was partially completed due to circumstances beyond our control</li>
              <li>Customer requests cancellation after service has begun</li>
              <li>Specific add-on services were not completed (refund for add-ons only)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Partial refund amounts will be determined on a case-by-case basis and will be proportional to the services not completed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Disputes and Resolution</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you are not satisfied with our refund decision, please contact us to discuss your concerns. We are committed to finding a fair resolution.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For payment disputes, you may also contact your payment provider or bank. However, we encourage you to contact us first so we can work together to resolve any issues.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Special Circumstances</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Recurring Services</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              For recurring cleaning services, you may cancel your subscription at any time. Cancellations made before the next scheduled service will not be charged. Services already completed are not eligible for refund.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Move In/Out Services</h3>
            <p className="text-gray-700 leading-relaxed">
              Move In/Out cleaning services are subject to the same refund policy. However, due to the time-sensitive nature of these services, cancellations made less than 48 hours before service may incur a higher cancellation fee.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about our Refund Policy or need to request a refund, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>VelocityMaid</strong></p>
              <p className="text-gray-700 mb-2">79 Main Street, Apt 7</p>
              <p className="text-gray-700 mb-2">Ludlow, VT 05149, USA</p>
              <p className="text-gray-700 mb-2">Email: <a href="mailto:hello@velocitymaid.com" className="text-primary-600 hover:underline">hello@velocitymaid.com</a></p>
              <p className="text-gray-700">Phone: <a href="tel:+18027335348" className="text-primary-600 hover:underline">(802) 733-5348</a></p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to update this Refund Policy at any time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of our services after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/" className="text-primary-600 hover:text-primary-700">Home</Link>
            <Link href="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</Link>
            <Link href="/terms" className="text-primary-600 hover:text-primary-700">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}




