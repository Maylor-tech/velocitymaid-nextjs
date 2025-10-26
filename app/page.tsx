'use client';

import { useState, useEffect } from 'react';
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
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  CreditCard  // ← ADDED FOR PAYMENT SECTION
} from 'lucide-react';

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

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const bookingUrl = "https://forms.gle/sFQWSPxtgKmrnFEy5";
  const phoneNumber = "(973) 280-9190";
  const whatsappNumber = "19732809190";
  const email = "hello@velocitymaid.com";

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">VelocityMaid</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-primary-600 transition">Services</a>
              <a href="#why-us" className="text-gray-700 hover:text-primary-600 transition">Why Us</a>
              <a href="#testimonials" className="text-gray-700 hover:text-primary-600 transition">Reviews</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary-600 transition">Pricing</a>
              <a href="#pay-now" className="text-gray-700 hover:text-primary-600 transition">Pay Now</a>
              <a href="#faq" className="text-gray-700 hover:text-primary-600 transition">FAQ</a>
              <a href="#contact" className="text-gray-700 hover:text-primary-600 transition">Contact</a>
              <a 
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-primary-700 transition"
              >
                Book Now
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                <a href="#services" className="text-gray-700 hover:text-primary-600 transition" onClick={() => setIsMenuOpen(false)}>Services</a>
                <a href="#why-us" className="text-gray-700 hover:text-primary-600 transition" onClick={() => setIsMenuOpen(false)}>Why Us</a>
                <a href="#testimonials" className="text-gray-700 hover:text-primary-600 transition" onClick={() => setIsMenuOpen(false)}>Reviews</a>
                <a href="#pricing" className="text-gray-700 hover:text-primary-600 transition" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                <a href="#pay-now" className="text-gray-700 hover:text-primary-600 transition" onClick={() => setIsMenuOpen(false)}>Pay Now</a>
                <a href="#faq" className="text-gray-700 hover:text-primary-600 transition" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                <a href="#contact" className="text-gray-700 hover:text-primary-600 transition" onClick={() => setIsMenuOpen(false)}>Contact</a>
                <a 
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-600 text-white px-6 py-2 rounded-full font-semibold text-center hover:bg-primary-700 transition"
                >
                  Book Now
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fadeIn">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Sparkling Clean Homes,
                <span className="text-primary-600"> Lightning Fast</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Professional cleaning services that fit your schedule. Experience the VelocityMaid difference today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center justify-center"
                >
                  Book Your Cleaning <ArrowRight className="ml-2 w-5 h-5" />
                </a>
                <a 
                  href={`tel:${phoneNumber}`}
                  className="btn-secondary inline-flex items-center justify-center"
                >
                  <Phone className="mr-2 w-5 h-5" /> Call {phoneNumber}
                </a>
              </div>
              <div className="mt-8 flex items-center gap-8">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="ml-2 text-gray-600">5.0 Rating</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-bold text-primary-600">500+</span> Happy Clients
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop"
                alt="Professional cleaning"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose VelocityMaid?</h2>
            <p className="text-xl text-gray-600">Experience the difference of professional cleaning</p>
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
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
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
                  target="_blank"
                  rel="noopener noreferrer"
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
                name: "Sarah Johnson",
                location: "Newark, NJ",
                text: "VelocityMaid transformed my home! Their attention to detail is incredible. I've been using their service for 6 months and couldn't be happier.",
                rating: 5
              },
              {
                name: "Michael Chen",
                location: "Jersey City, NJ",
                text: "As a busy professional, I don't have time for deep cleaning. VelocityMaid has been a lifesaver. They're reliable, thorough, and professional.",
                rating: 5
              },
              {
                name: "Lisa Rodriguez",
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
                  target="_blank"
                  rel="noopener noreferrer"
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

      {/* Payment Section - NEW! */}
      <section id="pay-now" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <CreditCard className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Pay Your Invoice</h2>
            <p className="text-xl text-gray-600">Service complete? Pay securely online in seconds</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Basic Clean Payment */}
            <a
              href="https://buy.stripe.com/6oU7sNeGc5P7g47"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-600 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic Clean</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary-600">$120</span>
                </div>
                <p className="text-gray-600 mb-6 text-sm">1-2 bedroom standard cleaning</p>
                <div className="bg-primary-600 group-hover:bg-primary-700 text-white py-3 px-6 rounded-full font-semibold transition flex items-center justify-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Now
                </div>
              </div>
            </a>

            {/* Deep Clean Payment */}
            <a
              href="https://buy.stripe.com/00w28t8Gc5P7g47"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-primary-600 transform hover:-translate-y-1 relative"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Deep Clean</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary-600">$220</span>
                </div>
                <p className="text-gray-600 mb-6 text-sm">1-2 bedroom deep cleaning</p>
                <div className="bg-primary-600 group-hover:bg-primary-700 text-white py-3 px-6 rounded-full font-semibold transition flex items-center justify-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Now
                </div>
              </div>
            </a>

            {/* Move-Out Payment */}
            <a
              href="https://buy.stripe.com/cNi3cx8Gc5P7g47"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-600 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Move-Out</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary-600">$320</span>
                </div>
                <p className="text-gray-600 mb-6 text-sm">Complete property cleaning</p>
                <div className="bg-primary-600 group-hover:bg-primary-700 text-white py-3 px-6 rounded-full font-semibold transition flex items-center justify-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Now
                </div>
              </div>
            </a>

            {/* Custom Amount Payment */}
            <a
              href="https://buy.stripe.com/14AcN7eGc9K52CcMcU27AI04"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-600 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Custom Quote</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary-600">Varies</span>
                </div>
                <p className="text-gray-600 mb-6 text-sm">Enter your quoted amount</p>
                <div className="bg-gray-700 group-hover:bg-gray-800 text-white py-3 px-6 rounded-full font-semibold transition flex items-center justify-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Custom
                </div>
              </div>
            </a>
          </div>

          {/* Security Badges */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="font-semibold">256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-500" />
                <span className="font-semibold">PCI Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="font-semibold">All Major Cards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="font-semibold">Instant Receipt</span>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
              Powered by Stripe - Trusted by millions worldwide
            </p>
          </div>

          {/* Help Text */}
          <div className="text-center mt-12">
            <p className="text-gray-700 mb-4">
              <strong>Need help?</strong> Contact us and we'll assist you with payment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href={`tel:${phoneNumber}`}
                className="inline-flex items-center bg-white text-primary-600 border-2 border-primary-600 px-6 py-3 rounded-full font-semibold hover:bg-primary-50 transition"
              >
                <Phone className="mr-2 w-5 h-5" /> {phoneNumber}
              </a>
              <a 
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition"
              >
                <MessageCircle className="mr-2 w-5 h-5" /> WhatsApp Support
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
              href={`tel:${phoneNumber}`}
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-700 transition"
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-primary-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition inline-flex items-center justify-center"
            >
              Book Online Now <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-green-600 transition inline-flex items-center justify-center"
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
              href={`tel:${phoneNumber}`}
              className="bg-gray-50 p-8 rounded-2xl text-center card-hover"
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
                <li><a href={`tel:${phoneNumber}`} className="text-gray-400 hover:text-white transition">{phoneNumber}</a></li>
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
        >
          <MessageCircle className="w-6 h-6" />
          <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            Chat on WhatsApp!
          </div>
        </a>
      </div>
    </div>
  );
}