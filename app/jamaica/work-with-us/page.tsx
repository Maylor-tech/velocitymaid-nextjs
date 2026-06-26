"use client";

import { Sparkles, Award, DollarSign, Clock, Users, CheckCircle, ArrowRight, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const whyJoinCards = [
  {
    icon: DollarSign,
    title: 'Competitive Pay',
    description: 'Earn competitive rates with performance bonuses and incentive programs',
  },
  {
    icon: Clock,
    title: 'Flexible Schedule',
    description: 'Work on your terms—choose your own hours and availability',
  },
  {
    icon: Award,
    title: 'Professional Training',
    description: 'We train you to deliver world-class cleaning with confidence and excellence',
  },
  {
    icon: Users,
    title: 'Growth Opportunities',
    description: 'Build your skills and access future opportunities within other VelocityMaid branches',
  },
  {
    icon: CheckCircle,
    title: 'Certification Program',
    description: 'Complete our training program and earn your Jamaica Certified Cleaner badge',
  },
  {
    icon: Sparkles,
    title: 'Community Impact',
    description: 'Serve your community and help launch a new industry standard in Jamaica',
  },
];

const faqs = [
  {
    question: 'What are the requirements to apply?',
    answer: 'You must be 18 years or older, have a valid government ID, be able to work legally in Jamaica, and have a reliable way to get to job sites. No previous cleaning experience is required—we provide comprehensive training.',
  },
  {
    question: 'How much can I earn?',
    answer: 'Our cleaners earn competitive rates starting at JMD $7,500 per standard cleaning job, with opportunities for bonuses and performance incentives. Deep clean and move-in/out jobs pay more.',
  },
  {
    question: 'What training do you provide?',
    answer: 'All cleaners complete our comprehensive Jamaica Training Program, covering professional cleaning techniques, safety protocols, and customer service. Upon completion, you\'ll receive a Jamaica Certified Cleaner certificate.',
  },
  {
    question: 'How flexible is the schedule?',
    answer: 'Very flexible! You choose your own availability and can work as little or as much as you want. We work around your schedule, whether you need part-time or full-time hours.',
  },
  {
    question: 'Do I need my own cleaning supplies?',
    answer: 'No, we provide all cleaning supplies and equipment. You just need to show up ready to work. We supply everything from cleaning products to vacuum cleaners and mops.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-vm-text">{question}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-vm-text leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function WorkWithUsPage() {
  const whatsappUrl = 'https://wa.me/18765551985?text=Hi%20VelocityMaid,%20I\'d%20like%20to%20book%20a%20cleaning%20in%20Port%20Antonio.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EmploymentAgency',
    name: 'VelocityMaid Jamaica',
    description: 'Professional cleaning services employment opportunities in Port Antonio, Jamaica',
    url: 'https://velocitymaid.com/jamaica/work-with-us',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Port Antonio',
      addressRegion: 'Portland',
      addressCountry: 'Jamaica',
    },
    telephone: '+18765551985',
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Port Antonio',
        addressRegion: 'Portland',
        addressCountry: 'Jamaica',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <Sparkles className="w-8 h-8" />
                <span className="text-2xl font-bold">VelocityMaid</span>
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/jamaica" className="text-vm-text hover:text-blue-600">Jamaica</Link>
                <Link href="/jamaica/work-with-us" className="text-vm-text hover:text-blue-600 font-medium">Work With Us</Link>
                <Link
                  href="/booking?branch=port-antonio"
                  className="bg-vm-navy text-white px-6 py-2 rounded-full font-semibold hover:bg-vm-navy transition"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-white">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-vm-text mb-6">
              Work With VelocityMaid Jamaica
            </h1>
            <p className="text-xl md:text-2xl text-vm-muted mb-8 max-w-3xl mx-auto">
              Competitive pay, flexible schedule, and professional training for local cleaners.
            </p>
            <Link
              href="/cleaners/apply?market=jamaica"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-vm-navy text-white rounded-lg font-semibold text-lg hover:bg-vm-navy transition-colors shadow-lg"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Why Join Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-vm-text mb-4">Why Join VelocityMaid?</h2>
              <p className="text-xl text-vm-muted">Build a career with professional cleaning services</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyJoinCards.map((card, index) => (
                <div key={index} className="bg-gray-50 p-8 rounded-2xl text-center hover:shadow-lg transition-shadow">
                  <card.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-vm-text mb-2">{card.title}</h3>
                  <p className="text-vm-muted">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pay Overview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-vm-text mb-4">Pay Overview (JMD)</h2>
              <p className="text-xl text-vm-muted">Competitive rates with performance bonuses</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-vm-text mb-2">Standard Clean</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">JMD $7,500</p>
                <p className="text-vm-muted">Per service</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-600">
                <div className="text-sm font-semibold text-blue-600 mb-2">MOST POPULAR</div>
                <h3 className="text-xl font-bold text-vm-text mb-2">Deep Clean</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">JMD $12,000</p>
                <p className="text-vm-muted">Per service</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-vm-text mb-2">Move In/Out</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">JMD $20,000</p>
                <p className="text-vm-muted">Per service</p>
              </div>
            </div>
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-center text-vm-text mb-4">
                <strong>Plus:</strong> Performance bonuses, referral incentives, and opportunities for advancement
              </p>
            </div>
            {/* Daily/Weekly Examples */}
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md border-2 border-vm-success/30">
                <h4 className="text-lg font-bold text-vm-text mb-3">Daily Earnings Example</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-vm-text">
                    <span>2 Standard Cleans</span>
                    <span className="font-semibold">JMD $15,000</span>
                  </div>
                  <div className="flex justify-between text-vm-text">
                    <span>1 Deep Clean</span>
                    <span className="font-semibold">JMD $12,000</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-vm-success">
                      <span>Daily Total</span>
                      <span>JMD $27,000</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-200">
                <h4 className="text-lg font-bold text-vm-text mb-3">Weekly Earnings Example</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-vm-text">
                    <span>10 Standard Cleans</span>
                    <span className="font-semibold">JMD $75,000</span>
                  </div>
                  <div className="flex justify-between text-vm-text">
                    <span>3 Deep Cleans</span>
                    <span className="font-semibold">JMD $36,000</span>
                  </div>
                  <div className="flex justify-between text-vm-text">
                    <span>1 Move In/Out</span>
                    <span className="font-semibold">JMD $20,000</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-blue-600">
                      <span>Weekly Total</span>
                      <span>JMD $131,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Training Certification Badge */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <Award className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-vm-text mb-4">Jamaica Certified Cleaner</h2>
            <p className="text-xl text-vm-muted mb-8">
              Complete our comprehensive training program and earn your certification badge. 
              This certification demonstrates your commitment to professional cleaning standards and opens doors to more opportunities.
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full px-6 py-3 font-semibold text-lg">
              <Award className="w-6 h-6" />
              <span>Jamaica Certified Cleaner</span>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-vm-text mb-4">What Our Cleaners Say</h2>
              <p className="text-xl text-vm-muted">Hear from cleaners who are building their careers with VelocityMaid</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-vm-text mb-4">
                  "VelocityMaid gave me the training and support I needed to start my cleaning business. The pay is fair and the schedule is flexible."
                </p>
                <p className="font-semibold text-vm-text">— Port Antonio Cleaner</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-vm-text mb-4">
                  "I love that I can work around my family schedule. The certification program helped me feel confident in my skills."
                </p>
                <p className="font-semibold text-vm-text">— Port Antonio Cleaner</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-vm-text mb-4">
                  "The bonuses and incentives make a real difference. I'm earning more than I expected and building a real career."
                </p>
                <p className="font-semibold text-vm-text">— Port Antonio Cleaner</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-vm-text mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-vm-muted">Got questions? We've got answers</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-vm-navy text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Join Our Team?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Start your application today and be part of launching professional cleaning services in Port Antonio
            </p>
            <Link
              href="/cleaners/apply?market=jamaica"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold">VelocityMaid</span>
                </div>
                <p className="text-vm-muted">Professional cleaning services across Jamaica</p>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link href="/jamaica" className="text-vm-muted hover:text-white transition">Jamaica</Link></li>
                  <li><Link href="/jamaica/work-with-us" className="text-vm-muted hover:text-white transition">Work With Us</Link></li>
                  <li><Link href="/locations/port-antonio" className="text-vm-muted hover:text-white transition">Port Antonio</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Contact</h4>
                <ul className="space-y-2 text-vm-muted">
                  <li>Port Antonio, Portland, Jamaica</li>
                  <li><a href="tel:+18765551985" className="hover:text-white transition">+1 (876) 555-1985</a></li>
                  <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">WhatsApp Us</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-vm-muted">
              <p>&copy; {new Date().getFullYear()} VelocityMaid. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* WhatsApp Floating CTA */}
        <div className="fixed bottom-6 right-6 z-50">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-vm-success text-white p-4 rounded-full shadow-lg hover:bg-vm-success transition cursor-pointer group"
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

