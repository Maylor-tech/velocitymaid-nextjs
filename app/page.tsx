'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import TestimonialsSection from '../components/TestimonialsSection';
import SiteHeader from '../components/layout/SiteHeader';

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-primary-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-primary-600" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

// Hero placeholder — replace with property photo when available
function HeroPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-vm-navy rounded-2xl min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] flex flex-col items-center justify-center p-8 sm:p-10 text-center"
    >
      <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-8">
        Now serving Vermont + New Jersey
      </p>
      <div className="grid grid-cols-2 gap-10 sm:gap-16 w-full max-w-xs">
        <div className="text-center">
          <p className="font-heading font-bold text-4xl sm:text-5xl text-vm-cyan">3</p>
          <p className="font-body text-sm text-white/60 mt-1">markets</p>
        </div>
        <div className="text-center">
          <p className="font-heading font-bold text-4xl sm:text-5xl text-vm-cyan">24hr</p>
          <p className="font-body text-sm text-white/60 mt-1">booking window</p>
        </div>
      </div>
    </motion.div>
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

      {/* Hero Section */}
      <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-vm-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.h1 
                className="font-heading font-bold text-vm-navy text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Reliable home cleaning,{' '}
                <span className="text-vm-cyan">without the stress.</span>
              </motion.h1>
              <motion.p 
                className="font-body text-vm-muted text-lg sm:text-xl mb-4 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Book in minutes. We'll handle the rest.
              </motion.p>
              <motion.p 
                className="font-body text-sm text-vm-muted mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                Takes about 2 minutes to book
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <a 
                  href={bookingUrl}
                  className="bg-vm-navy text-white font-heading font-semibold rounded-lg inline-flex items-center justify-center px-8 py-3.5 hover:bg-vm-cyan hover:text-vm-navy transition-colors shadow-md hover:shadow-lg"
                  aria-label="Book your cleaning service"
                >
                  Book a Service <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                </a>
                <a 
                  href={`tel:${phoneNumberTel}`}
                  className="border border-vm-border text-vm-navy font-heading inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-medium hover:border-vm-cyan hover:text-vm-cyan transition-colors"
                  aria-label={`Call VelocityMaid at ${phoneNumber}`}
                  onClick={() => {
                    sendGAEvent('event', 'phone_clicked', {
                      phone_number: phoneNumber,
                      location: 'hero_section'
                    });
                  }}
                >
                  <Phone className="mr-2 w-5 h-5" aria-hidden="true" /> Call {phoneNumber}
                </a>
              </motion.div>
              <motion.div 
                className="mt-10 flex flex-wrap items-center gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <div className="flex">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                  <span className="ml-2 font-body text-sm text-vm-muted">Rated 5 stars by local customers</span>
                </motion.div>
                <motion.div 
                  className="font-body text-sm text-vm-muted"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  Trusted since 2024
                </motion.div>
              </motion.div>
            </motion.div>
            <div className="relative">
              <HeroPlaceholder />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bullets */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Insured & background-checked cleaners</h3>
              <p className="text-sm text-gray-600">All our cleaners are thoroughly vetted and fully insured</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Easy online booking & rescheduling</h3>
              <p className="text-sm text-gray-600">Book in minutes and manage your appointments anytime</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Local support when you need it</h3>
              <p className="text-sm text-gray-600">Real people ready to help, not automated responses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance Strip */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-primary-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-gray-800 mb-3 font-semibold">
            Your home is in good hands.
          </p>
          <p className="text-gray-600 text-lg">
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
              <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        )}
      </section>

      {/* Before & After Transformations - Lazy Loaded */}
      <section ref={beforeAfterRef} data-section="beforeAfter" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See the VelocityMaid Difference</h2>
            <p className="text-xl text-gray-600">Real homes. Real transformations. See why local New Jersey families trust us.</p>
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
                <p className="text-center text-gray-600 mt-4 text-lg font-semibold">
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
                <div className="relative w-full aspect-[4/3] bg-gray-100">
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
                    image.badge === 'After' ? 'text-primary-600' : 'text-gray-900'
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
              className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-700 transition"
            >
              View Full Gallery <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose VelocityMaid?</h2>
            <p className="text-xl text-gray-600">Professional cleaning for busy Newark families</p>
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
              <div key={index} className="card-hover bg-gray-50 p-8 rounded-2xl text-center">
                <feature.icon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section ref={servicesRef} data-section="services" id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600">Comprehensive cleaning solutions for every need</p>
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
                <service.icon className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a 
                  href={bookingUrl}
                  className="mt-6 inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition"
                >
                  Book This Service <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            <p className="text-xl text-gray-600">Real experiences from real customers</p>
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
              <div key={index} className="bg-gray-50 p-8 rounded-2xl card-hover">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Transparent Pricing</h2>
            <p className="text-xl text-gray-600">No hidden fees, just clean homes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Basic Clean",
                price: "$120",
                description: "Perfect for regular maintenance",
                features: [
                  "Kitchen cleaning",
                  "Bathroom cleaning",
                  "Dusting & vacuuming",
                  "Floor mopping",
                  "Trash removal"
                ]
              },
              {
                name: "Deep Clean",
                price: "$220",
                description: "Thorough top-to-bottom cleaning",
                features: [
                  "Everything in Basic",
                  "Inside appliances",
                  "Baseboards & windows",
                  "Cabinet exteriors",
                  "Detailed bathroom scrub"
                ],
                popular: true
              },
              {
                name: "Move In/Out",
                price: "$320",
                description: "Complete property cleaning",
                features: [
                  "Everything in Deep Clean",
                  "Inside cabinets",
                  "Inside closets",
                  "Garage (if applicable)",
                  "Full property sanitization"
                ]
              }
            ].map((plan, index) => (
              <div 
                key={index} 
                className={`bg-white p-8 rounded-2xl shadow-lg card-hover ${
                  plan.popular ? 'ring-2 ring-primary-600 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary-600">{plan.price}</span>
                  <span className="text-gray-600">/service</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a 
                  href={bookingUrl}
                  className={`block text-center py-3 px-6 rounded-full font-semibold transition ${
                    plan.popular 
                      ? 'bg-primary-600 text-white hover:bg-primary-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Book Now
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-8">
            *Prices may vary based on home size and condition. Contact us for a custom quote.
          </p>
        </div>
      </section>

      {/* Join Our Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Join the VelocityMaid Team</h2>
            <p className="text-xl text-gray-600">Flexible schedules, competitive pay, and a supportive team environment</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Become a Cleaner Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 card-hover">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Become a Cleaner</h3>
                <p className="text-gray-600">Start earning with flexible hours</p>
              </div>
              <a
                href="/cleaners/apply"
                className="block w-full bg-primary-600 text-white text-center py-3 px-6 rounded-full font-semibold hover:bg-primary-700 transition"
                aria-label="Apply to become a cleaner"
              >
                Apply Now
              </a>
            </div>

            {/* Franchise Opportunity Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 card-hover">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Franchise Opportunity</h3>
                <p className="text-gray-600">Own a VelocityMaid location</p>
              </div>
              <a
                href="/franchise/apply"
                className="block w-full bg-primary-600 text-white text-center py-3 px-6 rounded-full font-semibold hover:bg-primary-700 transition"
                aria-label="Learn more about franchise opportunities"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Got questions? We've got answers</p>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "What areas do you serve?",
                answer: "We proudly serve all of New Jersey, including Newark, Jersey City, Paterson, Elizabeth, Edison, and surrounding areas. Contact us to confirm service in your specific location."
              },
              {
                question: "Do I need to provide cleaning supplies?",
                answer: "No! We bring all our own professional-grade cleaning supplies and equipment. You don't need to provide anything - just sit back and relax while we work."
              },
              {
                question: "Are you insured and bonded?",
                answer: "Yes, we are fully insured and bonded for your peace of mind. Our team is background-checked and trained to the highest standards of professionalism and safety."
              },
              {
                question: "How do I schedule a cleaning?",
                answer: "You can book online through our booking form, call us directly at (973) 280-9190, or message us on WhatsApp. We offer flexible scheduling to fit your needs."
              },
              {
                question: "What if I'm not satisfied with the cleaning?",
                answer: "We offer a 100% satisfaction guarantee. If you're not completely happy with our service, we'll return within 24 hours to make it right at no additional cost."
              },
              {
                question: "Do you offer recurring services?",
                answer: "Yes! We offer weekly, bi-weekly, and monthly recurring cleaning services at discounted rates. Contact us to set up a custom schedule that works for you."
              }
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <a 
              href={`tel:${phoneNumberTel}`}
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-700 transition"
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <Calendar className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready for a Spotless Home?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Book your cleaning service today and experience the VelocityMaid difference
          </p>
          
          {/* Security/Trust Badge */}
          <div className="bg-sky-100 border-2 border-sky-600 p-6 rounded-xl text-center max-w-[600px] my-10 mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">🔒 Safe & Secure Booking</h3>
            <p className="text-gray-700">
              Your payment information is protected by bank-level encryption. We use Stripe — your card details are never stored on our servers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={bookingUrl}
              className="bg-white text-primary-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition inline-flex items-center justify-center"
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600">We're here to answer your questions</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <a 
              href={`tel:${phoneNumberTel}`}
              className="bg-gray-50 p-8 rounded-2xl text-center card-hover"
              onClick={() => {
                sendGAEvent('event', 'phone_clicked', {
                  phone_number: phoneNumber,
                  location: 'contact_section'
                });
              }}
            >
              <Phone className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600">{phoneNumber}</p>
            </a>
            <a 
              href={`mailto:${email}`}
              className="bg-gray-50 p-8 rounded-2xl text-center card-hover"
            >
              <Mail className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">{email}</p>
            </a>
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-50 p-8 rounded-2xl text-center card-hover"
              onClick={() => {
                sendGAEvent('event', 'whatsapp_clicked', {
                  location: 'contact_section'
                });
              }}
            >
              <MessageCircle className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp</h3>
              <p className="text-gray-600">Chat with us instantly</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-8 h-8 text-primary-400" />
                <span className="text-2xl font-bold">VelocityMaid</span>
              </div>
              <p className="text-gray-400">
                Professional cleaning services you can trust.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#services" className="text-gray-400 hover:text-white transition">Services</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                <li><a href="#pay-now" className="text-gray-400 hover:text-white transition">Pay Now</a></li>
                <li><a href="#why-us" className="text-gray-400 hover:text-white transition">Why Us</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Services</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">Residential Cleaning</li>
                <li className="text-gray-400">Commercial Cleaning</li>
                <li className="text-gray-400">Deep Cleaning</li>
                <li className="text-gray-400">Move In/Out</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li><a href={`tel:${phoneNumberTel}`} className="text-gray-400 hover:text-white transition">{phoneNumber}</a></li>
                <li><a href={`mailto:${email}`} className="text-gray-400 hover:text-white transition">{email}</a></li>
                <li className="text-gray-400">New Jersey</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
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