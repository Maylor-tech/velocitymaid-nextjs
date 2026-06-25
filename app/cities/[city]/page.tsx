import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBranchBySlug, getAllBranches, getBranchLandingContent, type Branch } from '@/utils/branchData';
import { Phone, MessageCircle, MapPin, CheckCircle, Star, Sparkles, ArrowRight } from 'lucide-react';

interface PageProps {
  params: {
    city: string;
  };
}

// City to branch slug mapping
const CITY_TO_BRANCH: Record<string, string> = {
  'newark': 'new-jersey',
  'jersey-city': 'new-jersey',
  'paterson': 'new-jersey',
  'elizabeth': 'new-jersey',
  'edison': 'new-jersey',
  'hoboken': 'new-jersey',
  'clifton': 'new-jersey',
  'ludlow': 'vermont',
  'burlington': 'vermont',
  'montpelier': 'vermont',
  'boston': 'boston',
  'cambridge': 'boston',
  'somerville': 'boston',
  'manhattan': 'new-york-city',
  'brooklyn': 'new-york-city',
  'queens': 'new-york-city',
  'bronx': 'new-york-city',
  'new-york': 'new-york-city',
  'port-antonio': 'port-antonio',
};

// City-specific content
const CITY_CONTENT: Record<string, {
  title: string;
  description: string;
  heroImage?: string;
  highlights: string[];
  areas: string[];
  testimonials?: Array<{ name: string; text: string; rating: number }>;
}> = {
  'newark': {
    title: 'Professional Cleaning Services in Newark, NJ',
    description: 'VelocityMaid provides reliable home and apartment cleaning services in Newark, New Jersey. Trusted by local families for move-in/out cleaning, deep cleaning, and regular maintenance.',
    highlights: [
      'Serving all Newark neighborhoods',
      'Same-day booking available',
      'Fully insured and bonded',
      '100% satisfaction guarantee',
    ],
    areas: ['Downtown Newark', 'Ironbound', 'Forest Hill', 'Weequahic', 'North Newark'],
  },
  'jersey-city': {
    title: 'Professional Cleaning Services in Jersey City, NJ',
    description: 'VelocityMaid brings premium cleaning services to Jersey City. From luxury apartments to family homes, we deliver spotless results every time.',
    highlights: [
      'Downtown and waterfront areas',
      'Luxury apartment specialists',
      'Eco-friendly cleaning options',
      'Flexible scheduling',
    ],
    areas: ['Downtown', 'Journal Square', 'The Heights', 'Greenville', 'Bergen-Lafayette'],
  },
  'boston': {
    title: 'Professional Cleaning Services in Boston, MA',
    description: 'VelocityMaid provides top-quality cleaning services throughout Boston, Cambridge, and Somerville. Trusted by busy professionals and families.',
    highlights: [
      'All Boston neighborhoods',
      'Cambridge and Somerville',
      'Student-friendly pricing',
      'Quick response times',
    ],
    areas: ['Back Bay', 'Beacon Hill', 'South End', 'Cambridge', 'Somerville'],
  },
  'manhattan': {
    title: 'Professional Cleaning Services in Manhattan, NYC',
    description: 'VelocityMaid offers premium cleaning services for Manhattan apartments and homes. Fast, reliable, and professional.',
    highlights: [
      'All Manhattan neighborhoods',
      'Apartment specialists',
      'Flexible scheduling',
      'Premium service standards',
    ],
    areas: ['Upper East Side', 'Upper West Side', 'Midtown', 'Downtown', 'Harlem'],
  },
};

export async function generateMetadata({ params }: PageProps) {
  const city = params.city;
  const content = CITY_CONTENT[city];
  
  if (!content) {
    return {
      title: 'City Not Found',
    };
  }

  return {
    title: content.title,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
    },
  };
}

export default function CityMarketingPage({ params }: PageProps) {
  const city = params.city;
  const branchSlug = CITY_TO_BRANCH[city];
  const content = CITY_CONTENT[city];

  if (!content || !branchSlug) {
    notFound();
  }

  const branch = getBranchBySlug(branchSlug);
  if (!branch) {
    notFound();
  }

  const landingContent = getBranchLandingContent(branch.id);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-vm-cyan-dark" />
              <span className="text-2xl font-bold text-vm-text">VelocityMaid</span>
            </Link>
            <div className="flex items-center gap-4">
              <a href="/booking" className="text-vm-text hover:text-vm-cyan-dark transition">
                Book Now
              </a>
              <a
                href={`tel:${branch.primaryPhone}`}
                className="bg-vm-navy text-white px-6 py-2 rounded-full font-semibold hover:bg-vm-navy transition"
              >
                Call {branch.primaryPhone}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-vm-navy to-vm-navy text-white py-20 md:py-32 overflow-hidden">
        {content.heroImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={content.heroImage}
              alt={`${city} Cleaning Services`}
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-vm-navy/90 to-vm-navy/90"></div>
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            {content.title}
          </h1>
          <p className="text-xl text-vm-muted mb-8 drop-shadow-md max-w-3xl">
            {content.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-vm-cyan-dark rounded-lg font-semibold hover:bg-vm-surface transition-colors shadow-lg"
            >
              Book Your Cleaning <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={`tel:${branch.primaryPhone}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-vm-surface text-white rounded-lg font-semibold hover:bg-vm-surface transition-colors shadow-lg"
            >
              <Phone className="w-5 h-5" />
              {branch.primaryPhone}
            </a>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-vm-text mb-8 text-center">
            Why Choose VelocityMaid in {city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.highlights.map((highlight, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <CheckCircle className="w-8 h-8 text-vm-cyan-dark mb-3" />
                <p className="font-semibold text-vm-text">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas We Serve */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-vm-text mb-8 text-center">
            Areas We Serve
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {content.areas.map((area, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white text-vm-cyan-dark rounded-full text-sm font-medium shadow-sm"
              >
                <MapPin className="w-4 h-4 inline mr-1" />
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-vm-text mb-8 text-center">
            Our Cleaning Services
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-vm-text mb-3">Basic Clean</h3>
              <p className="text-vm-muted mb-4">Perfect for regular maintenance</p>
              <ul className="space-y-2 text-vm-text">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Kitchen & Bathrooms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Dusting & Vacuuming
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Floor Mopping
                </li>
              </ul>
            </div>
            <div className="bg-vm-surface p-8 rounded-xl border-2 border-vm-border">
              <h3 className="text-xl font-bold text-vm-text mb-3">Deep Clean</h3>
              <p className="text-vm-muted mb-4">Thorough top-to-bottom service</p>
              <ul className="space-y-2 text-vm-text">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Everything in Basic
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Inside Appliances
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Baseboards & Windows
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-vm-text mb-3">Move In/Out</h3>
              <p className="text-vm-muted mb-4">Complete property cleaning</p>
              <ul className="space-y-2 text-vm-text">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Everything in Deep Clean
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Inside Cabinets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Full Sanitization
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {content.testimonials && content.testimonials.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-vm-text mb-8 text-center">
              What Our Customers Say
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {content.testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-vm-text mb-4 italic">"{testimonial.text}"</p>
                  <p className="font-semibold text-vm-text">{testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-vm-navy text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Experience the VelocityMaid Difference?
          </h2>
          <p className="text-xl text-vm-muted mb-8">
            Book your cleaning service today and see why {city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} families trust us
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-vm-cyan-dark rounded-lg font-semibold text-lg hover:bg-vm-surface transition shadow-lg"
            >
              Book Online Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={`https://wa.me/${branch.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-vm-success text-white rounded-lg font-semibold text-lg hover:bg-vm-success transition shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* LocalBusiness JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `VelocityMaid ${city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
            description: content.description,
            telephone: branch.primaryPhone,
            address: {
              '@type': 'PostalAddress',
              addressLocality: branch.city,
              addressRegion: branch.state,
              addressCountry: branch.country,
            },
            url: `https://velocitymaid.com/cities/${city}`,
            priceRange: '$$',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5',
              reviewCount: '50',
            },
          }),
        }}
      />
    </div>
  );
}




