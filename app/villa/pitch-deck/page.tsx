import { Metadata } from 'next';
import { Download, Presentation, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Villa Partnership Pitch Deck | VelocityMaid Jamaica',
  description: 'Download the official VelocityMaid Jamaica Villa Partnership pitch deck. Professional presentation for vacation rental owners and property managers.',
  openGraph: {
    title: 'Villa Partnership Pitch Deck | VelocityMaid Jamaica',
    description: 'Professional presentation for vacation rental owners and property managers.',
    url: 'https://velocitymaid.com/villa/pitch-deck',
    siteName: 'VelocityMaid',
    type: 'website',
  },
};

export default function VillaPitchDeckPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Presentation className="w-20 h-20 text-[#F8C548] mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Villa Partnership Pitch Deck
          </h1>
          <p className="text-xl md:text-2xl text-[#F3F1EB] mb-8">
            Professional presentation for vacation rental owners and property managers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/api/villa/pitch-deck"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-jamaica inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Pitch Deck
            </a>
            <Link
              href="/villa-partnership/apply"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2B70C9] text-white rounded-xl font-semibold hover:bg-[#1e5aa8] transition-colors text-lg border-2 border-white"
            >
              Apply for Partnership
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8 text-center" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            What's Included
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#F8C548]">
              <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Slide 1-2</h3>
              <p className="text-vm-text">Cover page and company introduction</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#2B70C9]">
              <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Slide 3-4</h3>
              <p className="text-vm-text">Why villas need professional turnovers and our 6-step system</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#F8C548]">
              <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Slide 5-6</h3>
              <p className="text-vm-text">Quality standards and transparent pricing (JMD)</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#2B70C9]">
              <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Slide 7-8</h3>
              <p className="text-vm-text">Partnership benefits and customer testimonials</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#F8C548]">
              <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Slide 9-10</h3>
              <p className="text-vm-text">Coverage areas and call to action</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#2B70C9]">
              <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Slide 11</h3>
              <p className="text-vm-text">Contact information and QR codes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8 text-center" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            How to Use This Pitch Deck
          </h2>
          <div className="bg-[#F3F1EB] rounded-xl p-8">
            <ol className="space-y-4 text-vm-text list-decimal list-inside">
              <li className="text-lg">
                <strong>Download the pitch deck</strong> using the button above
              </li>
              <li className="text-lg">
                <strong>Open in your browser</strong> - The deck will open as an HTML document
              </li>
              <li className="text-lg">
                <strong>Print to PDF</strong> - Press Ctrl+P (or Cmd+P on Mac) and select "Save as PDF"
              </li>
              <li className="text-lg">
                <strong>Present or share</strong> - Use the PDF for in-person meetings, email outreach, or digital presentations
              </li>
              <li className="text-lg">
                <strong>Customize if needed</strong> - Add your property name, specific requirements, or custom pricing
              </li>
            </ol>
            <div className="mt-8 p-4 bg-white rounded-lg border-2 border-[#F8C548]">
              <p className="text-sm text-vm-text">
                <strong>Pro Tip:</strong> For best results, use landscape orientation when printing. The deck is designed 
                for 11" x 8.5" (letter landscape) format, perfect for presentations and screen sharing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Ready to Partner With Us?
          </h2>
          <p className="text-xl text-[#F3F1EB] mb-8">
            Download the pitch deck, review it, and apply for partnership today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/api/villa/pitch-deck"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-jamaica inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Pitch Deck
            </a>
            <Link
              href="/villa-partnership/apply"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2B70C9] text-white rounded-xl font-semibold hover:bg-[#1e5aa8] transition-colors text-lg border-2 border-white"
            >
              <FileText className="w-5 h-5" />
              Apply Now
            </Link>
            <a
              href="https://wa.me/18765551985?text=Hi%20VelocityMaid,%20I'd%20like%20to%20learn%20more%20about%20the%20Villa%20Partnership%20Program."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-vm-success text-white rounded-xl font-semibold hover:bg-vm-success transition-colors text-lg"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}


