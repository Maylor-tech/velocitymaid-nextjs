export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { 
  CheckCircle2, 
  Shield, 
  DollarSign, 
  Leaf, 
  Clock, 
  Star, 
  Calendar,
  MapPin,
  ArrowRight,
  Home,
  Sparkles,
} from 'lucide-react';
import { Suspense } from 'react';
import { BrandLogo } from '@/components/brand';
import BranchLandingNav from '@/components/layout/BranchLandingNav';
import FAQAccordion from './components/FAQAccordion';
import BeforeAfterGallery from './components/BeforeAfterGallery';

export const metadata: Metadata = {
  title: 'New Jersey Cleaning Services | VelocityMaid',
  description: 'Reliable, background-checked cleaners in New Jersey. Flat-rate pricing, eco-friendly supplies, 100% satisfaction guarantee. Serving Newark, Jersey City, Elizabeth, and more.',
  keywords: 'house cleaning New Jersey, professional cleaners NJ, cleaning service Newark, Jersey City cleaning, Elizabeth cleaning, flat rate cleaning NJ',
  openGraph: {
    title: 'New Jersey Cleaning Services | VelocityMaid',
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



const DEFAULT_NJ_PRICING = {
  basic: 120,
  deep: 220,
  moveInOut: 320,
};

const DEFAULT_NJ_PHONE = '(973) 280-9190';

type NjBranchData = {
  branch: {
    id: string;
    primaryPhone: string;
    BranchServicePackage: Array<{
      code: string;
      basePrice: unknown;
    }>;
  } | null;
  activePromo: {
    title: string;
    description: string;
    month: number;
    year: number;
  } | null;
};

async function fetchNjPageData(): Promise<NjBranchData> {
  try {
    const branch = await prisma.branch.findUnique({
      where: { slug: 'new-jersey' },
      include: {
        BranchServicePackage: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!branch) {
      return { branch: null, activePromo: null };
    }

    let activePromo: NjBranchData['activePromo'] = null;
    try {
      const now = new Date();
      activePromo = await prisma.promo.findFirst({
        where: {
          branchId: branch.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          active: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: {
          title: true,
          description: true,
          month: true,
          year: true,
        },
      });
    } catch {
      activePromo = null;
    }

    return { branch, activePromo };
  } catch {
    return { branch: null, activePromo: null };
  }
}

export default async function NewJerseyLandingPage() {
  const { branch, activePromo } = await fetchNjPageData();

  const defaultPricing = DEFAULT_NJ_PRICING;

  const getServicePrice = (code: string): number => {
    if (!branch?.BranchServicePackage?.length) {
      return defaultPricing[code as keyof typeof defaultPricing] || 0;
    }
    const pkg = branch.BranchServicePackage.find((p) =>
      p.code.toLowerCase().includes(code.toLowerCase())
    );
    return pkg ? Number(pkg.basePrice) : defaultPricing[code as keyof typeof defaultPricing] || 0;
  };

  const basicPrice = getServicePrice('basic');
  const deepPrice = getServicePrice('deep');
  const moveInOutPrice = getServicePrice('moveinout');
  const contactPhone = branch?.primaryPhone || DEFAULT_NJ_PHONE;

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
    telephone: contactPhone,
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
        <div className="bg-brand-gold/15 border-b border-brand-gold/30 text-brand-forest py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-serif font-bold text-lg mb-1">{activePromo.title}</h3>
              <p className="text-sm font-sans text-brand-slate/80">{activePromo.description}</p>
            </div>
            <Link
              href={`/book?branch=new-jersey&promo=${activePromo.month}-${activePromo.year}`}
              className="bg-brand-forest text-brand-ivory px-6 py-2 rounded font-sans font-bold uppercase tracking-wider text-xs hover:bg-brand-forest-hover transition whitespace-nowrap shadow-sm"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-brand-ivory font-sans">
        <BranchLandingNav
          bookingHref="/book?branch=new-jersey"
          bookingLabel="Check Availability"
          secondaryHref="/book?branch=new-jersey"
          secondaryLabel="Book Now"
          maxWidthClass="max-w-7xl"
          marketTagline="new-jersey"
        />

        {/* SECTION 1: HERO */}
        <section className="bg-brand-ivory py-16 md:py-24 border-b border-brand-forest/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-brand-gold text-xs font-sans font-bold uppercase tracking-widest mb-4">
                  New Jersey Property Care
                </p>
                <h1 className="font-serif font-bold text-brand-forest text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
                  New Jersey Cleaning Services for{' '}
                  <span className="text-brand-gold">Homes, Apartments & Move-Ins</span>
                </h1>
                <p className="font-sans text-brand-slate/80 text-lg md:text-xl mb-8 leading-relaxed">
                  Reliable. Background Checked. Flat-Rate Pricing.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/book?branch=new-jersey"
                    className="bg-brand-forest text-brand-ivory font-sans font-bold uppercase tracking-wider text-xs rounded px-8 py-4 hover:bg-brand-forest-hover transition text-center shadow-md"
                  >
                    Book Now
                  </Link>
                  <Link
                    href="/book?branch=new-jersey"
                    className="border border-brand-forest/20 text-brand-forest font-sans font-bold uppercase tracking-wider text-xs rounded px-8 py-4 hover:bg-brand-forest/5 transition text-center"
                  >
                    Check Availability
                  </Link>
                </div>
                {/* Trust Badges */}
                <div className="flex flex-wrap gap-4 mt-8">
                  <div className="flex items-center gap-2 text-sm font-sans text-brand-slate/70">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold/20">
                      <CheckCircle2 className="h-3 w-3 text-brand-gold" />
                    </span>
                    <span>Background Checked</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-sans text-brand-slate/70">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold/20">
                      <CheckCircle2 className="h-3 w-3 text-brand-gold" />
                    </span>
                    <span>Insured & Bonded</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-sans text-brand-slate/70">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold/20">
                      <CheckCircle2 className="h-3 w-3 text-brand-gold" />
                    </span>
                    <span>100% Satisfaction</span>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-brand-forest/10 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Home className="w-7 h-7 text-brand-gold" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand-gold font-sans font-bold">
                      New Jersey • Essex, Union & Hudson
                    </p>
                    <p className="text-sm text-brand-slate/70 font-sans">
                      Professional house cleaning across North Jersey
                    </p>
                  </div>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-brand-forest/5 rounded-lg">
                      <Sparkles className="w-4 h-4 text-brand-gold" />
                    </span>
                    <div>
                      <p className="text-brand-forest font-serif font-semibold text-sm">
                        Basic House Cleaning
                      </p>
                      <p className="text-brand-slate/60 font-sans text-xs mt-1">
                        Dusting, vacuuming, mopping, bathroom and kitchen
                        sanitizing — flat-rate pricing with no hidden fees.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-brand-forest/5 rounded-lg">
                      <Shield className="w-4 h-4 text-brand-gold" />
                    </span>
                    <div>
                      <p className="text-brand-forest font-serif font-semibold text-sm">
                        Deep Cleaning
                      </p>
                      <p className="text-brand-slate/60 font-sans text-xs mt-1">
                        Inside appliances, baseboards, light fixtures, and
                        cabinet interiors for a comprehensive reset.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-brand-forest/5 rounded-lg">
                      <MapPin className="w-4 h-4 text-brand-gold" />
                    </span>
                    <div>
                      <p className="text-brand-forest font-serif font-semibold text-sm">
                        Move-In / Move-Out Cleaning
                      </p>
                      <p className="text-brand-slate/60 font-sans text-xs mt-1">
                        Complete deep clean for transitions — cabinets,
                        appliances, windows, and final inspection included.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs text-brand-slate/60 font-sans border-t border-brand-forest/10 pt-3">
                  <span>Serving Newark, Jersey City & more</span>
                  <span>Eco-friendly supplies included</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: SERVICES */}
        <section id="services" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-brand-gold text-xs font-sans font-bold uppercase tracking-widest mb-2 text-center">
              Our Services
            </p>
            <h2 className="font-serif font-bold text-brand-forest text-3xl md:text-4xl text-center mb-12">
              Our Cleaning Services
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Basic Cleaning */}
              <div className="bg-white border border-brand-forest/10 rounded-xl p-8 shadow-sm hover:shadow-md transition">
                <div className="w-16 h-16 bg-brand-forest/5 rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-brand-gold-hover" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-2xl mb-4">
                  Basic Cleaning
                </h3>
                <ul className="space-y-3 mb-6 text-brand-slate/70 font-body">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Dust all surfaces</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Vacuum & mop floors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Clean & sanitize bathrooms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Kitchen cleaning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Trash removal</span>
                  </li>
                </ul>
                <div className="text-brand-gold-hover font-heading font-semibold text-sm mb-4">
                  From ${basicPrice}
                </div>
                <Link
                  href="/book?branch=new-jersey"
                  className="block w-full bg-brand-forest text-white text-center py-3 rounded-lg font-heading font-semibold hover:bg-brand-forest/90 transition"
                >
                  Book Now
                </Link>
              </div>

              {/* Deep Cleaning */}
              <div className="bg-white border-2 border-brand-gold rounded-xl p-8 shadow-sm hover:shadow-md transition">
                <div className="w-16 h-16 bg-brand-forest/5 rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-brand-gold-hover" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-2xl mb-4">
                  Deep Cleaning
                </h3>
                <ul className="space-y-3 mb-6 text-brand-slate/70 font-body">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Inside appliances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Baseboards & window sills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Light fixtures & ceiling fans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Cabinet interiors</span>
                  </li>
                </ul>
                <div className="text-brand-gold-hover font-heading font-semibold text-sm mb-4">
                  From ${deepPrice}
                </div>
                <Link
                  href="/book?branch=new-jersey"
                  className="block w-full bg-brand-gold text-brand-forest text-center py-3 rounded-lg font-heading font-semibold hover:bg-brand-gold-hover transition"
                >
                  Book Now
                </Link>
              </div>

              {/* Move-In/Out */}
              <div className="bg-white border border-brand-forest/10 rounded-xl p-8 shadow-sm hover:shadow-md transition">
                <div className="w-16 h-16 bg-brand-forest/5 rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-brand-gold-hover" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-2xl mb-4">
                  Move-In/Move-Out
                </h3>
                <ul className="space-y-3 mb-6 text-brand-slate/70 font-body">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Complete deep clean</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Inside all cabinets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Appliance deep clean</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Window cleaning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                    <span>Final inspection</span>
                  </li>
                </ul>
                <div className="text-brand-gold-hover font-heading font-semibold text-sm mb-4">
                  From ${moveInOutPrice}
                </div>
                <Link
                  href="/book?branch=new-jersey"
                  className="block w-full bg-brand-forest text-white text-center py-3 rounded-lg font-heading font-semibold hover:bg-brand-forest/90 transition"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: BEFORE & AFTER GALLERY */}
        <section className="py-20 bg-brand-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-brand-gold text-xs font-sans font-bold uppercase tracking-widest mb-2 text-center">
              Hospitality Standards
            </p>
            <h2 className="font-serif font-bold text-brand-forest text-3xl md:text-4xl text-center mb-4">
              Care You Can See
            </h2>
            <p className="text-center text-brand-slate/70 font-sans text-sm mb-12 max-w-2xl mx-auto">
              Every visit follows our structured property-care protocol — guest-ready results, every time.
            </p>
            <Suspense fallback={<div>Loading gallery...</div>}>
              <BeforeAfterGallery />
            </Suspense>
          </div>
        </section>

        {/* SECTION 4: WHY CHOOSE US */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-brand-forest text-4xl md:text-5xl text-center mb-12">
              Why Choose VelocityMaid New Jersey
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-forest/5 border border-brand-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-brand-gold" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-xl mb-2">
                  Background Checked
                </h3>
                <p className="text-brand-slate/70 font-body">All cleaners undergo thorough background checks</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-forest/5 border border-brand-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-brand-gold" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-xl mb-2">
                  Flat-Rate Pricing
                </h3>
                <p className="text-brand-slate/70 font-body">Transparent pricing with no hidden fees</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-forest/5 border border-brand-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-brand-gold" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-xl mb-2">
                  Eco-Friendly Supplies
                </h3>
                <p className="text-brand-slate/70 font-body">We use safe, eco-friendly cleaning products</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-forest/5 border border-brand-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-brand-gold" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-xl mb-2">
                  Reliable & On Time
                </h3>
                <p className="text-brand-slate/70 font-body">Punctual service you can count on</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-forest/5 border border-brand-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-brand-gold" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-xl mb-2">
                  100% Satisfaction Guarantee
                </h3>
                <p className="text-brand-slate/70 font-body">Not happy? We'll come back and fix it - FREE</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-forest/5 border border-brand-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-brand-gold" />
                </div>
                <h3 className="font-heading font-bold text-brand-forest text-xl mb-2">
                  Easy Online Booking
                </h3>
                <p className="text-brand-slate/70 font-body">Book in minutes with our simple online system</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: SERVICE AREAS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-brand-forest text-4xl md:text-5xl text-center mb-4">
              Service Areas
            </h2>
            <p className="text-center text-brand-slate/70 font-body mb-12 text-lg">
              Serving Essex, Union, and Hudson County
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {serviceAreas.map((area) => (
                <div
                  key={area}
                  className="bg-white p-4 rounded-lg shadow-sm text-center border border-brand-forest/10 hover:border-brand-gold transition"
                >
                  <MapPin className="w-6 h-6 text-brand-gold-hover mx-auto mb-2" />
                  <p className="font-heading font-semibold text-brand-forest">{area}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: CUSTOMER REVIEWS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-brand-forest text-4xl md:text-5xl text-center mb-12">
              What Our Customers Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-brand-forest/10">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-brand-gold text-brand-gold" />
                    ))}
                  </div>
                  <p className="text-brand-slate/70 font-body mb-4 italic">&quot;{review.text}&quot;</p>
                  <div>
                    <p className="font-heading font-semibold text-brand-forest">{review.name}</p>
                    <p className="text-sm text-brand-slate/70 font-body">{review.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: CTA BLOCK */}
        <section className="py-20 bg-brand-ivory border-y border-brand-forest/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif font-bold text-brand-forest text-3xl md:text-4xl mb-6">
              Ready for a cleaner home?
            </h2>
            <Link
              href="/book?branch=new-jersey"
              className="inline-block bg-brand-gold text-brand-forest font-sans font-bold uppercase tracking-wider text-xs px-8 py-4 rounded hover:bg-brand-gold-hover transition shadow-md"
            >
              Book Now
            </Link>
          </div>
        </section>

        {/* SECTION 8: FAQ */}
        <section id="faq" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-brand-forest text-4xl md:text-5xl text-center mb-12">
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
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-bold text-brand-forest text-4xl md:text-5xl mb-6">
              Let us handle the cleaning — you deserve the rest.
            </h2>
            <Link
              href="/book?branch=new-jersey"
              className="inline-flex items-center gap-2 bg-brand-forest text-white font-heading font-semibold px-8 py-4 rounded-lg text-lg hover:bg-brand-forest/90 transition"
            >
              Schedule a Cleaning
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-brand-forest text-brand-ivory py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <BrandLogo variant="ivory" size="header" className="mb-4" />
                <p className="text-brand-ivory/70 font-sans text-sm">Professional cleaning services in New Jersey</p>
              </div>
              <div>
                <h3 className="font-serif font-bold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
                <ul className="space-y-2 text-brand-ivory/70 font-sans text-sm">
                  <li>
                    <Link href="/book?branch=new-jersey" className="hover:text-brand-gold transition">
                      Book Now
                    </Link>
                  </li>
                  <li>
                    <Link href="/locations/new-jersey#services" className="hover:text-brand-gold transition">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link href="/locations/new-jersey#faq" className="hover:text-brand-gold transition">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-serif font-bold mb-4 text-sm uppercase tracking-wider">Contact</h3>
                <p className="text-brand-ivory/70 font-sans text-sm">{contactPhone}</p>
                <p className="text-brand-ivory/70 font-sans text-sm">Serving New Jersey</p>
              </div>
            </div>
            <div className="border-t border-brand-ivory/10 mt-8 pt-8 text-center text-brand-ivory/50 font-sans text-xs">
              <p>&copy; 2025 VelocityMaid. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

