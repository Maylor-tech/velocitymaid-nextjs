import type { Metadata } from "next";
import { Sparkles, Shield, Lock, Eye, FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Privacy Policy | VelocityMaid",
  description: "VelocityMaid Privacy Policy - Learn how we collect, use, and protect your personal information.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2 text-vm-cyan-dark hover:text-vm-cyan-dark">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold">VelocityMaid</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-vm-cyan-dark" />
            <h1 className="text-4xl font-bold text-vm-text">Privacy Policy</h1>
          </div>
          <p className="text-vm-muted">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4 flex items-center">
              <Lock className="w-6 h-6 mr-2 text-vm-cyan-dark" />
              Introduction
            </h2>
            <p className="text-vm-text leading-relaxed mb-4">
              VelocityMaid ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website velocitymaid.com and use our cleaning services.
            </p>
            <p className="text-vm-text leading-relaxed">
              By using our website and services, you consent to the data practices described in this policy. If you do not agree with the practices described in this policy, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4 flex items-center">
              <Eye className="w-6 h-6 mr-2 text-vm-cyan-dark" />
              Information We Collect
            </h2>
            <h3 className="text-xl font-semibold text-vm-text mb-3">Personal Information</h3>
            <p className="text-vm-text leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-vm-text space-y-2 mb-4">
              <li>Name and contact information (email address, phone number)</li>
              <li>Billing address and payment information (processed securely through Stripe)</li>
              <li>Service address and property details</li>
              <li>Service preferences and special instructions</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-vm-text mb-3">Automatically Collected Information</h3>
            <p className="text-vm-text leading-relaxed mb-4">
              When you visit our website, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 text-vm-text space-y-2">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4">How We Use Your Information</h2>
            <p className="text-vm-text leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-vm-text space-y-2">
              <li>Process and fulfill your booking requests</li>
              <li>Communicate with you about your services, including confirmations and reminders</li>
              <li>Process payments and prevent fraud</li>
              <li>Improve our website and services</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4">Information Sharing and Disclosure</h2>
            <p className="text-vm-text leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-vm-text space-y-2">
              <li><strong>Service Providers:</strong> We share information with trusted third-party service providers who assist us in operating our website and conducting our business (e.g., payment processors, email service providers)</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
              <li><strong>With Your Consent:</strong> We may share information with your explicit consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4">Data Security</h2>
            <p className="text-vm-text leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4">Your Rights and Choices</h2>
            <p className="text-vm-text leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-vm-text space-y-2">
              <li>Access and receive a copy of your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Object to processing of your personal information</li>
            </ul>
            <p className="text-vm-text leading-relaxed mt-4">
              To exercise these rights, please contact us at <a href="mailto:hello@velocitymaid.com" className="text-vm-cyan-dark hover:underline">hello@velocitymaid.com</a> or call us at <a href="tel:+18027335348" className="text-vm-cyan-dark hover:underline">(802) 733-5348</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-vm-text leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4">Children's Privacy</h2>
            <p className="text-vm-text leading-relaxed">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4">Changes to This Privacy Policy</h2>
            <p className="text-vm-text leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-vm-text mb-4">Contact Us</h2>
            <p className="text-vm-text leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-vm-text mb-2"><strong>VelocityMaid</strong></p>
              <p className="text-vm-text mb-2">79 Main Street, Apt 7</p>
              <p className="text-vm-text mb-2">Ludlow, VT 05149, USA</p>
              <p className="text-vm-text mb-2">Email: <a href="mailto:hello@velocitymaid.com" className="text-vm-cyan-dark hover:underline">hello@velocitymaid.com</a></p>
              <p className="text-vm-text">Phone: <a href="tel:+18027335348" className="text-vm-cyan-dark hover:underline">(802) 733-5348</a></p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/" className="text-vm-cyan-dark hover:text-vm-cyan-dark">Home</Link>
            <Link href="/terms" className="text-vm-cyan-dark hover:text-vm-cyan-dark">Terms of Service</Link>
            <Link href="/refunds" className="text-vm-cyan-dark hover:text-vm-cyan-dark">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}





