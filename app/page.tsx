'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  Shield, 
  Clock, 
  Heart, 
  Phone, 
  Mail, 
  MessageCircle,
  Star,
  CheckCircle,
  Home as HomeIcon,
  Building2,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import TestimonialsSection from '../components/TestimonialsSection';
import SiteHeader from '../components/layout/SiteHeader';
import PricingSection from '../components/home/PricingSection';
import VermontGallery from '@/components/home/VermontGallery';
import { MIDDLEBURY_PHOTO_PATHS } from '@/lib/vermont/middleburyPhotos';
import { BrandLogo } from '@/components/brand';

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-vm-white border border-vm-navy/10 rounded-2xl shadow-sm overflow-hidden">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-vm-surface transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-base font-heading font-semibold text-vm-navy">{question}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-vm-cyan" />
        ) : (
          <ChevronDown className="w-5 h-5 text-vm-cyan" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 border-t border-vm-navy/5">
          <p className="text-vm-text font-body leading-relaxed pt-3">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState({
    testimonials: false,
    beforeAfter: false,
    services: false,
    pricing: false,
    faq: false,
  });
  
  const testimonialsRef = useRef<HTMLElement>(null);
  const beforeAfterRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);

  // Intersection Observer for lazy loading below-fold sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute('data-section');
            if (section) {
              setIsVisible((prev) => ({ ...prev, [section]: true }));
            }
          }
        });
      },
      { rootMargin: '100px' }
    );

    const sections = [
      testimonialsRef.current,
      beforeAfterRef.current,
      servicesRef.current,
    ].filter(Boolean);

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const bookingUrl = "/book?branch=new-jersey";
  const phoneNumber = "(973) 280-9190";
  const phoneNumberTel = "+19732809190"; // For tel: links
  const whatsappNumber = "19732809190";
  const email = "hello@velocitymaid.com";

  return (
    <div className="min-h-screen bg-vm-surface">
      <SiteHeader homeAnchors bookingHref={bookingUrl} />

      {/* ── HERO ── */}
      <section className="bg-vm-navy pt-16 pb-0 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-vm-cyan" />
              <span className="font-body text-xs text-white/70 tracking-wide">
                Serving New Jersey & Vermont since 2024
              </span>
            </div>
          </div>

          <div className="text-center mb-4">
            <h1 className="font-heading font-bold text-white text-4xl md:text-5xl leading-tight tracking-tight mb-4">
              Professional cleaning,
              <br />
              <span className="text-vm-cyan">wherever you need it.</span>
            </h1>
            <p className="font-body text-white/55 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Choose your market below. We&apos;ll handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 max-w-4xl mx-auto">
            <a
              href="/locations/new-jersey"
              className="group relative rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-vm-cyan/40 transition-all duration-300 overflow-hidden p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-body text-xs font-semibold text-vm-cyan uppercase tracking-widest">
                  Residential
                </span>
                <span className="font-body text-xs text-white/35">NJ</span>
              </div>

              <h2 className="font-heading font-bold text-white text-2xl mb-3 leading-tight">
                New Jersey
                <br />
                home cleaning
              </h2>

              <p className="font-body text-white/55 text-sm leading-relaxed mb-8 flex-1">
                Reliable home and apartment cleaning for NJ families. Newark, Jersey City,
                Paterson and surrounding areas.
              </p>

              <ul className="space-y-2 mb-8">
                {[
                  'Standard, deep & move-in/out cleans',
                  'Online booking in 2 minutes',
                  'Vetted, insured cleaners',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 font-body text-sm text-white/65"
                  >
                    <span className="text-vm-cyan text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="font-heading font-semibold text-white text-sm group-hover:text-vm-cyan transition-colors">
                  Book NJ cleaning →
                </span>
                <span className="font-body text-xs text-white/35">From $120</span>
              </div>
            </a>

            <a
              href="/vermont"
              className="group relative rounded-2xl border border-vm-cyan/30 bg-vm-cyan/5 hover:bg-vm-cyan/10 hover:border-vm-cyan/60 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative w-full h-36 sm:h-40">
                <Image
                  src={MIDDLEBURY_PHOTO_PATHS.exteriorHero}
                  alt="VelocityMaid Vermont vacation rental exterior in Middlebury"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(6,27,68,0.75), transparent 60%)",
                  }}
                />
                <div className="absolute top-4 right-4 hidden sm:block">
                  <span className="bg-vm-cyan text-vm-navy font-heading font-semibold text-xs px-3 py-1 rounded-full">
                    Now serving
                  </span>
                </div>
              </div>
              <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <span className="font-body text-xs font-semibold text-vm-cyan uppercase tracking-widest">
                  Short-term rentals
                </span>
                <div className="flex items-center gap-2">
                  <span className="sm:hidden bg-vm-cyan text-vm-navy font-heading font-semibold text-xs px-2 py-0.5 rounded-full">
                    New
                  </span>
                  <span className="font-body text-xs text-white/35">VT</span>
                </div>
              </div>

              <h2 className="font-heading font-bold text-white text-2xl mb-3 leading-tight">
                Vermont Airbnb
                <br />& rental cleaning
              </h2>

              <p className="font-body text-white/55 text-sm leading-relaxed mb-8 flex-1">
                Turnover cleaning for ski rentals, Airbnbs, and second homes in the Okemo
                Valley. Locally operated from Ludlow, VT.
              </p>

              <ul className="space-y-2 mb-8">
                {[
                  'Between-guest turnovers, every time',
                  'Photo report after every clean',
                  'Remote owner friendly',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 font-body text-sm text-white/65"
                  >
                    <span className="text-vm-cyan text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t border-vm-cyan/20">
                <span className="font-heading font-semibold text-white text-sm group-hover:text-vm-cyan transition-colors">
                  Book Vermont cleaning →
                </span>
                <span className="font-body text-xs text-white/35">From $225</span>
              </div>
              </div>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 py-8 mt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-vm-cyan text-xs">★★★★★</span>
              <span className="font-body text-xs text-white/50">
                Rated 5 stars by local customers
              </span>
            </div>
            <div className="w-px h-3 bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-white/50">Trusted since 2024</span>
            </div>
            <div className="w-px h-3 bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-white/50">
                Insured & background-checked
              </span>
            </div>
            <div className="w-px h-3 bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2">
              <a
                href={`tel:${phoneNumberTel}`}
                className="font-body text-xs text-vm-cyan hover:underline"
                onClick={() => {
                  sendGAEvent('event', 'phone_clicked', {
                    phone_number: phoneNumber,
                    location: 'hero_section',
                  });
                }}
              >
                Call {phoneNumber}
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* ── END HERO ── */}

      {/* Trust Bullets */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-vm-white border-t border-vm-navy/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-vm-navy/10 bg-vm-surface hover:shadow-sm transition">
              <div className="w-14 h-14 bg-vm-navy/5 rounded-full flex items-center justify-center mb-4 border border-vm-navy/10">
                <Shield className="w-7 h-7 text-vm-cyan" />
              </div>
              <h3 className="font-heading font-semibold text-vm-navy mb-2 text-lg">Insured & background-checked cleaners</h3>
              <p className="text-sm text-vm-muted font-body">All our cleaners are thoroughly vetted and fully insured</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-vm-navy/10 bg-vm-surface hover:shadow-sm transition">
              <div className="w-14 h-14 bg-vm-navy/5 rounded-full flex items-center justify-center mb-4 border border-vm-navy/10">
                <Calendar className="w-7 h-7 text-vm-cyan" />
              </div>
              <h3 className="font-heading font-semibold text-vm-navy mb-2 text-lg">Easy online booking & rescheduling</h3>
              <p className="text-sm text-vm-muted font-body">Book in minutes and manage your appointments anytime</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-vm-navy/10 bg-vm-surface hover:shadow-sm transition">
              <div className="w-14 h-14 bg-vm-navy/5 rounded-full flex items-center justify-center mb-4 border border-vm-navy/10">
                <Phone className="w-7 h-7 text-vm-cyan" />
              </div>
              <h3 className="font-heading font-semibold text-vm-navy mb-2 text-lg">Local support when you need it</h3>
              <p className="text-sm text-vm-muted font-body">Real people ready to help, not automated responses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance Strip */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vm-surface border-y border-vm-navy/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-vm-navy mb-3 font-heading font-semibold">
            Your home is in good hands.
          </p>
          <p className="text-vm-muted text-lg font-body">
            We carefully vet our cleaners and stand behind every service.
          </p>
        </div>
      </section>

      {/* Testimonials Section - Lazy Loaded */}
      <section ref={testimonialsRef} data-section="testimonials" id="testimonials">
        {isVisible.testimonials ? (
          <TestimonialsSection />
        ) : (
          <div className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto text-center">
              <div className="h-64 bg-white rounded-2xl animate-pulse" />
            </div>
          </div>
        )}
      </section>

      {/* Before & After Transformations - Lazy Loaded */}
      <section ref={beforeAfterRef} data-section="beforeAfter" className="py-20 px-4 sm:px-6 lg:px-8 bg-vm-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-center text-xs font-semibold font-body text-vm-muted uppercase tracking-widest mb-4">
              New Jersey
            </p>
            <h2 className="text-4xl font-heading font-bold text-vm-navy mb-4">See the VelocityMaid Difference</h2>
            <p className="text-xl text-vm-muted font-body">Real homes. Real transformations. See why local New Jersey families trust us.</p>
          </div>
          
          {/* Before/After Slider - Featured Transformation */}
          <div className="mb-16 max-w-4xl mx-auto">
            {isVisible.beforeAfter ? (
              <>
                <BeforeAfterSlider
                  beforeImage="/images/gallery/velocitymaid-kitchen-before-newark-nj.jpg"
                  afterImage="/images/gallery/velocitymaid-kitchen-after-newark-nj.jpg"
                  alt="Kitchen transformation - Newark, NJ"
                  className="w-full"
                />
                <p className="text-center text-vm-muted font-body mt-4 text-lg font-semibold">
                  Drag the slider to see the transformation
                </p>
              </>
            ) : (
              <div className="w-full aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Gallery Image Component - Only showing 6 images that actually exist */}
            {[
              // Only using photos that actually exist and load correctly
              { src: '/images/gallery/velocitymaid-kitchen-after-newark-nj.jpg', alt: 'Kitchen after cleaning', caption: 'After: Spotless & organized', badge: 'After' },
              { src: '/images/gallery/velocitymaid-luxury-bathroom-deep-clean-nj.jpg', alt: 'Luxury bathroom deep cleaning', caption: 'Premium bathroom detailing' },
              { src: '/images/gallery/velocitymaid-bathroom-standard-cleaning-nj.jpg', alt: 'Standard bathroom cleaning', caption: 'Standard bathroom cleaning' },
              { src: '/images/gallery/velocitymaid-bedroom-cleaning-newark-nj.jpg', alt: 'Bedroom cleaning Newark', caption: 'Bedroom cleaning - Newark' },
              { src: '/images/gallery/velocitymaid-bedroom-move-out-cleaning-nj.jpg', alt: 'Move-out bedroom cleaning', caption: 'Move-out cleaning service' },
              { src: '/images/gallery/velocitymaid-living-room-cleaning-newark-nj.jpg', alt: 'Living room cleaning', caption: 'Living room cleaning - Newark' },
            ].map((image, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover cursor-pointer relative"
                onClick={() => setSelectedImage(image.src)}
              >
                <div className="relative w-full aspect-[4/3] bg-white">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={800}
                    height={600}
                    className="object-cover w-full h-full"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    loading="lazy"
                    onError={(e) => {
                      // Show placeholder instead of hiding
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23f3f4f6" width="800" height="600"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="18"%3EImage loading...%3C/text%3E%3C/svg%3E';
                      console.error('Image failed to load:', image.src);
                    }}
                  />
                  {image.badge && (
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold ${
                      image.badge === 'Before' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {image.badge}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className={`text-center font-semibold ${
                    image.badge === 'After' ? 'text-vm-cyan' : 'text-vm-navy'
                  }`}>
                    {image.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a 
              href="/gallery"
              className="inline-flex items-center bg-vm-navy text-vm-white px-8 py-3 rounded-full font-heading font-semibold hover:bg-vm-navy/90 transition"
            >
              View Full Gallery <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      <VermontGallery />

      {/* Why Choose Us */}
      <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-vm-navy mb-4">Why Choose VelocityMaid?</h2>
            <p className="text-xl text-vm-muted font-body">Professional cleaning for busy Newark families</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Trusted & Insured",
                description: "Fully bonded and insured professionals you can trust in your home"
              },
              {
                icon: Clock,
                title: "Lightning Fast",
                description: "Quick, efficient service that respects your time and schedule"
              },
              {
                icon: Heart,
                title: "Care & Attention",
                description: "We treat your home with the same care we'd give our own"
              },
              {
                icon: Sparkles,
                title: "Spotless Results",
                description: "100% satisfaction guaranteed or we'll make it right"
              }
            ].map((feature, index) => (
              <div key={index} className="card-hover bg-vm-surface p-8 rounded-2xl text-center">
                <feature.icon className="w-12 h-12 text-vm-cyan mx-auto mb-4" />
                <h3 className="text-xl font-heading font-bold text-vm-navy mb-2">{feature.title}</h3>
                <p className="text-vm-muted font-body">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section ref={servicesRef} data-section="services" id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-vm-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-vm-navy mb-4">Our Services</h2>
            <p className="text-xl text-vm-muted font-body">Comprehensive cleaning solutions for every need</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: HomeIcon,
                title: "Residential Cleaning",
                description: "Regular cleaning, deep cleaning, move-in/out cleaning",
                features: ["Kitchen & Bathrooms", "Floors & Carpets", "Dusting & Vacuuming", "Custom Services"]
              },
              {
                icon: Building2,
                title: "Commercial Cleaning",
                description: "Office spaces, retail stores, and commercial properties",
                features: ["Office Cleaning", "Retail Spaces", "Post-Construction", "Flexible Scheduling"]
              }
            ].map((service, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg card-hover">
                <service.icon className="w-12 h-12 text-vm-cyan mb-4" />
                <h3 className="text-2xl font-heading font-bold text-vm-navy mb-2">{service.title}</h3>
                <p className="text-vm-muted font-body mb-6">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-vm-text font-body">
                      <CheckCircle className="w-5 h-5 text-vm-cyan mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a 
                  href={bookingUrl}
                  className="mt-6 inline-flex items-center text-vm-cyan font-heading font-semibold hover:text-vm-cyan-dark transition"
                >
                  Book This Service <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-vm-navy mb-4">What Our Clients Say</h2>
            <p className="text-xl text-vm-muted font-body">Real experiences from real customers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah J.",
                location: "Newark, NJ",
                text: "VelocityMaid transformed my home! Their attention to detail is incredible. I've been using their service for 6 months and couldn't be happier.",
                rating: 5
              },
              {
                name: "Michael C.",
                location: "Jersey City, NJ",
                text: "As a busy professional, I don't have time for deep cleaning. VelocityMaid has been a lifesaver. They're reliable, thorough, and professional.",
                rating: 5
              },
              {
                name: "Lisa R.",
                location: "Paterson, NJ",
                text: "I used VelocityMaid for my move-out cleaning. The landlord said it was the cleanest they'd ever seen the apartment. Got my full deposit back!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-vm-surface p-8 rounded-2xl card-hover">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-vm-cyan fill-vm-cyan" />
                  ))}
                </div>
                <p className="text-vm-text font-body mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-heading font-bold text-vm-navy">{testimonial.name}</p>
                  <p className="text-sm text-vm-muted font-body">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-vm-navy mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-vm-muted font-body">Got questions? We've got answers</p>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "What areas do you serve?",
                answer: "We serve New Jersey (Newark, Jersey City, Paterson, and surrounding areas) and Vermont (Ludlow, Okemo Valley, Proctorsville, Cavendish, and nearby towns). Select your location when booking."
              },
              {
                question: "Do I need to provide cleaning supplies?",
                answer: "No — we bring everything needed. If you have preferred products you'd like us to use, just let us know when booking."
              },
              {
                question: "Are you insured and bonded?",
                answer: "Yes. All VelocityMaid cleaners are background-checked, insured, and bonded. You are fully covered on every visit."
              },
              {
                question: "How do I schedule a cleaning?",
                answer: "Use our online booking form — it takes about 2 minutes. Select your location, service type, date, and pay securely. You will get a confirmation by email and SMS."
              },
              {
                question: "What if I am not satisfied with the cleaning?",
                answer: "We offer a satisfaction guarantee. If something was not done right, contact us within 24 hours and we will return to fix it at no charge."
              },
              {
                question: "Do you offer recurring services?",
                answer: "Yes — weekly, bi-weekly, and monthly recurring cleanings are available at a discounted rate. Set it up during checkout."
              }
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-vm-muted font-body mb-4">Still have questions?</p>
            <a 
              href={`tel:${phoneNumberTel}`}
              className="inline-flex items-center bg-vm-navy text-vm-white px-6 py-3 rounded-full font-heading font-semibold hover:bg-vm-navy/90 transition"
              onClick={() => {
                sendGAEvent('event', 'phone_clicked', {
                  phone_number: phoneNumber,
                  location: 'faq_section'
                });
              }}
            >
              <Phone className="mr-2 w-5 h-5" /> Call Us Now
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-vm-navy">
        <div className="max-w-4xl mx-auto text-center">
          <Calendar className="w-16 h-16 text-vm-cyan mx-auto mb-6" />
          <h2 className="text-4xl font-heading font-bold text-vm-white mb-4">
            Ready for a Spotless Home?
          </h2>
          <p className="text-xl text-vm-white/80 mb-8 font-body">
            Book your cleaning service today and experience the VelocityMaid difference
          </p>
          
          <div className="bg-vm-white/10 border border-vm-white/20 p-6 rounded-xl text-center max-w-[600px] my-10 mx-auto">
            <h3 className="text-xl font-heading font-bold text-vm-white mb-2">Safe & Secure Booking</h3>
            <p className="text-vm-white/80 font-body text-sm">
              Your payment information is protected by bank-level encryption. We use Stripe — your card details are never stored on our servers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={bookingUrl}
              className="bg-vm-cyan text-vm-navy px-8 py-4 rounded font-body font-bold uppercase tracking-wider text-xs hover:bg-vm-cyan-dark transition inline-flex items-center justify-center"
            >
              Book Online Now <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-green-600 transition inline-flex items-center justify-center"
              onClick={() => {
                sendGAEvent('event', 'whatsapp_clicked', {
                  location: 'cta_section'
                });
              }}
            >
              <MessageCircle className="mr-2 w-5 h-5" /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-vm-navy mb-4">Get In Touch</h2>
            <p className="text-xl text-vm-muted">We're here to answer your questions</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <a
              href={`tel:${phoneNumberTel}`}
              className="bg-vm-surface p-8 rounded-2xl text-center card-hover"
              onClick={() => {
                sendGAEvent('event', 'phone_clicked', {
                  phone_number: phoneNumber,
                  location: 'contact_section'
                });
              }}
            >
              <Phone className="w-12 h-12 text-vm-cyan mx-auto mb-4" />
              <h3 className="text-xl font-bold text-vm-navy mb-2">Call Us</h3>
              <p className="text-vm-muted">{phoneNumber}</p>
            </a>
            <a
              href={`mailto:${email}`}
              className="bg-vm-surface p-8 rounded-2xl text-center card-hover"
            >
              <Mail className="w-12 h-12 text-vm-cyan mx-auto mb-4" />
              <h3 className="text-xl font-bold text-vm-navy mb-2">Email Us</h3>
              <p className="text-vm-muted">{email}</p>
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-vm-surface p-8 rounded-2xl text-center card-hover"
              onClick={() => {
                sendGAEvent('event', 'whatsapp_clicked', {
                  location: 'contact_section'
                });
              }}
            >
              <MessageCircle className="w-12 h-12 text-vm-cyan mx-auto mb-4" />
              <h3 className="text-xl font-bold text-vm-navy mb-2">WhatsApp</h3>
              <p className="text-vm-muted">Chat with us instantly</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-vm-navy text-vm-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <BrandLogo variant="ivory" size="header" className="mb-4" />
              <p className="text-vm-white/70 font-body text-sm">
                Serving New Jersey and Vermont. Trusted since 2024.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-heading font-bold mb-4 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-sm font-body">
                <li><a href="#services" className="text-vm-white/70 hover:text-vm-cyan transition">Services</a></li>
                <li><a href="#pricing" className="text-vm-white/70 hover:text-vm-cyan transition">Pricing</a></li>
                <li><a href="/customer/login" className="text-vm-white/70 hover:text-vm-cyan transition">Pay Invoice</a></li>
                <li><a href="#why-us" className="text-vm-white/70 hover:text-vm-cyan transition">Why Us</a></li>
                <li><a href="#contact" className="text-vm-white/70 hover:text-vm-cyan transition">Contact</a></li>
                <li><a href="/careers" className="text-vm-white/70 hover:text-vm-cyan transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-heading font-bold mb-4 uppercase tracking-wider">Services</h4>
              <ul className="space-y-2 text-sm font-body text-vm-white/70">
                <li>Residential Cleaning</li>
                <li>Commercial Cleaning</li>
                <li>Deep Cleaning</li>
                <li>Move In/Out</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-heading font-bold mb-4 uppercase tracking-wider">Contact</h4>
              <ul className="space-y-2 text-sm font-body">
                <li>
                  <a href={`tel:${phoneNumberTel}`} className="text-vm-white/70 hover:text-vm-cyan transition">
                    New Jersey — {phoneNumber}
                  </a>
                </li>
                <li>
                  <a href="tel:+18027335348" className="text-vm-white/70 hover:text-vm-cyan transition">
                    Vermont — (802) 733-5348
                  </a>
                </li>
                <li>
                  <a href={`mailto:${email}`} className="text-vm-white/70 hover:text-vm-cyan transition">
                    {email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-vm-white/10 mt-12 pt-8 text-center text-vm-white/50 font-body text-xs">
            <p>&copy; {new Date().getFullYear()} VelocityMaid. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition cursor-pointer group"
              onClick={() => {
                sendGAEvent('event', 'whatsapp_clicked', {
                  location: 'floating_button'
                });
              }}
            >
              <MessageCircle className="w-6 h-6" />
              <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                Chat on WhatsApp!
              </div>
            </a>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-[101]"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
          >
            <X className="w-8 h-8" />
          </button>
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt="Full size gallery image"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}