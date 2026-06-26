import { Metadata } from 'next';
import { Sparkles, Shield, Clock, Heart, CheckCircle, MapPin, ArrowRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Professional Cleaning Services in Jamaica | VelocityMaid',
  description: 'Trusted, reliable, and high-quality cleaning for homes, villas, guest houses, and rentals across Jamaica. Professional cleaning services in Port Antonio and Portland.',
  openGraph: {
    title: 'Professional Cleaning Services in Jamaica | VelocityMaid',
    description: 'Trusted, reliable, and high-quality cleaning for homes, villas, guest houses, and rentals across Jamaica.',
    url: 'https://velocitymaid.com/jamaica',
    siteName: 'VelocityMaid',
    type: 'website',
    images: [
      {
        url: '/marketing/jamaica/launching.png',
        width: 1200,
        height: 630,
        alt: 'VelocityMaid Jamaica Launch',
      },
    ],
  },
};

const whyChooseCards = [
  {
    icon: Shield,
    title: 'Trusted & Insured',
    description: 'Fully bonded and insured professionals you can trust in your home',
  },
  {
    icon: Clock,
    title: 'Lightning Fast',
    description: 'Quick, efficient service that respects your time and schedule',
  },
  {
    icon: Heart,
    title: 'Care & Attention',
    description: 'We treat your home with the same care we\'d give our own',
  },
  {
    icon: Sparkles,
    title: 'Spotless Results',
    description: '100% satisfaction guaranteed or we\'ll make it right',
  },
  {
    icon: CheckCircle,
    title: 'Villa Specialists',
    description: 'Expert in Airbnb turnovers, guest houses, and vacation rentals',
  },
  {
    icon: MapPin,
    title: 'Local Expertise',
    description: 'Trained local professionals who understand Jamaican homes',
  },
];

const areasCovered = [
  { name: 'Port Antonio', status: 'active' },
  { name: 'Kingston', status: 'coming-soon' },
  { name: 'Montego Bay', status: 'coming-soon' },
  { name: 'Ocho Rios', status: 'coming-soon' },
  { name: 'Negril', status: 'coming-soon' },
  { name: 'Falmouth', status: 'coming-soon' },
];

export default function JamaicaLandingPage() {
  const whatsappUrl = 'https://wa.me/18765551985?text=Hi%20VelocityMaid,%20I\'d%20like%20to%20book%20a%20cleaning%20in%20Port%20Antonio.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Cleaning Service',
    provider: {
      '@type': 'LocalBusiness',
      name: 'VelocityMaid Jamaica',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'Jamaica',
        addressRegion: 'Portland',
        addressLocality: 'Port Antonio',
      },
      url: 'https://velocitymaid.com/jamaica',
      telephone: '+18765551985',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Jamaica',
    },
    description: 'Professional cleaning services for homes, villas, guest houses, and rentals across Jamaica',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2 text-[#0A3D2F] hover:text-[#2B70C9]">
                <Sparkles className="w-8 h-8" />
                <span className="text-2xl font-bold">VelocityMaid</span>
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/jamaica" className="text-vm-text hover:text-[#0A3D2F] font-medium">Jamaica</Link>
                <Link href="/jamaica/work-with-us" className="text-vm-text hover:text-[#0A3D2F]">Work With Us</Link>
                <Link
                  href="/booking?branch=port-antonio"
                  className="btn-jamaica px-6 py-2"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F3F1EB] to-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-[#0A3D2F] mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                Professional Cleaning Services in Jamaica
              </h1>
              <p className="text-xl md:text-2xl text-vm-muted mb-8 max-w-3xl mx-auto">
                Trusted, reliable, and high-quality cleaning for homes, villas, guest houses, and rentals across the island.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/booking?branch=port-antonio"
                  className="btn-jamaica inline-flex items-center justify-center gap-2"
                >
                  Book a Cleaning
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/jamaica/work-with-us"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#0A3D2F] border-2 border-[#0A3D2F] rounded-xl font-semibold text-lg hover:bg-[#F3F1EB] transition-colors shadow-lg"
                >
                  Work With Us
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why VelocityMaid Jamaica */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-vm-text mb-4">Why VelocityMaid Jamaica?</h2>
              <p className="text-xl text-vm-muted">Professional cleaning services designed for Jamaican homes and businesses</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyChooseCards.map((card, index) => (
                <div key={index} className="bg-gray-50 p-8 rounded-2xl text-center hover:shadow-lg transition-shadow">
                  <card.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-vm-text mb-2">{card.title}</h3>
                  <p className="text-vm-muted">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Areas Covered */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-vm-text mb-4">Areas We Cover</h2>
              <p className="text-xl text-vm-muted">Expanding across Jamaica to serve you better</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areasCovered.map((area, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 ${
                    area.status === 'active'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-vm-text">{area.name}</h3>
                      {area.status === 'active' ? (
                        <p className="text-vm-success font-semibold mt-1">✓ Currently Serving</p>
                      ) : (
                        <p className="text-vm-muted mt-1">Coming Soon</p>
                      )}
                    </div>
                    {area.status === 'active' && (
                      <Link
                        href="/locations/port-antonio"
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Learn More →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-vm-navy text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready for a Spotless Home?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Book your cleaning service today and experience the VelocityMaid difference
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking?branch=port-antonio"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                Book Online Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-vm-success text-white rounded-lg font-semibold text-lg hover:bg-vm-success transition-colors shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold">VelocityMaid</span>
                </div>
                <p className="text-vm-muted">Professional cleaning services across Jamaica</p>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link href="/jamaica" className="text-vm-muted hover:text-white transition">Jamaica</Link></li>
                  <li><Link href="/jamaica/work-with-us" className="text-vm-muted hover:text-white transition">Work With Us</Link></li>
                  <li><Link href="/locations/port-antonio" className="text-vm-muted hover:text-white transition">Port Antonio</Link></li>
                  <li><Link href="/booking?branch=port-antonio" className="text-vm-muted hover:text-white transition">Book Now</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Contact</h4>
                <ul className="space-y-2 text-vm-muted">
                  <li>Port Antonio, Portland, Jamaica</li>
                  <li><a href="tel:+18765551985" className="hover:text-white transition">+1 (876) 555-1985</a></li>
                  <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">WhatsApp Us</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-vm-muted">
              <p>&copy; {new Date().getFullYear()} VelocityMaid. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* WhatsApp Floating CTA */}
        <div className="fixed bottom-6 right-6 z-50">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-vm-success text-white p-4 rounded-full shadow-lg hover:bg-vm-success transition cursor-pointer group"
          >
            <MessageCircle className="w-6 h-6" />
            <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
              Chat on WhatsApp!
            </div>
          </a>
        </div>
      </div>
    </>
  );
}

