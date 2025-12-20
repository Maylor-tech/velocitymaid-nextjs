import { Metadata } from 'next';
import { Building2, FileText, CheckCircle2, Download, ArrowRight, Sparkles, Star, Users, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import CorporateQuoteForm from './components/CorporateQuoteForm';

export const metadata: Metadata = {
  title: 'Corporate Cleaning Services New Jersey | VelocityMaid',
  description: 'Professional office cleaning, salon cleaning, and restaurant cleaning services in New Jersey. Customized commercial cleaning solutions for your business.',
  keywords: 'office cleaning new jersey, commercial cleaning nj, salon cleaning, restaurant cleaning, corporate cleaning services',
  openGraph: {
    title: 'Corporate Cleaning Services New Jersey | VelocityMaid',
    description: 'Professional commercial cleaning solutions for offices, salons, and restaurants in New Jersey',
    url: 'https://velocitymaid.com/corporate/nj',
    siteName: 'VelocityMaid',
    type: 'website',
  },
};

export default function CorporateNJPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'VelocityMaid Corporate Cleaning Services',
            description: 'Professional commercial cleaning services for offices, salons, and restaurants',
            provider: {
              '@type': 'LocalBusiness',
              name: 'VelocityMaid New Jersey',
              address: {
                '@type': 'PostalAddress',
                addressRegion: 'NJ',
                addressCountry: 'US',
              },
            },
            areaServed: {
              '@type': 'State',
              name: 'New Jersey',
            },
            serviceType: 'Commercial Cleaning',
          }),
        }}
      />

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <Sparkles className="w-8 h-8 text-[#0A3D2F]" />
                <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  VelocityMaid
                </span>
              </Link>
              <Link
                href="/booking?branch=new-jersey"
                className="bg-[#0A3D2F] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#083025] transition"
              >
                Book Now
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Building2 className="w-20 h-20 text-[#F8C548] mx-auto mb-6" />
              <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                Corporate Cleaning Services
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8">
                Professional commercial cleaning for New Jersey businesses
              </p>
              <Link
                href="#quote"
                className="bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#F5B835] transition shadow-lg inline-block"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Our Corporate Services
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white border-2 border-[#0A3D2F] rounded-xl p-8 text-center">
                <Building2 className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Office Cleaning
                </h3>
                <p className="text-gray-600 mb-6">
                  Comprehensive office cleaning including workstations, restrooms, break rooms, and common areas.
                </p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li>✓ Desk and workstation cleaning</li>
                  <li>✓ Restroom sanitization</li>
                  <li>✓ Floor vacuuming and mopping</li>
                  <li>✓ Trash removal</li>
                </ul>
                <a
                  href="/api/brand/nj/corporate/office-contract"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0A3D2F] font-semibold hover:underline inline-flex items-center gap-2"
                >
                  View Contract <FileText className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-white border-2 border-[#0A3D2F] rounded-xl p-8 text-center">
                <Users className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Salon & Barbershop
                </h3>
                <p className="text-gray-600 mb-6">
                  Specialized cleaning for salons and barbershops with focus on sanitization and hair removal.
                </p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li>✓ Station sanitization</li>
                  <li>✓ Tool cleaning areas</li>
                  <li>✓ Floor hair removal</li>
                  <li>✓ Health compliance</li>
                </ul>
                <a
                  href="/api/brand/nj/corporate/salon-contract"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0A3D2F] font-semibold hover:underline inline-flex items-center gap-2"
                >
                  View Contract <FileText className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-white border-2 border-[#0A3D2F] rounded-xl p-8 text-center">
                <Clock className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Restaurant Nightly
                </h3>
                <p className="text-gray-600 mb-6">
                  After-hours deep cleaning for restaurants, ensuring compliance with health regulations.
                </p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li>✓ Kitchen deep cleaning</li>
                  <li>✓ Dining area cleaning</li>
                  <li>✓ Floor scrubbing</li>
                  <li>✓ Health department compliance</li>
                </ul>
                <a
                  href="/api/brand/nj/corporate/restaurant-contract"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0A3D2F] font-semibold hover:underline inline-flex items-center gap-2"
                >
                  View Contract <FileText className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Table */}
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Corporate Pricing
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0A3D2F] text-white">
                      <th className="p-4 text-left font-bold">Service Type</th>
                      <th className="p-4 text-left font-bold">Size</th>
                      <th className="p-4 text-left font-bold">Weekly</th>
                      <th className="p-4 text-left font-bold">Monthly</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-4 font-semibold">Office</td>
                      <td className="p-4">Up to 2,500 sq ft</td>
                      <td className="p-4 text-[#F8C548] font-bold">$400</td>
                      <td className="p-4 text-[#F8C548] font-bold">$1,200</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="p-4 font-semibold">Office</td>
                      <td className="p-4">2,501 - 5,000 sq ft</td>
                      <td className="p-4 text-[#F8C548] font-bold">$750</td>
                      <td className="p-4 text-[#F8C548] font-bold">$2,200</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-4 font-semibold">Salon</td>
                      <td className="p-4">1-3 Stations</td>
                      <td className="p-4 text-[#F8C548] font-bold">$180</td>
                      <td className="p-4 text-[#F8C548] font-bold">$520</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="p-4 font-semibold">Salon</td>
                      <td className="p-4">4-6 Stations</td>
                      <td className="p-4 text-[#F8C548] font-bold">$320</td>
                      <td className="p-4 text-[#F8C548] font-bold">$960</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-4 font-semibold">Restaurant</td>
                      <td className="p-4">Up to 1,500 sq ft</td>
                      <td className="p-4 text-[#F8C548] font-bold">$250/night</td>
                      <td className="p-4 text-[#F8C548] font-bold">$4,000</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-4 font-semibold">Restaurant</td>
                      <td className="p-4">1,501 - 3,000 sq ft</td>
                      <td className="p-4 text-[#F8C548] font-bold">$400/night</td>
                      <td className="p-4 text-[#F8C548] font-bold">$6,400</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-8 p-4 bg-[#F8C548] rounded-lg text-center">
                <p className="text-[#0A3D2F] font-bold">
                  Custom pricing available for larger spaces and special requirements
                </p>
              </div>
              <div className="mt-4 text-center">
                <a
                  href="/api/brand/nj/corporate/pricing-sheet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#0A3D2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#083025] transition"
                >
                  <Download className="w-5 h-5" />
                  Download Full Pricing Sheet
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Checklist Preview */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Our Cleaning Standards
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#F3F1EB] rounded-xl p-8">
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Office Cleaning Checklist
                </h3>
                <ul className="space-y-3 mb-6">
                  {['Workstations & desks', 'Restrooms', 'Common areas', 'Break rooms', 'Floors & baseboards', 'Trash removal'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/api/brand/nj/corporate/office-checklist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#0A3D2F] font-semibold hover:underline"
                >
                  View Full Checklist <FileText className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-[#F3F1EB] rounded-xl p-8">
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Salon Cleaning Checklist
                </h3>
                <ul className="space-y-3 mb-6">
                  {['Station sanitization', 'Floor hair removal', 'Restrooms', 'Reception area', 'Mirror cleaning', 'Health compliance'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/api/brand/nj/corporate/salon-checklist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#0A3D2F] font-semibold hover:underline"
                >
                  View Full Checklist <FileText className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Why Choose VelocityMaid?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Shield className="w-12 h-12 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Insured & Bonded
                </h3>
                <p className="text-gray-600">Fully insured and bonded for your protection</p>
              </div>
              <div className="text-center">
                <Star className="w-12 h-12 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Quality Guaranteed
                </h3>
                <p className="text-gray-600">100% satisfaction guarantee on all services</p>
              </div>
              <div className="text-center">
                <Clock className="w-12 h-12 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Flexible Scheduling
                </h3>
                <p className="text-gray-600">Customized schedules to fit your business needs</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Form */}
        <section id="quote" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Request a Quote
            </h2>
            <CorporateQuoteForm />
          </div>
        </section>

        {/* Downloads Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Download Resources
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Services Overview', route: '/api/brand/nj/corporate/services-overview', icon: FileText },
                { name: 'Pricing Sheet', route: '/api/brand/nj/corporate/pricing-sheet', icon: Download },
                { name: 'Office Contract', route: '/api/brand/nj/corporate/office-contract', icon: FileText },
                { name: 'Salon Contract', route: '/api/brand/nj/corporate/salon-contract', icon: FileText },
                { name: 'Restaurant Contract', route: '/api/brand/nj/corporate/restaurant-contract', icon: FileText },
                { name: 'Office Checklist', route: '/api/brand/nj/corporate/office-checklist', icon: CheckCircle2 },
                { name: 'Salon Checklist', route: '/api/brand/nj/corporate/salon-checklist', icon: CheckCircle2 },
              ].map((doc, index) => (
                <a
                  key={index}
                  href={doc.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#F8C548] hover:shadow-lg transition"
                >
                  <doc.icon className="w-8 h-8 text-[#0A3D2F] mb-4" />
                  <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                    {doc.name}
                  </h3>
                  <p className="text-gray-600 text-sm">Download PDF</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}


