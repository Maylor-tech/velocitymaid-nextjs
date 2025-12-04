export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  Sparkles, 
  CheckCircle2, 
  Shield, 
  DollarSign, 
  Leaf, 
  Clock, 
  Star,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { getCityDisplayName, getZipsForCity, getAllNJCities } from '@/utils/cityRouting';
import FAQAccordion from '../../new-jersey/components/FAQAccordion';
import BeforeAfterGallery from '../../new-jersey/components/BeforeAfterGallery';

interface PageProps {
  params: { city: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const citySlug = params.city;
  const cityName = getCityDisplayName(citySlug);
  
  if (!getAllNJCities().includes(citySlug)) {
    return {
      title: 'City Not Found | VelocityMaid',
    };
  }

  // Get branch and city-specific content
  const branch = await prisma.branch.findUnique({
    where: { slug: 'new-jersey' },
    include: {
      landingContent: true,
    },
  });

  const cityContent = branch?.landingContent?.cityContent as any;
  const cityData = cityContent?.[citySlug];

  const seoTitle = cityData?.seoTitle || `Professional House Cleaning in ${cityName}, NJ | VelocityMaid`;
  const seoDescription = cityData?.seoDescription || `Reliable, background-checked cleaners in ${cityName}, New Jersey. Flat-rate pricing, eco-friendly supplies, 100% satisfaction guarantee.`;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: `house cleaning ${cityName}, professional cleaners ${cityName} NJ, cleaning service ${cityName}, flat rate cleaning ${cityName}`,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `https://velocitymaid.com/locations/new-jersey/${citySlug}`,
      siteName: 'VelocityMaid',
      type: 'website',
    },
  };
}

export default async function CityLandingPage({ params }: PageProps) {
  const citySlug = params.city;
  const cityName = getCityDisplayName(citySlug);

  // Validate city
  if (!getAllNJCities().includes(citySlug)) {
    notFound();
  }

  // Get branch data
  const branch = await prisma.branch.findUnique({
    where: { slug: 'new-jersey' },
    include: {
      servicePackages: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
      landingContent: true,
    },
  });

  if (!branch) {
    notFound();
  }

  // Get city-specific content
  const cityContent = branch.landingContent?.cityContent as any;
  const cityData = cityContent?.[citySlug] || {};

  // Default pricing
  const defaultPricing = {
    basic: 120,
    deep: 220,
    moveInOut: 320,
  };

  const getServicePrice = (code: string): number => {
    if (!branch.servicePackages) return defaultPricing[code as keyof typeof defaultPricing] || 0;
    const pkg = branch.servicePackages.find(p => p.code.toLowerCase().includes(code.toLowerCase()));
    return pkg ? Number(pkg.basePrice) : defaultPricing[code as keyof typeof defaultPricing] || 0;
  };

  const basicPrice = getServicePrice('basic');
  const deepPrice = getServicePrice('deep');
  const moveInOutPrice = getServicePrice('moveinout');

  // City ZIPs
  const cityZips = getZipsForCity(citySlug);

  // City-specific testimonials
  const testimonials = cityData.testimonials || [
    {
      name: 'Local Customer',
      location: `${cityName}, NJ`,
      rating: 5,
      text: `VelocityMaid provides excellent cleaning services in ${cityName}. Professional, reliable, and thorough every time!`,
    },
  ];

  // City-specific FAQs
  const faqs = cityData.faqs || [
    {
      question: `Do you serve ${cityName}, New Jersey?`,
      answer: `Yes! We provide professional cleaning services throughout ${cityName} and surrounding areas.`,
    },
    {
      question: `How much does cleaning cost in ${cityName}?`,
      answer: `Our pricing is transparent and flat-rate. Basic cleaning starts at $${basicPrice} for 1 bedroom.`,
    },
    {
      question: `How do I book a cleaning in ${cityName}?`,
      answer: `Simply click "Book Now" on this page, select your service type and preferred date/time, and complete your booking.`,
    },
  ];

  // Hero content
  const headline = cityData.headline || `Professional House Cleaning in ${cityName}, New Jersey`;
  const subheadline = cityData.subheadline || `Reliable, background-checked cleaners in ${cityName}. Flat-rate pricing, eco-friendly supplies, 100% satisfaction guarantee.`;
  const heroImageUrl = cityData.heroImageUrl || branch.landingContent?.heroImageUrl || '/cleaning/clean-kitchen.jpg';

  // Structured Data
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `VelocityMaid ${cityName}`,
    image: heroImageUrl,
    '@id': `https://velocitymaid.com/locations/new-jersey/${citySlug}`,
    url: `https://velocitymaid.com/locations/new-jersey/${citySlug}`,
    telephone: branch.primaryPhone || '(555) 123-4567',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityName,
      addressRegion: 'NJ',
      addressCountry: 'US',
    },
    areaServed: cityZips.map(zip => ({
      '@type': 'PostalCode',
      postalCode: zip,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
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
                href={`/booking?branch=new-jersey&city=${citySlug}`}
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
              <MapPin className="w-16 h-16 text-[#F8C548] mx-auto mb-6" />
              <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                {headline}
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8">
                {subheadline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/booking?branch=new-jersey&city=${citySlug}`}
                  className="bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#F5B835] transition shadow-lg"
                >
                  Book a Cleaning
                </Link>
                <Link
                  href="/locations/new-jersey"
                  className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition border-2 border-white/30"
                >
                  View All NJ Areas
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Our Cleaning Services in {cityName}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white border-2 border-[#0A3D2F] rounded-xl p-8 text-center">
                <DollarSign className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Basic Cleaning
                </h3>
                <p className="text-gray-600 mb-6">Starting at ${basicPrice}</p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li>✓ Dusting & vacuuming</li>
                  <li>✓ Bathroom sanitization</li>
                  <li>✓ Kitchen cleaning</li>
                  <li>✓ Trash removal</li>
                </ul>
              </div>

              <div className="bg-white border-2 border-[#0A3D2F] rounded-xl p-8 text-center">
                <Leaf className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Deep Cleaning
                </h3>
                <p className="text-gray-600 mb-6">Starting at ${deepPrice}</p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li>✓ Everything in basic</li>
                  <li>✓ Inside appliances</li>
                  <li>✓ Baseboards & windowsills</li>
                  <li>✓ Detailed scrubbing</li>
                </ul>
              </div>

              <div className="bg-white border-2 border-[#0A3D2F] rounded-xl p-8 text-center">
                <Clock className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Move-In/Out
                </h3>
                <p className="text-gray-600 mb-6">Starting at ${moveInOutPrice}</p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li>✓ Comprehensive deep clean</li>
                  <li>✓ Cabinet interiors</li>
                  <li>✓ Window cleaning</li>
                  <li>✓ Final inspection</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              We Serve {cityName}
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <p className="text-center text-gray-700 mb-6">
                We provide cleaning services in the following ZIP codes:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {cityZips.map((zip) => (
                  <div key={zip} className="text-center p-4 bg-[#F3F1EB] rounded-lg">
                    <span className="font-semibold text-[#0A3D2F]">{zip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              What {cityName} Customers Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial: any, index: number) => (
                <div key={index} className="bg-[#F3F1EB] rounded-xl p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-[#F8C548] fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0A3D2F]">{testimonial.name}</span>
                    <span className="text-sm text-gray-600">{testimonial.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Why Choose VelocityMaid in {cityName}?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Shield className="w-12 h-12 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Background Checked
                </h3>
                <p className="text-gray-600">All cleaners are thoroughly vetted</p>
              </div>
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Flat-Rate Pricing
                </h3>
                <p className="text-gray-600">No hidden fees, transparent pricing</p>
              </div>
              <div className="text-center">
                <Leaf className="w-12 h-12 text-[#0A3D2F] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Eco-Friendly
                </h3>
                <p className="text-gray-600">Safe, green cleaning products</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Frequently Asked Questions
            </h2>
            <FAQAccordion faqs={faqs} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#0A3D2F] to-[#083025] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Ready to Experience Clean?
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Book your cleaning service in {cityName} today!
            </p>
            <Link
              href={`/booking?branch=new-jersey&city=${citySlug}`}
              className="inline-flex items-center gap-2 bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#F5B835] transition shadow-lg"
            >
              Book Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

