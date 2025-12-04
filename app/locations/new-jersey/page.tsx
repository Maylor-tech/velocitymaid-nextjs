import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { 
  Sparkles, 
  CheckCircle2, 
  Shield, 
  DollarSign, 
  Leaf, 
  Clock, 
  Star, 
  Calendar,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Suspense } from 'react';
import FAQAccordion from './components/FAQAccordion';
import BeforeAfterGallery from './components/BeforeAfterGallery';

export const metadata: Metadata = {
  title: 'Professional House Cleaning in New Jersey | VelocityMaid',
  description: 'Reliable, background-checked cleaners in New Jersey. Flat-rate pricing, eco-friendly supplies, 100% satisfaction guarantee. Serving Newark, Jersey City, Elizabeth, and more.',
  keywords: 'house cleaning New Jersey, professional cleaners NJ, cleaning service Newark, Jersey City cleaning, Elizabeth cleaning, flat rate cleaning NJ',
  openGraph: {
    title: 'Professional House Cleaning in New Jersey | VelocityMaid',
    description: 'Reliable, background-checked cleaners in New Jersey. Flat-rate pricing, eco-friendly supplies, 100% satisfaction guarantee.',
    url: 'https://velocitymaid.com/locations/new-jersey',
    siteName: 'VelocityMaid',
    type: 'website',
  },
};


  const faqs = [
    {
      question: 'What areas in New Jersey do you serve?',
      answer: 'We serve Newark, Jersey City, Elizabeth, Union, Hoboken, East Orange, Rahway, Linden, Irvington, and surrounding areas in Essex, Union, and Hudson Counties. Contact us to confirm service in your specific area.',
    },
    {
      question: 'How much does house cleaning cost in New Jersey?',
      answer: 'Our pricing is transparent and flat-rate. Basic cleaning starts at $120 for 1 bedroom, $150 for 2 bedrooms, and $180 for 3 bedrooms. Deep cleaning and move-in/out services are priced separately. All pricing is upfront with no hidden fees.',
    },
    {
      question: 'Are your cleaners background checked?',
      answer: 'Yes, all VelocityMaid cleaners undergo thorough background checks before being hired. We also ensure they are insured and bonded for your peace of mind.',
    },
    {
      question: 'Do I need to provide cleaning supplies?',
      answer: 'No, we bring all our own professional-grade, eco-friendly cleaning supplies and equipment. You don\'t need to provide anything - just let us in and we\'ll handle the rest.',
    },
    {
      question: 'How do I book a cleaning service?',
      answer: 'Booking is easy! Simply click "Book Now" on our website, select your service type and preferred date/time, and complete your booking. You can also call us directly for same-day or urgent cleaning needs.',
    },
    {
      question: 'What is included in a basic cleaning?',
      answer: 'Our basic cleaning includes dusting all surfaces, vacuuming and mopping floors, cleaning and sanitizing bathrooms, kitchen cleaning (countertops, appliances, sink), trash removal, and basic tidying. Deep cleaning includes additional services like inside appliances, baseboards, and light fixtures.',
    },
    {
      question: 'Can I schedule recurring cleanings?',
      answer: 'Absolutely! We offer weekly, bi-weekly, and monthly cleaning plans with discounted rates. Recurring customers also get priority scheduling and consistent cleaner assignments when available.',
    },
    {
      question: 'What if I\'m not satisfied with the cleaning?',
      answer: 'We offer a 100% satisfaction guarantee. If you\'re not happy with any aspect of the cleaning, contact us within 24 hours and we\'ll return to fix it at no additional charge.',
    },
    {
      question: 'How far in advance should I book?',
      answer: 'We recommend booking at least 2-3 days in advance for best availability, though we can often accommodate same-day or next-day requests depending on our schedule. Recurring customers get priority scheduling.',
    },
    {
      question: 'Do you offer move-in or move-out cleaning?',
      answer: 'Yes! We offer comprehensive move-in and move-out cleaning services. This includes deep cleaning of all rooms, inside cabinets and appliances, window cleaning, and final inspection. Contact us for a custom quote based on your property size.',
    },
  ];



export default async function NewJerseyLandingPage() {
  // Fetch branch data
  const branch = await prisma.branch.findUnique({
    where: { slug: 'new-jersey' },
    include: {
      servicePackages: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  // Fetch active promo
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const activePromo = branch ? await prisma.promo.findFirst({
    where: {
      branchId: branch.id,
      month: currentMonth,
      year: currentYear,
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  }) : null;

  // Default pricing if branch not found
  const defaultPricing = {
    basic: 120,
    deep: 220,
    moveInOut: 320,
  };

  // Extract pricing from service packages
  const getServicePrice = (code: string): number => {
    if (!branch?.servicePackages) return defaultPricing[code as keyof typeof defaultPricing] || 0;
    const pkg = branch.servicePackages.find(p => p.code.toLowerCase().includes(code.toLowerCase()));
    return pkg ? Number(pkg.basePrice) : defaultPricing[code as keyof typeof defaultPricing] || 0;
  };

  const basicPrice = getServicePrice('basic');
  const deepPrice = getServicePrice('deep');
  const moveInOutPrice = getServicePrice('moveinout');

  // Service areas
  const serviceAreas = [
    'Newark', 'Jersey City', 'Elizabeth', 'Union', 'Hoboken',
    'East Orange', 'Rahway', 'Linden', 'Irvington'
  ];

  // Reviews
  const reviews = [
    {
      name: 'Sarah M.',
      location: 'Newark, NJ',
      rating: 5,
      text: 'VelocityMaid transformed my home! Professional, reliable, and spotless every time. Highly recommend!',
    },
    {
      name: 'James T.',
      location: 'Jersey City, NJ',
      rating: 5,
      text: 'Best cleaning service I\'ve used. The team is thorough, punctual, and uses eco-friendly products. Worth every penny!',
    },
    {
      name: 'Maria R.',
      location: 'Elizabeth, NJ',
      rating: 5,
      text: 'I\'ve been using VelocityMaid for 6 months now. Consistent quality, fair pricing, and excellent customer service.',
    },
    {
      name: 'David C.',
      location: 'Union, NJ',
      rating: 5,
      text: 'The cleaners are professional and respectful. My home has never looked better. 10/10 would recommend!',
    },
    {
      name: 'Jennifer L.',
      location: 'Hoboken, NJ',
      rating: 5,
      text: 'Fast, efficient, and affordable. Perfect for my busy schedule. The recurring service is a game-changer!',
    },
  ];

  // Structured Data
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'VelocityMaid New Jersey',
    image: 'https://velocitymaid.com/cleaning/clean-kitchen.jpg',
    '@id': 'https://velocitymaid.com/locations/new-jersey',
    url: 'https://velocitymaid.com/locations/new-jersey',
    telephone: branch?.primaryPhone || '(555) 123-4567',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New Jersey',
      addressRegion: 'NJ',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '40.7178',
      longitude: '-74.0431',
    },
    areaServed: serviceAreas.map(city => ({
      '@type': 'City',
      name: city,
    })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cleaning Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Basic Cleaning',
            description: 'Standard house cleaning service',
          },
          price: basicPrice,
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Deep Cleaning',
            description: 'Comprehensive deep cleaning service',
          },
          price: deepPrice,
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Move-In/Out Cleaning',
            description: 'Complete move-in or move-out cleaning',
          },
          price: moveInOutPrice,
          priceCurrency: 'USD',
        },
      ],
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What areas in New Jersey do you serve?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We serve Newark, Jersey City, Elizabeth, Union, Hoboken, East Orange, Rahway, Linden, Irvington, and surrounding areas in Essex, Union, and Hudson Counties.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does house cleaning cost in New Jersey?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our pricing is transparent and flat-rate. Basic cleaning starts at $120 for 1 bedroom, $150 for 2 bedrooms, and $180 for 3 bedrooms.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are your cleaners background checked?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all VelocityMaid cleaners undergo thorough background checks before being hired.',
        },
      },
    ],
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Promo Banner */}
      {activePromo && (
        <div className="bg-gradient-to-r from-[#F8C548] to-[#F5B835] text-[#0A3D2F] py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-lg mb-1">{activePromo.title}</h3>
              <p className="text-sm">{activePromo.description}</p>
            </div>
            <Link
              href={`/booking?branch=new-jersey&promo=${activePromo.month}-${activePromo.year}`}
              className="bg-[#0A3D2F] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#083025] transition whitespace-nowrap"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-4">
                <Link
                  href="/booking?branch=new-jersey"
                  className="text-gray-700 hover:text-[#0A3D2F] transition font-semibold"
                >
                  Book Now
                </Link>
                <Link
                  href="/booking?branch=new-jersey"
                  className="bg-[#0A3D2F] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#083025] transition"
                >
                  Check Availability
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* SECTION 1: HERO */}
        <section className="relative bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/cleaning/clean-kitchen.jpg"
              alt="Professional cleaning"
              fill
              className="object-cover opacity-20"
              priority
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Professional House Cleaning in New Jersey
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-8">
                  Reliable. Background Checked. Flat-Rate Pricing.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/booking?branch=new-jersey"
                    className="bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#F5B835] transition shadow-lg text-center"
                  >
                    Book Now
                  </Link>
                  <Link
                    href="/booking?branch=new-jersey"
                    className="bg-white text-[#0A3D2F] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg text-center"
                  >
                    Check Availability
                  </Link>
                </div>
                {/* Trust Badges */}
                <div className="flex flex-wrap gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#F8C548]" />
                    <span className="text-sm">Background Checked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548]" />
                    <span className="text-sm">Insured & Bonded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#F8C548]" />
                    <span className="text-sm">100% Satisfaction</span>
                  </div>
                </div>
              </div>
              <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="/cleaning/clean-kitchen.jpg"
                  alt="Professional cleaning service"
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Professional+Cleaning';
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: SERVICES */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Our Cleaning Services
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Basic Cleaning */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="w-16 h-16 bg-[#0A3D2F] rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-[#F8C548]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Basic Cleaning
                </h3>
                <ul className="space-y-3 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Dust all surfaces</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Vacuum & mop floors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Clean & sanitize bathrooms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Kitchen cleaning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Trash removal</span>
                  </li>
                </ul>
                <div className="text-3xl font-bold text-[#0A3D2F] mb-4">
                  From ${basicPrice}
                </div>
                <Link
                  href="/booking?branch=new-jersey"
                  className="block w-full bg-[#0A3D2F] text-white text-center py-3 rounded-lg font-semibold hover:bg-[#083025] transition"
                >
                  Book Now
                </Link>
              </div>

              {/* Deep Cleaning */}
              <div className="bg-white border-2 border-[#F8C548] rounded-xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="w-16 h-16 bg-[#F8C548] rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-[#0A3D2F]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Deep Cleaning
                </h3>
                <ul className="space-y-3 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Inside appliances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Baseboards & window sills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Light fixtures & ceiling fans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Cabinet interiors</span>
                  </li>
                </ul>
                <div className="text-3xl font-bold text-[#0A3D2F] mb-4">
                  From ${deepPrice}
                </div>
                <Link
                  href="/booking?branch=new-jersey"
                  className="block w-full bg-[#F8C548] text-[#0A3D2F] text-center py-3 rounded-lg font-semibold hover:bg-[#F5B835] transition"
                >
                  Book Now
                </Link>
              </div>

              {/* Move-In/Out */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="w-16 h-16 bg-[#0A3D2F] rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-[#F8C548]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Move-In/Move-Out
                </h3>
                <ul className="space-y-3 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Complete deep clean</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Inside all cabinets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Appliance deep clean</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Window cleaning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#F8C548] mt-0.5 flex-shrink-0" />
                    <span>Final inspection</span>
                  </li>
                </ul>
                <div className="text-3xl font-bold text-[#0A3D2F] mb-4">
                  From ${moveInOutPrice}
                </div>
                <Link
                  href="/booking?branch=new-jersey"
                  className="block w-full bg-[#0A3D2F] text-white text-center py-3 rounded-lg font-semibold hover:bg-[#083025] transition"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: BEFORE & AFTER GALLERY */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              See the Difference
            </h2>
            <Suspense fallback={<div>Loading gallery...</div>}>
              <BeforeAfterGallery />
            </Suspense>
          </div>
        </section>

        {/* SECTION 4: WHY CHOOSE US */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Why Choose VelocityMaid New Jersey
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Background Checked
                </h3>
                <p className="text-gray-600">All cleaners undergo thorough background checks</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Flat-Rate Pricing
                </h3>
                <p className="text-gray-600">Transparent pricing with no hidden fees</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Eco-Friendly Supplies
                </h3>
                <p className="text-gray-600">We use safe, eco-friendly cleaning products</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Reliable & On Time
                </h3>
                <p className="text-gray-600">Punctual service you can count on</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  100% Satisfaction Guarantee
                </h3>
                <p className="text-gray-600">Not happy? We'll come back and fix it - FREE</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0A3D2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-[#F8C548]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  Easy Online Booking
                </h3>
                <p className="text-gray-600">Book in minutes with our simple online system</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: SERVICE AREAS */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Service Areas
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Serving Essex, Union, and Hudson County
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {serviceAreas.map((area) => (
                <div
                  key={area}
                  className="bg-white p-4 rounded-lg shadow-md text-center border-2 border-gray-200 hover:border-[#F8C548] transition"
                >
                  <MapPin className="w-6 h-6 text-[#0A3D2F] mx-auto mb-2" />
                  <p className="font-semibold text-[#0A3D2F]">{area}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: CUSTOMER REVIEWS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              What Our Customers Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-md">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#F8C548] text-[#F8C548]" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{review.text}"</p>
                  <div>
                    <p className="font-semibold text-[#0A3D2F]">{review.name}</p>
                    <p className="text-sm text-gray-600">{review.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: CTA BLOCK */}
        <section className="py-20 bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Ready for a cleaner home?
            </h2>
            <Link
              href="/booking?branch=new-jersey"
              className="inline-block bg-[#F8C548] text-[#0A3D2F] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#F5B835] transition shadow-lg"
            >
              Book Now
            </Link>
          </div>
        </section>

        {/* SECTION 8: FAQ */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Frequently Asked Questions
            </h2>
            <Suspense fallback={<div>Loading FAQ...</div>}>
              <FAQAccordion faqs={[
                {
                  question: 'How much does cleaning cost?',
                  answer: 'Our pricing is flat-rate based on the size of your home. Studio apartments start at $120, 1-bedroom at $140, 2-bedroom at $160, and 3-bedroom at $180. Deep cleaning and move-in/out services are available at additional rates.',
                },
                {
                  question: 'Do I need to be home during the cleaning?',
                  answer: 'No, you don\'t need to be home! Many of our customers provide us with a key or access code. All our cleaners are background-checked and insured for your peace of mind.',
                },
                {
                  question: 'What supplies do you use?',
                  answer: 'We bring all our own eco-friendly cleaning supplies and equipment. You don\'t need to provide anything unless you have specific product preferences.',
                },
                {
                  question: 'How do I book a cleaning?',
                  answer: 'You can book online through our website, call us, or send us a WhatsApp message. We\'ll confirm your appointment and send you a reminder the day before.',
                },
                {
                  question: 'What if I\'m not satisfied?',
                  answer: 'We offer a 100% satisfaction guarantee. If you\'re not happy with the cleaning, let us know within 24 hours and we\'ll come back to fix it at no charge.',
                },
                {
                  question: 'Do you offer recurring cleaning?',
                  answer: 'Yes! We offer weekly, bi-weekly, and monthly cleaning schedules. Recurring customers receive priority booking and special rates.',
                },
                {
                  question: 'Are your cleaners insured?',
                  answer: 'Yes, all our cleaners are fully insured and bonded. We carry liability insurance to protect your home and belongings.',
                },
                {
                  question: 'What areas do you serve?',
                  answer: 'We currently serve Essex, Union, and Hudson Counties, including Newark, Jersey City, Elizabeth, Union, Hoboken, East Orange, Rahway, Linden, and Irvington.',
                },
              ]} />
            </Suspense>
          </div>
        </section>

        {/* SECTION 9: FINAL CTA */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0A3D2F]" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Let us handle the cleaning — you deserve the rest.
            </h2>
            <Link
              href="/booking?branch=new-jersey"
              className="inline-flex items-center gap-2 bg-[#0A3D2F] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#083025] transition shadow-lg"
            >
              Schedule a Cleaning
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0A3D2F] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-8 h-8 text-[#F8C548]" />
                  <span className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                    VelocityMaid
                  </span>
                </div>
                <p className="text-gray-300">Professional cleaning services in New Jersey</p>
              </div>
              <div>
                <h3 className="font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <Link href="/booking?branch=new-jersey" className="hover:text-[#F8C548] transition">
                      Book Now
                    </Link>
                  </li>
                  <li>
                    <Link href="/locations/new-jersey#services" className="hover:text-[#F8C548] transition">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link href="/locations/new-jersey#faq" className="hover:text-[#F8C548] transition">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Contact</h3>
                <p className="text-gray-300">{branch?.primaryPhone || '(555) 123-4567'}</p>
                <p className="text-gray-300">Serving New Jersey</p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 VelocityMaid. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

