import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, CheckCircle2, Download, FileText, ArrowRight, Shield, DollarSign, Clock, Star, Users } from 'lucide-react';
import PartnershipForm from './components/PartnershipForm';

export const metadata: Metadata = {
  title: 'Apartment Complex Partnership Program | VelocityMaid New Jersey',
  description: 'Partner with VelocityMaid New Jersey for professional cleaning services. Move-in/move-out cleaning, recurring services, and volume discounts for apartment complexes.',
  keywords: 'apartment cleaning partnership, property management cleaning, move-out cleaning NJ, apartment complex cleaning services',
  openGraph: {
    title: 'Apartment Complex Partnership Program | VelocityMaid New Jersey',
    description: 'Professional cleaning services for apartment complexes. Partnership pricing, dedicated support, and reliable service.',
    url: 'https://velocitymaid.com/partners/apartments',
    siteName: 'VelocityMaid',
    type: 'website',
  },
};

export default function ApartmentPartnersPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'VelocityMaid Apartment Complex Partnership',
            description: 'Professional cleaning services for apartment complexes and property management companies',
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
              <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                Apartment Complex Partnership Program
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8">
                Professional cleaning services for property managers and apartment complexes
              </p>
              <Link
                href="#contact"
                className="bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#F5B835] transition shadow-lg inline-block"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </section>

        {/* Proposal Summary */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Why Partner With VelocityMaid?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Enhanced Resident Satisfaction
                </h3>
                <p className="text-gray-600">Professional cleaning services increase resident satisfaction and retention rates.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Fast Turnaround
                </h3>
                <p className="text-gray-600">Quick move-out cleaning means faster apartment turnover and reduced vacancy time.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Volume Discounts
                </h3>
                <p className="text-gray-600">Partnership pricing provides significant savings compared to individual bookings.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Table */}
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Partnership Pricing
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-[#0A3D2F] mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                Move-In/Move-Out Cleaning
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0A3D2F] text-white">
                      <th className="p-4 text-left font-bold">Apartment Size</th>
                      <th className="p-4 text-left font-bold">Standard Rate</th>
                      <th className="p-4 text-left font-bold">Partnership Rate</th>
                      <th className="p-4 text-left font-bold">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-4 font-semibold">Studio/1 Bedroom</td>
                      <td className="p-4">$320</td>
                      <td className="p-4 text-[#F8C548] font-bold">$280</td>
                      <td className="p-4">$40 (12.5%)</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="p-4 font-semibold">2 Bedroom</td>
                      <td className="p-4">$380</td>
                      <td className="p-4 text-[#F8C548] font-bold">$330</td>
                      <td className="p-4">$50 (13.2%)</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-4 font-semibold">3 Bedroom</td>
                      <td className="p-4">$450</td>
                      <td className="p-4 text-[#F8C548] font-bold">$390</td>
                      <td className="p-4">$60 (13.3%)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-4 font-semibold">4+ Bedroom</td>
                      <td className="p-4">Custom Quote</td>
                      <td className="p-4 text-[#F8C548] font-bold">15% Discount</td>
                      <td className="p-4">Applied</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-8 p-4 bg-[#F8C548] rounded-lg text-center">
                <p className="text-[#0A3D2F] font-bold text-lg">
                  Additional discounts available for properties with 50+ units or guaranteed monthly volume
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Full Checklist */}
        <section id="checklist" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Complete Move-Out Cleaning Checklist
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Kitchen
                </h3>
                <ul className="space-y-2">
                  {['Inside all cabinets and drawers', 'Oven cleaned (inside and out)', 'Refrigerator cleaned', 'Dishwasher cleaned', 'Microwave cleaned', 'Countertops and backsplash', 'Sink and faucet polished', 'Stovetop and range hood', 'Floors vacuumed and mopped', 'Baseboards cleaned'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Bathrooms
                </h3>
                <ul className="space-y-2">
                  {['Toilet cleaned (inside and out)', 'Shower/Tub deep scrubbed', 'Mirrors and glass', 'Vanity and cabinets', 'Sink and faucet polished', 'Floors mopped and sanitized', 'Baseboards cleaned', 'All fixtures polished'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Living Areas
                </h3>
                <ul className="space-y-2">
                  {['All surfaces dusted', 'Carpets vacuumed', 'Hard floors mopped', 'Baseboards cleaned', 'Window sills cleaned', 'Light fixtures cleaned', 'Ceiling fans cleaned', 'Interior windows cleaned'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Bedrooms
                </h3>
                <ul className="space-y-2">
                  {['All surfaces dusted', 'Carpets vacuumed', 'Inside closets cleaned', 'Baseboards cleaned', 'Window sills cleaned', 'Light fixtures cleaned'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <a
                href="/api/brand/nj/partners/moveout-checklist"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0A3D2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#083025] transition"
              >
                <Download className="w-5 h-5" />
                Download Full Checklist (PDF)
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Ready to Partner With Us?
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Join apartment complexes across New Jersey who trust VelocityMaid for professional cleaning services
            </p>
            <Link
              href="#contact"
              className="bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#F5B835] transition shadow-lg inline-block"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Request Partnership Information
            </h2>
            <PartnershipForm />
          </div>
        </section>

        {/* Downloads Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Partnership Documents
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Partnership Proposal', route: '/api/brand/nj/partners/proposal', icon: FileText },
                { name: 'Move-Out Pricing', route: '/api/brand/nj/partners/moveout-pricing', icon: DollarSign },
                { name: 'Move-Out Checklist', route: '/api/brand/nj/partners/moveout-checklist', icon: CheckCircle2 },
                { name: 'Partnership Contract', route: '/api/brand/nj/partners/contract', icon: FileText },
                { name: 'Superintendent Referral', route: '/api/brand/nj/partners/superintendent-referral', icon: Users },
                { name: 'Leave-Behind Card', route: '/api/brand/nj/partners/leave-behind?side=front', icon: Download },
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

