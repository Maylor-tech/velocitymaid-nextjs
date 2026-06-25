'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Inbox,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function SaaSLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/saas" className="flex items-center space-x-2">
              <Sparkles className="w-7 h-7 text-vm-cyan-dark" />
              <span className="text-xl font-bold text-vm-text">VelocityMaid</span>
            </Link>
            <Link 
              href="/saas/signup"
              className="bg-vm-navy text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-vm-navy transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-vm-surface via-white to-vm-surface">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-vm-text mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            The Operating System for
            <span className="text-vm-cyan-dark"> Cleaning Companies</span>
          </motion.h1>
          <motion.p 
            className="text-xl sm:text-2xl text-vm-muted mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Stop chasing paperwork and start scaling your business. VelocityMaid helps you manage contractors, stay compliant, and automate communication—all in one place.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link 
              href="/saas/signup"
              className="inline-flex items-center bg-vm-navy text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-vm-navy transition-colors shadow-md hover:shadow-lg"
            >
              Start Your 14-Day Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-vm-text mb-4">Everything You Need to Scale</h2>
            <p className="text-xl text-vm-muted">Three powerful features to transform your operations</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Contractor Management */}
            <motion.div 
              className="bg-gray-50 p-8 rounded-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-16 h-16 bg-vm-surface rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-vm-cyan-dark" />
              </div>
              <h3 className="text-2xl font-bold text-vm-text mb-4">Centralize Your Team</h3>
              <p className="text-vm-muted leading-relaxed">
                Manage all your independent contractors in one dashboard. Track their status, contact information, and documents without ever touching a spreadsheet.
              </p>
            </motion.div>

            {/* Feature 2: Compliance Tracking */}
            <motion.div 
              className="bg-gray-50 p-8 rounded-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-vm-surface rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-vm-cyan-dark" />
              </div>
              <h3 className="text-2xl font-bold text-vm-text mb-4">Stay Audit-Ready</h3>
              <p className="text-vm-muted leading-relaxed">
                Automatically track W-9s, 1099 readiness, and other compliance documents. Get alerts before anything expires, so you're always prepared.
              </p>
            </motion.div>

            {/* Feature 3: Unified Inbox */}
            <motion.div 
              className="bg-gray-50 p-8 rounded-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-vm-surface rounded-full flex items-center justify-center mx-auto mb-6">
                <Inbox className="w-8 h-8 text-vm-cyan-dark" />
              </div>
              <h3 className="text-2xl font-bold text-vm-text mb-4">Govern Your Communication</h3>
              <p className="text-vm-muted leading-relaxed">
                All communication with your contractors is logged in a single, auditable inbox. No more lost texts or emails. Just a clear, professional system of record.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-vm-text mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-vm-muted">Choose the plan that fits your business</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <motion.div 
              className="bg-white p-8 rounded-2xl shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-2xl font-bold text-vm-text mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-vm-text">$99</span>
                <span className="text-vm-muted">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Up to 25 contractors</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Core Features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Email Support</span>
                </li>
              </ul>
              <Link 
                href="/saas/signup?plan=starter"
                className="block w-full text-center bg-gray-100 text-vm-text py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Choose Starter
              </Link>
            </motion.div>

            {/* Pro Plan - Most Popular */}
            <motion.div 
              className="bg-white p-8 rounded-2xl shadow-lg ring-2 ring-vm-cyan relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-vm-navy text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-vm-text mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-vm-cyan-dark">$199</span>
                <span className="text-vm-muted">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Up to 100 contractors</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Core Features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Priority Support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Document Uploads</span>
                </li>
              </ul>
              <Link 
                href="/saas/signup?plan=pro"
                className="block w-full text-center bg-vm-navy text-white py-3 px-6 rounded-lg font-semibold hover:bg-vm-navy transition"
              >
                Choose Pro
              </Link>
            </motion.div>

            {/* Business Plan */}
            <motion.div 
              className="bg-white p-8 rounded-2xl shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold text-vm-text mb-2">Business</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-vm-text">$399</span>
                <span className="text-vm-muted">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Unlimited contractors</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Core Features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Dedicated Support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-vm-text">Advanced Reporting</span>
                </li>
              </ul>
              <Link 
                href="/saas/signup?plan=business"
                className="block w-full text-center bg-gray-100 text-vm-text py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Choose Business
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-vm-navy to-vm-navy">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Scale Without the Chaos?
          </h2>
          <p className="text-xl text-vm-muted mb-8">
            Get started in 5 minutes. No credit card required for your first 14 days.
          </p>
          <Link 
            href="/saas/signup"
            className="inline-flex items-center bg-white text-vm-cyan-dark px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
          >
            Sign Up Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-8 h-8 text-vm-muted" />
            <span className="text-2xl font-bold">VelocityMaid</span>
          </div>
          <p className="text-vm-muted">
            The Operating System for Cleaning Companies
          </p>
          <p className="text-vm-muted text-sm mt-4">
            &copy; {new Date().getFullYear()} VelocityMaid. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

