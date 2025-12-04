export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Phone, MessageCircle, MapPin, Check, Sparkles, ArrowRight } from 'lucide-react';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  const branch = await prisma.branch.findUnique({
    where: { slug: params.slug },
    include: { landingContent: true },
  });
  
  if (!branch) {
    return {
      title: 'Branch Not Found',
    };
  }
  
  // Port Antonio specific metadata
  if (branch.slug === 'port-antonio') {
    const seoTitle = branch.landingContent?.seoTitle || 'Professional Cleaning Services in Port Antonio, Jamaica | VelocityMaid';
    const seoDescription = branch.landingContent?.seoDescription || 'VelocityMaid provides trusted, affordable, and professional house cleaning services in Port Antonio, Portland, Jamaica.';
    
    // JSON-LD LocalBusiness schema
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'VelocityMaid Port Antonio',
      image: 'https://velocitymaid.com/logo.png',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Port Antonio',
        addressRegion: 'Portland',
        addressCountry: 'Jamaica',
      },
      url: 'https://velocitymaid.com/locations/port-antonio',
      telephone: branch.primaryPhone,
      priceRange: '$$',
      description: 'Professional house cleaning and villa cleaning services in Port Antonio, Jamaica. Standard, Deep Clean, Move-In/Out, and Airbnb/Villa cleaning.',
    };
    
    return {
      title: seoTitle,
      description: seoDescription,
      other: {
        'script:ld+json': JSON.stringify(jsonLd),
      },
    };
  }
  
  return {
    title: branch.landingContent?.seoTitle || `VelocityMaid – ${branch.name}`,
    description: branch.landingContent?.seoDescription || `Professional cleaning services in ${branch.city}, ${branch.state}`,
  };
}

export default async function BranchLandingPage({ params }: PageProps) {
  const branch = await prisma.branch.findUnique({
    where: { slug: params.slug },
    include: {
      servicePackages: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
      serviceAreas: {
        orderBy: { zipCode: 'asc' },
      },
      landingContent: true,
    },
  });

  if (!branch) {
    notFound();
  }

  const servicePackages = branch.servicePackages;
  const serviceAreas = branch.serviceAreas;
  const landingContent = branch.landingContent;

  // Coming Soon Page
  if (branch.status === 'COMING_SOON') {
    // Special employment page for Port Antonio
    if (branch.slug === 'port-antonio') {
      // Use BranchLandingContent if available, with Port Antonio overrides
      const headline = landingContent?.headline || 'Professional House Cleaning Services in Port Antonio, Jamaica';
      const subheadline = landingContent?.subheadline || 'Reliable, friendly, and detail-focused cleaning services for homes, villas, short-term rentals, and guest houses across Portland.';
      const ctaLabel = landingContent?.localCtaLabel || 'Apply to Join the Team';
      const location = `${branch.city}, ${branch.state}, ${branch.country}`;
      
      // Testimonials from landingContent or default
      const testimonials = landingContent?.testimonials && Array.isArray(landingContent.testimonials) 
        ? landingContent.testimonials 
        : [
            {
              name: 'Sarah M.',
              location: 'Port Antonio',
              comment: 'VelocityMaid transformed our villa cleaning. Professional, thorough, and always on time. Highly recommend!',
              rating: 5,
            },
            {
              name: 'Michael T.',
              location: 'Portland',
              comment: 'Best cleaning service in Port Antonio. They handle our Airbnb turnover cleaning perfectly every time.',
              rating: 5,
            },
            {
              name: 'Patricia L.',
              location: 'Port Antonio',
              comment: 'Reliable and trustworthy team. Our guest house is always spotless after their visits.',
              rating: 5,
            },
          ];
      
      // Service areas - Portland communities
      const portlandCommunities = [
        'Port Antonio',
        'Boston Bay',
        'Buff Bay',
        'Hope Bay',
        'Long Bay',
        'Manchioneal',
        'Moore Town',
        'Orange Bay',
        'St. Margaret\'s Bay',
        'Windsor Castle',
      ];

      return (
        <>
          {/* JSON-LD Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'LocalBusiness',
                name: 'VelocityMaid Port Antonio',
                image: 'https://velocitymaid.com/logo.png',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Port Antonio',
                  addressRegion: 'Portland',
                  addressCountry: 'JM',
                  postalCode: 'PA-100',
                },
                url: 'https://velocitymaid.com/locations/port-antonio',
                telephone: branch.primaryPhone,
                priceRange: '$$',
                description: 'Professional house cleaning and villa cleaning services in Port Antonio, Jamaica. Standard, Deep Clean, Move-In/Out, and Airbnb/Villa cleaning.',
                areaServed: {
                  '@type': 'City',
                  name: 'Port Antonio',
                  containedIn: {
                    '@type': 'State',
                    name: 'Portland',
                    containedIn: {
                      '@type': 'Country',
                      name: 'Jamaica',
                    },
                  },
                },
                serviceArea: {
                  '@type': 'GeoCircle',
                  geoMidpoint: {
                    '@type': 'GeoCoordinates',
                    latitude: '18.1764',
                    longitude: '-76.4509',
                  },
                },
                priceCurrency: 'JMD',
                paymentAccepted: 'Cash, Credit Card, Online Payment',
                currenciesAccepted: 'JMD',
              }),
            }}
          />
          
          <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">VelocityMaid</span>
                </div>
              </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-8 bg-blue-600 text-white">
              <div className="max-w-4xl mx-auto text-center">
                <div className="mb-4">
                  <span className="inline-block px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold mb-4">
                    COMING SOON
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Professional Cleaning Services in Port Antonio, Jamaica
                </h1>
                <p className="text-xl text-blue-100 mb-6">
                  Trusted, reliable, and high-quality cleaning for homes, villas, guest houses, and rentals across Portland Parish.
                </p>
                <p className="text-lg text-blue-200 mb-6">
                  {location}
                </p>
                {/* Social Proof Badges */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                    ⭐ Trusted by Villa Owners
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                    🏆 Professional Training
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                    ✅ 100% Satisfaction
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/booking?branch=port-antonio"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    Book a Cleaning
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white border-2 border-white rounded-lg font-semibold text-lg hover:bg-blue-400 transition-colors shadow-lg"
                  >
                    Request Villa Partnership
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </section>

            {/* Villa-Specific Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Perfect for Villas, Airbnbs, and Guest Houses
                  </h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Specialized cleaning services designed for short-term rental properties and vacation homes
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Turnover Cleaning</h3>
                    <p className="text-gray-600">
                      Fast, thorough cleaning between guests to ensure your property is always guest-ready
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Bed Makeover & Linen Reset</h3>
                    <p className="text-gray-600">
                      Fresh linens, perfectly made beds, and hotel-quality presentation every time
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Inventory Check</h3>
                    <p className="text-gray-600">
                      Verify all amenities, supplies, and equipment are present and in working order
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Damage Reporting</h3>
                    <p className="text-gray-600">
                      Document any issues or damages found during cleaning for your records
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Restock Recommendations</h3>
                    <p className="text-gray-600">
                      Get notified when supplies are running low so you can restock before guests arrive
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md md:col-span-2 lg:col-span-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Scheduling</h3>
                    <p className="text-gray-600">
                      Book cleanings around your guest check-in/check-out times for seamless turnovers
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <a
                    href="/booking?branch=port-antonio"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    Book Villa Cleaning
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </section>

            {/* Pricing Overview (JMD) */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Pricing Overview (JMD)
                  </h2>
                  <p className="text-lg text-gray-600">
                    Transparent pricing in Jamaican Dollars. All Jamaica bookings are paid in JMD on arrival or online.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-8 rounded-xl border-2 border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Standard Clean</h3>
                    <p className="text-4xl font-bold text-blue-600 mb-4">JMD $7,500</p>
                    <p className="text-gray-600 mb-6">Perfect for regular maintenance cleaning</p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Kitchen & Bathrooms
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Dusting & Vacuuming
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Floor Mopping
                      </li>
                    </ul>
                    <a
                      href="/booking?branch=port-antonio"
                      className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Book Now
                    </a>
                  </div>
                  <div className="bg-blue-50 p-8 rounded-xl border-2 border-blue-600 relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        MOST POPULAR
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Deep Clean</h3>
                    <p className="text-4xl font-bold text-blue-600 mb-4">JMD $12,000</p>
                    <p className="text-gray-600 mb-6">Thorough top-to-bottom cleaning service</p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Everything in Standard
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Inside Appliances
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Baseboards & Windows
                      </li>
                    </ul>
                    <a
                      href="/booking?branch=port-antonio"
                      className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Book Now
                    </a>
                  </div>
                  <div className="bg-gray-50 p-8 rounded-xl border-2 border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Move In/Out</h3>
                    <p className="text-4xl font-bold text-blue-600 mb-4">JMD $20,000</p>
                    <p className="text-gray-600 mb-6">Complete property cleaning for transitions</p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Everything in Deep Clean
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Inside Cabinets & Closets
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        Full Sanitization
                      </li>
                    </ul>
                    <a
                      href="/booking?branch=port-antonio"
                      className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Book Now
                    </a>
                  </div>
                </div>
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                  <p className="text-gray-700">
                    <strong>Note:</strong> All Jamaica bookings are paid in JMD on arrival or online. Prices may vary based on property size and condition.
                  </p>
                </div>
              </div>
            </section>

          {/* Services Section */}
          {servicePackages.length > 0 && (
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                  Our Cleaning Services
                </h2>
                <p className="text-lg text-gray-600 mb-12 text-center max-w-3xl mx-auto">
                  From standard house cleaning to deep cleans and move-in/out services, we provide comprehensive cleaning solutions for homes, villas, and short-term rentals across Port Antonio and Portland.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {servicePackages.map((pkg) => (
                    <div key={pkg.id} className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-gray-600 mb-4">{pkg.description}</p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-blue-600">
                          ${pkg.basePrice.toFixed(2)}
                        </span>
                        <span className="text-gray-600">
                          / {pkg.defaultDurationHours} {pkg.defaultDurationHours === 1 ? 'hour' : 'hours'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Why Choose Us Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                Why Choose VelocityMaid in Jamaica?
              </h2>
              <p className="text-lg text-gray-600 mb-12 text-center max-w-3xl mx-auto">
                We're bringing international cleaning standards to Port Antonio, combining professional training with local expertise to deliver exceptional service.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Internationally Trained Team</h3>
                  <p className="text-gray-600">
                    Our cleaners receive world-class training in professional cleaning techniques, ensuring consistent, high-quality results.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Villa & Airbnb Specialists</h3>
                  <p className="text-gray-600">
                    Specialized in short-term rental turnovers, ensuring your property is guest-ready with attention to every detail.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Eco-Friendly Products</h3>
                  <p className="text-gray-600">
                    We use safe, environmentally responsible cleaning products that protect your family, pets, and the beautiful Jamaican environment.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Flexible Scheduling</h3>
                  <p className="text-gray-600">
                    We work around your schedule, whether you need regular maintenance or one-time deep cleans for special occasions.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Local Community Focus</h3>
                  <p className="text-gray-600">
                    We're building a team of local professionals, creating employment opportunities while serving the Port Antonio community.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Satisfaction Guaranteed</h3>
                  <p className="text-gray-600">
                    Your satisfaction is our priority. We stand behind our work and will return to address any concerns at no extra charge.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          {testimonials.length > 0 && (
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                  What Our Customers Say
                </h2>
                <p className="text-lg text-gray-600 mb-12 text-center">
                  Trusted by homeowners, villa owners, and property managers across Port Antonio
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  {testimonials.slice(0, 3).map((testimonial: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                          <span key={i} className="text-yellow-400">★</span>
                        ))}
                      </div>
                      <p className="text-gray-700 mb-4 italic">
                        "{testimonial.comment || testimonial.text}"
                      </p>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.location || 'Port Antonio'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Service Areas Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                Areas We Serve in Portland
              </h2>
              <p className="text-lg text-gray-600 mb-8 text-center">
                We provide professional cleaning services throughout Portland Parish, Jamaica
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {portlandCommunities.map((community, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-white text-blue-600 border-2 border-blue-200 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {community}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Why Join Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                Why Join VelocityMaid?
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Competitive Pay</h3>
                  <p className="text-gray-600">
                    Earn competitive rates with performance bonuses and incentive programs.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Flexible Schedule</h3>
                  <p className="text-gray-600">
                    Work on your terms—choose your own hours and availability.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Training</h3>
                  <p className="text-gray-600">
                    We train you to deliver world-class cleaning with confidence and excellence.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Growth Opportunities</h3>
                  <p className="text-gray-600">
                    Build your skills and access future opportunities within other VelocityMaid branches.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl md:col-span-2 lg:col-span-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Community Impact</h3>
                  <p className="text-gray-600">
                    Serve your community and help launch a new industry standard in Jamaica.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                How It Works
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Your Application</h3>
                  <p className="text-gray-600 text-sm">
                    Fill out our simple application form with your basic information.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Attend a Short Interview</h3>
                  <p className="text-gray-600 text-sm">
                    We'll schedule a brief conversation to learn more about you.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Training</h3>
                  <p className="text-gray-600 text-sm">
                    Receive comprehensive training on our cleaning standards and methods.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    4
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Earning</h3>
                  <p className="text-gray-600 text-sm">
                    Begin working with clients and earning competitive pay.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Join Our Team?
              </h2>
              <p className="text-gray-600 mb-8">
                Start your application today and be part of launching professional cleaning services in Port Antonio.
              </p>
              <a
                href="/cleaners/apply?branch=port-antonio"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                {ctaLabel}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions?</h2>
              <p className="text-gray-600 mb-6">
                Have questions about working with VelocityMaid? We're here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`tel:${branch.primaryPhone}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
                >
                  <Phone className="w-5 h-5" />
                  {branch.primaryPhone}
                </a>
                <a
                  href="https://wa.me/18765551985?text=Hi%20VelocityMaid,%20I'd%20like%20to%20book%20a%20cleaning%20in%20Port%20Antonio."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </section>

          {/* WhatsApp Floating CTA */}
          <div className="fixed bottom-6 right-6 z-50">
            <a
              href="https://wa.me/18765551985?text=Hi%20VelocityMaid,%20I'd%20like%20to%20book%20a%20cleaning%20in%20Port%20Antonio."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition cursor-pointer group"
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

    // Generic coming soon page for other branches
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Coming Soon to {branch.city}!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            VelocityMaid is expanding to {branch.city}, {branch.state}. Join our waitlist to be notified when we launch.
          </p>
          
          <form className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="tel"
              placeholder="Phone number (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Join Waitlist
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Add LocalBusiness JSON-LD for SEO
  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `VelocityMaid ${branch.name}`,
    image: landingContent?.heroImageUrl || '',
    '@id': `https://velocitymaid.com/locations/${branch.slug}`,
    url: `https://velocitymaid.com/locations/${branch.slug}`,
    telephone: branch.primaryPhone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: branch.city,
      addressRegion: branch.state,
      postalCode: '',
      addressCountry: branch.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      // TODO: Add actual coordinates if available
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '20:00',
    },
  };

  // Active Branch Landing Page
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 md:py-32 overflow-hidden">
        {/* Hero Image Background */}
        {landingContent?.heroImageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={landingContent.heroImageUrl}
              alt={`${branch.city} Cleaning Services`}
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-800/90"></div>
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            {landingContent?.headline || `Professional Cleaning in ${branch.city}, ${branch.state}`}
          </h1>
          <p className="text-xl text-blue-100 mb-8 drop-shadow-md">
            {landingContent?.subheadline || `VelocityMaid brings premium cleaning services to ${branch.city}`}
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={`tel:${branch.primaryPhone}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              <Phone className="w-5 h-5" />
              {branch.primaryPhone}
            </a>
            <a
              href={`https://wa.me/${branch.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      {/* Service Areas */}
      {serviceAreas.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Areas We Serve</h2>
          <div className="flex flex-wrap gap-3">
            {serviceAreas.slice(0, 10).map((area) => (
              <span
                key={area.id}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {area.city || area.zipCode}
              </span>
            ))}
            {serviceAreas.length > 10 && (
              <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">
                +{serviceAreas.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Service Packages */}
      {servicePackages.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Our Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {servicePackages.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-gray-600 mb-4">{pkg.description}</p>
                  )}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-blue-600">
                      ${pkg.basePrice.toFixed(2)}
                    </span>
                    <span className="text-gray-600 ml-2">
                      / {pkg.defaultDurationHours} hours
                    </span>
                  </div>
                  <a
                    href={`/book?branch=${branch.slug}&package=${pkg.code}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Book Now
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials */}
      {landingContent?.testimonials && Array.isArray(landingContent.testimonials) && landingContent.testimonials.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landingContent.testimonials.map((testimonial: any, index: number) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.comment || testimonial.text}"</p>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.location || branch.city}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {landingContent?.faqEntries && Array.isArray(landingContent.faqEntries) && landingContent.faqEntries.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {landingContent.faqEntries.map((faq: any, index: number) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LocalBusiness JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `VelocityMaid ${branch.name}`,
            telephone: branch.primaryPhone,
            address: {
              '@type': 'PostalAddress',
              addressLocality: branch.city,
              addressRegion: branch.state,
              addressCountry: branch.country,
            },
            url: `https://velocitymaid.com/locations/${branch.slug}`,
          }),
        }}
      />
    </div>
    </>
  );
}

