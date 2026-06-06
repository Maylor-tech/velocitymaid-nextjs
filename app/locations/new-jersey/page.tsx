export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Metadata } from 'next';
import Link from 'next/link';
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
  ArrowRight,
  Home,
} from 'lucide-react';
import { Suspense } from 'react';
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
        <div className="bg-vm-cyan text-vm-navy py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-heading font-bold text-lg mb-1">{activePromo.title}</h3>
              <p className="text-sm font-body">{activePromo.description}</p>
            </div>
            <Link
              href={`/book?branch=new-jersey&promo=${activePromo.month}-${activePromo.year}`}
              className="bg-vm-navy text-white px-6 py-2 rounded-lg font-heading font-semibold hover:bg-vm-navy/90 transition whitespace-nowrap"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white font-body">
        <BranchLandingNav
          bookingHref="/book?branch=new-jersey"
          bookingLabel="Check Availability"
          secondaryHref="/book?branch=new-jersey"
          secondaryLabel="Book Now"
          maxWidthClass="max-w-7xl"
        />

        {/* SECTION 1: HERO */}
        <section className="bg-vm-navy text-white py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
                  New Jersey Cleaning Services for{' '}
                  <span className="text-vm-cyan">Homes, Apartments & Move-Ins</span>
                </h1>
                <p className="font-body text-white/60 text-xl md:text-2xl mb-8">
                  Reliable. Background Checked. Flat-Rate Pricing.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/book?branch=new-jersey"
                    className="bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-8 py-4 text-lg hover:bg-vm-cyan-dark transition text-center"
                  >
                    Book Now
                  </Link>
                  <Link
                    href="/book?branch=new-jersey"
                    className="border border-white/25 text-white/80 font-heading rounded-lg px-8 py-4 text-lg hover:bg-white/10 transition text-center"
                  >
                    Check Availability
                  </Link>
                </div>
                {/* Trust Badges */}
                <div className="flex flex-wrap gap-6 mt-8">
                  <div className="flex items-center gap-2 text-sm font-body text-white/60">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vm-cyan/20">
                      <CheckCircle2 className="h-2.5 w-2.5 text-vm-cyan" />
                    </span>
                    <span>Background Checked</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-body text-white/60">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vm-cyan/20">
                      <CheckCircle2 className="h-2.5 w-2.5 text-vm-cyan" />
                    </span>
                    <span>Insured & Bonded</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-body text-white/60">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vm-cyan/20">
                      <CheckCircle2 className="h-2.5 w-2.5 text-vm-cyan" />
                    </span>
                    <span>100% Satisfaction</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Home className="w-7 h-7 text-vm-cyan" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-vm-cyan font-body font-semibold">
                      New Jersey • Essex, Union & Hudson
                    </p>
                    <p className="text-sm text-white/45 font-body">
                      Professional house cleaning across North Jersey
                    </p>
                  </div>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-vm-cyan/10 rounded-lg">
                      <Sparkles className="w-4 h-4 text-vm-cyan" />
                    </span>
                    <div>
                      <p className="text-white font-heading font-medium text-sm">
                        Basic House Cleaning
                      </p>
                      <p className="text-white/45 font-body text-xs mt-1">
                        Dusting, vacuuming, mopping, bathroom and kitchen
                        sanitizing — flat-rate pricing with no hidden fees.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-vm-cyan/10 rounded-lg">
                      <Shield className="w-4 h-4 text-vm-cyan" />
                    </span>
                    <div>
                      <p className="text-white font-heading font-medium text-sm">
                        Deep Cleaning
                      </p>
                      <p className="text-white/45 font-body text-xs mt-1">
                        Inside appliances, baseboards, light fixtures, and
                        cabinet interiors for a comprehensive reset.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-vm-cyan/10 rounded-lg">
                      <MapPin className="w-4 h-4 text-vm-cyan" />
                    </span>
                    <div>
                      <p className="text-white font-heading font-medium text-sm">
                        Move-In / Move-Out Cleaning
                      </p>
                      <p className="text-white/45 font-body text-xs mt-1">
                        Complete deep clean for transitions — cabinets,
                        appliances, windows, and final inspection included.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs text-white/45 font-body border-t border-white/10 pt-3">
                  <span>Serving Newark, Jersey City & more</span>
                  <span>Eco-friendly supplies included</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: SERVICES */}
        <section id="services" className="py-20 bg-vm-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2 text-center">
              Our Services
            </p>
            <h2 className="font-heading font-bold text-vm-navy text-4xl md:text-5xl text-center mb-12">
              Our Cleaning Services
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Basic Cleaning */}
              <div className="bg-white border border-vm-border rounded-xl p-8 shadow-sm hover:shadow-md transition">
                <div className="w-16 h-16 bg-[#EBF9FA] rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-vm-cyan-dark" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-2xl mb-4">
                  Basic Cleaning
                </h3>
                <ul className="space-y-3 mb-6 text-vm-muted font-body">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Dust all surfaces</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Vacuum & mop floors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Clean & sanitize bathrooms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Kitchen cleaning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Trash removal</span>
                  </li>
                </ul>
                <div className="text-vm-cyan-dark font-heading font-semibold text-sm mb-4">
                  From ${basicPrice}
                </div>
                <Link
                  href="/book?branch=new-jersey"
                  className="block w-full bg-vm-navy text-white text-center py-3 rounded-lg font-heading font-semibold hover:bg-vm-navy/90 transition"
                >
                  Book Now
                </Link>
              </div>

              {/* Deep Cleaning */}
              <div className="bg-white border-2 border-vm-cyan rounded-xl p-8 shadow-sm hover:shadow-md transition">
                <div className="w-16 h-16 bg-[#EBF9FA] rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-vm-cyan-dark" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-2xl mb-4">
                  Deep Cleaning
                </h3>
                <ul className="space-y-3 mb-6 text-vm-muted font-body">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Inside appliances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Baseboards & window sills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Light fixtures & ceiling fans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Cabinet interiors</span>
                  </li>
                </ul>
                <div className="text-vm-cyan-dark font-heading font-semibold text-sm mb-4">
                  From ${deepPrice}
                </div>
                <Link
                  href="/book?branch=new-jersey"
                  className="block w-full bg-vm-cyan text-vm-navy text-center py-3 rounded-lg font-heading font-semibold hover:bg-vm-cyan-dark transition"
                >
                  Book Now
                </Link>
              </div>

              {/* Move-In/Out */}
              <div className="bg-white border border-vm-border rounded-xl p-8 shadow-sm hover:shadow-md transition">
                <div className="w-16 h-16 bg-[#EBF9FA] rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-vm-cyan-dark" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-2xl mb-4">
                  Move-In/Move-Out
                </h3>
                <ul className="space-y-3 mb-6 text-vm-muted font-body">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Complete deep clean</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Inside all cabinets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Appliance deep clean</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Window cleaning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-vm-cyan mt-0.5 flex-shrink-0" />
                    <span>Final inspection</span>
                  </li>
                </ul>
                <div className="text-vm-cyan-dark font-heading font-semibold text-sm mb-4">
                  From ${moveInOutPrice}
                </div>
                <Link
                  href="/book?branch=new-jersey"
                  className="block w-full bg-vm-navy text-white text-center py-3 rounded-lg font-heading font-semibold hover:bg-vm-navy/90 transition"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: BEFORE & AFTER GALLERY */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-vm-navy text-4xl md:text-5xl text-center mb-12">
              See the Difference
            </h2>
            <Suspense fallback={<div>Loading gallery...</div>}>
              <BeforeAfterGallery />
            </Suspense>
          </div>
        </section>

        {/* SECTION 4: WHY CHOOSE US */}
        <section className="py-20 bg-vm-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-vm-navy text-4xl md:text-5xl text-center mb-12">
              Why Choose VelocityMaid New Jersey
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-vm-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-vm-cyan" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-xl mb-2">
                  Background Checked
                </h3>
                <p className="text-vm-muted font-body">All cleaners undergo thorough background checks</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-vm-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-vm-cyan" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-xl mb-2">
                  Flat-Rate Pricing
                </h3>
                <p className="text-vm-muted font-body">Transparent pricing with no hidden fees</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-vm-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-10 h-10 text-vm-cyan" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-xl mb-2">
                  Eco-Friendly Supplies
                </h3>
                <p className="text-vm-muted font-body">We use safe, eco-friendly cleaning products</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-vm-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-vm-cyan" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-xl mb-2">
                  Reliable & On Time
                </h3>
                <p className="text-vm-muted font-body">Punctual service you can count on</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-vm-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-vm-cyan" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-xl mb-2">
                  100% Satisfaction Guarantee
                </h3>
                <p className="text-vm-muted font-body">Not happy? We'll come back and fix it - FREE</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-vm-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-vm-cyan" />
                </div>
                <h3 className="font-heading font-bold text-vm-navy text-xl mb-2">
                  Easy Online Booking
                </h3>
                <p className="text-vm-muted font-body">Book in minutes with our simple online system</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: SERVICE AREAS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-vm-navy text-4xl md:text-5xl text-center mb-4">
              Service Areas
            </h2>
            <p className="text-center text-vm-muted font-body mb-12 text-lg">
              Serving Essex, Union, and Hudson County
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {serviceAreas.map((area) => (
                <div
                  key={area}
                  className="bg-white p-4 rounded-lg shadow-sm text-center border border-vm-border hover:border-vm-cyan transition"
                >
                  <MapPin className="w-6 h-6 text-vm-cyan-dark mx-auto mb-2" />
                  <p className="font-heading font-semibold text-vm-navy">{area}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: CUSTOMER REVIEWS */}
        <section className="py-20 bg-vm-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-vm-navy text-4xl md:text-5xl text-center mb-12">
              What Our Customers Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-vm-border">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-vm-cyan text-vm-cyan" />
                    ))}
                  </div>
                  <p className="text-vm-muted font-body mb-4 italic">&quot;{review.text}&quot;</p>
                  <div>
                    <p className="font-heading font-semibold text-vm-navy">{review.name}</p>
                    <p className="text-sm text-vm-muted font-body">{review.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: CTA BLOCK */}
        <section className="py-20 bg-vm-navy text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6">
              Ready for a cleaner home?
            </h2>
            <Link
              href="/book?branch=new-jersey"
              className="inline-block bg-vm-cyan text-vm-navy font-heading font-semibold px-8 py-4 rounded-lg text-lg hover:bg-vm-cyan-dark transition"
            >
              Book Now
            </Link>
          </div>
        </section>

        {/* SECTION 8: FAQ */}
        <section id="faq" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-vm-navy text-4xl md:text-5xl text-center mb-12">
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
        <section className="py-20 bg-vm-surface">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-bold text-vm-navy text-4xl md:text-5xl mb-6">
              Let us handle the cleaning — you deserve the rest.
            </h2>
            <Link
              href="/book?branch=new-jersey"
              className="inline-flex items-center gap-2 bg-vm-navy text-white font-heading font-semibold px-8 py-4 rounded-lg text-lg hover:bg-vm-navy/90 transition"
            >
              Schedule a Cleaning
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-vm-navy text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-8 h-8 text-vm-cyan" />
                  <span className="font-heading font-bold text-2xl">
                    VelocityMaid
                  </span>
                </div>
                <p className="text-white/60 font-body">Professional cleaning services in New Jersey</p>
              </div>
              <div>
                <h3 className="font-heading font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-white/60 font-body">
                  <li>
                    <Link href="/book?branch=new-jersey" className="hover:text-vm-cyan transition">
                      Book Now
                    </Link>
                  </li>
                  <li>
                    <Link href="/locations/new-jersey#services" className="hover:text-vm-cyan transition">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link href="/locations/new-jersey#faq" className="hover:text-vm-cyan transition">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-heading font-bold mb-4">Contact</h3>
                <p className="text-white/60 font-body">{contactPhone}</p>
                <p className="text-white/60 font-body">Serving New Jersey</p>
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40 font-body">
              <p>&copy; 2025 VelocityMaid. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

