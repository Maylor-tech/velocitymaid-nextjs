import { CheckCircle, Home, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function VillaPartnershipApplySuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-vm-surface to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-vm-text mb-4">
          Application Submitted Successfully!
        </h1>
        <p className="text-lg text-vm-muted mb-8">
          Thank you for your interest in the VelocityMaid Villa Partnership Program. We've received your application and will review it carefully.
        </p>
        <p className="text-vm-text mb-8">
          Our team will contact you via WhatsApp within 24-48 hours to discuss your partnership needs and answer any questions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/villa-partnership"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-vm-navy text-white rounded-lg font-semibold hover:bg-vm-navy transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Partnership Page
          </Link>
          <a
            href="https://wa.me/18765551985?text=Hi%20VelocityMaid,%20I%20just%20submitted%20a%20villa%20partnership%20application."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-vm-success text-white rounded-lg font-semibold hover:bg-vm-success transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}


