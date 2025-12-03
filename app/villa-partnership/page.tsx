import { Metadata } from 'next';
import { 
  Sparkles, 
  Shield, 
  Clock, 
  CheckCircle, 
  FileText, 
  Users, 
  Star,
  ArrowRight,
  MessageCircle,
  Download,
  Bed,
  Bath,
  Calendar,
  Package,
  ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Villa Partnership Program | VelocityMaid Jamaica',
  description: 'Professional villa turnover cleaning, linen reset, inventory management, and damage reporting for vacation rentals in Port Antonio, Jamaica.',
  openGraph: {
    title: 'Villa Partnership Program | VelocityMaid Jamaica',
    description: 'Professional villa turnover cleaning, linen reset, inventory management, and damage reporting for vacation rentals in Port Antonio, Jamaica.',
    url: 'https://velocitymaid.com/villa-partnership',
    siteName: 'VelocityMaid',
    type: 'website',
    images: [
      {
        url: '/marketing/jamaica/villa_turnover.png',
        width: 1200,
        height: 630,
        alt: 'VelocityMaid Villa Partnership',
      },
    ],
  },
};

const benefits = [
  {
    icon: Bed,
    title: 'Linen Reset',
    description: 'Professional bed makeover and linen reset for every guest arrival',
  },
  {
    icon: ClipboardCheck,
    title: 'Inventory Check',
    description: 'Comprehensive inventory verification and restock recommendations',
  },
  {
    icon: Sparkles,
    title: 'Guest Ready',
    description: 'Every villa cleaned to 5-star standards, ready for your guests',
  },
  {
    icon: FileText,
    title: 'Damage Reporting',
    description: 'Detailed photo documentation and damage reports after each clean',
  },
  {
    icon: Users,
    title: 'Trained Staff',
    description: 'Jamaica Certified Cleaners with specialized villa training',
  },
  {
    icon: Star,
    title: '5-Star Standards',
    description: 'Consistent quality that maintains your villa\'s reputation',
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    property: 'Oceanview Villa, Port Antonio',
    text: 'VelocityMaid transformed our turnover process. Our guests consistently comment on how spotless the villa is. The inventory checks have saved us countless times.',
    rating: 5,
  },
  {
    name: 'James Thompson',
    property: 'Mountain Retreat Villa',
    text: 'The linen reset service is a game-changer. Our beds look like a luxury hotel every time. The team is professional, reliable, and detail-oriented.',
    rating: 5,
  },
  {
    name: 'Maria Rodriguez',
    property: 'Beachfront Paradise',
    text: 'The damage reporting feature gives us peace of mind. We know exactly what condition the villa is in after each guest. Highly recommend!',
    rating: 5,
  },
];

export default function VillaPartnershipPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CleaningService",
    "name": "VelocityMaid Villa Partnership Program",
    "description": "Professional villa turnover cleaning, linen reset, inventory management, and damage reporting for vacation rentals in Port Antonio, Jamaica.",
    "url": "https://velocitymaid.com/villa-partnership",
    "serviceType": "Villa Turnover Cleaning",
    "areaServed": {
      "@type": "City",
      "name": "Port Antonio",
      "addressRegion": "Portland",
      "addressCountry": "Jamaica"
    },
    "provider": {
      "@type": "Organization",
      "name": "VelocityMaid",
      "url": "https://velocitymaid.com"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#0A3D2F] via-[#0A3D2F] to-[#2B70C9] text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Villa Partnership Program
            </h1>
            <p className="text-xl md:text-2xl text-[#F3F1EB] mb-8 max-w-3xl mx-auto">
              Professional turnover cleaning, linen reset, and inventory management for vacation rentals in Port Antonio, Jamaica
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/villa-partnership/apply"
                className="btn-jamaica inline-flex items-center justify-center gap-2"
              >
                Apply for Partnership
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/booking?branch=port-antonio&service=villa-turnover"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2B70C9] text-white rounded-xl font-semibold hover:bg-[#1e5aa8] transition-colors text-lg border-2 border-white shadow-lg"
              >
                Book Trial Clean
                <Calendar className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Partner With VelocityMaid?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive villa management services designed for vacation rental owners
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Before/After Gallery Placeholder */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                See the Difference
              </h2>
              <p className="text-xl text-gray-600">
                Professional cleaning that makes your villa shine
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center">
                <p className="text-gray-500">Before Photo Placeholder</p>
              </div>
              <div className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center">
                <p className="text-gray-500">After Photo Placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Overview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Partnership Pricing (JMD)
              </h2>
              <p className="text-xl text-gray-600">
                Transparent pricing for villa owners
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-md">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Standard Turnover</h3>
                <p className="text-4xl font-bold text-blue-600 mb-2">JMD $7,500</p>
                <p className="text-gray-600 mb-6">Per turnover</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Full villa clean</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Bathroom reset</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Kitchen reset</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-md border-2 border-blue-500">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold inline-block mb-4">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Turnover + Linen</h3>
                <p className="text-4xl font-bold text-blue-600 mb-2">JMD $9,500</p>
                <p className="text-gray-600 mb-6">Per turnover</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Everything in Standard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Bed makeover & linen reset</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Photo documentation</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-md">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Full Service</h3>
                <p className="text-4xl font-bold text-blue-600 mb-2">JMD $12,000</p>
                <p className="text-gray-600 mb-6">Per turnover</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Everything in Turnover + Linen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Inventory check & report</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Damage reporting</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Custom pricing available for weekly/monthly contracts
              </p>
              <Link
                href="/villa-partnership/apply"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
              >
                Request Custom Quote
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                What Villa Owners Say
              </h2>
              <p className="text-xl text-gray-600">
                Trusted by vacation rental owners across Port Antonio
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.property}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Partner With Us?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join villa owners who trust VelocityMaid for professional turnover cleaning
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/villa-partnership/apply"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg"
              >
                Apply Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/villa-partnership/brochure"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors text-lg border-2 border-white"
              >
                <Download className="w-5 h-5" />
                Download Brochure
              </Link>
              <a
                href="https://wa.me/18765551985?text=Hi%20VelocityMaid,%20I'd%20like%20to%20learn%20more%20about%20the%20Villa%20Partnership%20Program."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-400 transition-colors text-lg"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

