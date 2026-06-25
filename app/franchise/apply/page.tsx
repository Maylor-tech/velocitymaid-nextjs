"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, DollarSign, MapPin, User, Mail, Phone, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Location
  city: string;
  state: string;
  country: string;
  zipCode: string;
  marketSize: string;
  
  // Business Experience
  hasBusinessExperience: boolean;
  businessExperience: string;
  hasCleaningExperience: boolean;
  cleaningExperience: string;
  
  // Financial
  investmentRange: string;
  liquidCapital: string;
  netWorth: string;
  financingNeeded: boolean;
  
  // Goals
  timeline: string;
  targetMarket: string;
  expectedRevenue: string;
  
  // Additional
  howDidYouHear: string;
  questions: string;
}

export default function FranchiseApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: 'United States',
    zipCode: '',
    marketSize: '',
    hasBusinessExperience: false,
    businessExperience: '',
    hasCleaningExperience: false,
    cleaningExperience: '',
    investmentRange: '',
    liquidCapital: '',
    netWorth: '',
    financingNeeded: false,
    timeline: '',
    targetMarket: '',
    expectedRevenue: '',
    howDidYouHear: '',
    questions: '',
  });

  const steps = [
    { id: 'personal', title: 'Personal Information' },
    { id: 'location', title: 'Location & Market' },
    { id: 'experience', title: 'Business Experience' },
    { id: 'financial', title: 'Financial Information' },
    { id: 'goals', title: 'Goals & Timeline' },
    { id: 'review', title: 'Review & Submit' },
  ];

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone);
      case 1:
        return !!(formData.city && formData.state && formData.zipCode);
      case 2:
        return true; // Optional
      case 3:
        return !!(formData.investmentRange && formData.liquidCapital);
      case 4:
        return !!(formData.timeline && formData.targetMarket);
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      setError('Please complete all required fields');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);
      return;
    }

    // Final submission
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/franchise/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/franchise/thank-you');
        }, 3000);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-vm-text">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-vm-text">Location & Market</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleFieldChange('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  required
                  maxLength={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Market Size
                </label>
                <select
                  value={formData.marketSize}
                  onChange={(e) => handleFieldChange('marketSize', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                >
                  <option value="">Select market size</option>
                  <option value="small">Small (Under 50K population)</option>
                  <option value="medium">Medium (50K-200K population)</option>
                  <option value="large">Large (200K-500K population)</option>
                  <option value="metro">Metro (500K+ population)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-vm-text">Business Experience</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasBusinessExperience"
                  checked={formData.hasBusinessExperience}
                  onChange={(e) => handleFieldChange('hasBusinessExperience', e.target.checked)}
                  className="w-5 h-5 text-vm-cyan-dark focus:ring-vm-cyan border-gray-300 rounded"
                />
                <label htmlFor="hasBusinessExperience" className="text-sm font-medium text-vm-text">
                  I have previous business ownership/management experience
                </label>
              </div>
              {formData.hasBusinessExperience && (
                <div>
                  <label className="block text-sm font-medium text-vm-text mb-2">
                    Please describe your business experience
                  </label>
                  <textarea
                    value={formData.businessExperience}
                    onChange={(e) => handleFieldChange('businessExperience', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                    placeholder="Describe your business ownership, management, or entrepreneurial experience..."
                  />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasCleaningExperience"
                  checked={formData.hasCleaningExperience}
                  onChange={(e) => handleFieldChange('hasCleaningExperience', e.target.checked)}
                  className="w-5 h-5 text-vm-cyan-dark focus:ring-vm-cyan border-gray-300 rounded"
                />
                <label htmlFor="hasCleaningExperience" className="text-sm font-medium text-vm-text">
                  I have experience in the cleaning/service industry
                </label>
              </div>
              {formData.hasCleaningExperience && (
                <div>
                  <label className="block text-sm font-medium text-vm-text mb-2">
                    Please describe your cleaning industry experience
                  </label>
                  <textarea
                    value={formData.cleaningExperience}
                    onChange={(e) => handleFieldChange('cleaningExperience', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                    placeholder="Describe your experience in cleaning or service industries..."
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-vm-text">Financial Information</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                This information is confidential and used only to assess franchise eligibility.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Investment Range *
                </label>
                <select
                  value={formData.investmentRange}
                  onChange={(e) => handleFieldChange('investmentRange', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                >
                  <option value="">Select range</option>
                  <option value="25k-50k">$25,000 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-200k">$100,000 - $200,000</option>
                  <option value="200k+">$200,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Liquid Capital Available *
                </label>
                <select
                  value={formData.liquidCapital}
                  onChange={(e) => handleFieldChange('liquidCapital', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                >
                  <option value="">Select range</option>
                  <option value="25k-50k">$25,000 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-200k">$100,000 - $200,000</option>
                  <option value="200k+">$200,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Net Worth
                </label>
                <select
                  value={formData.netWorth}
                  onChange={(e) => handleFieldChange('netWorth', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                >
                  <option value="">Select range</option>
                  <option value="100k-250k">$100,000 - $250,000</option>
                  <option value="250k-500k">$250,000 - $500,000</option>
                  <option value="500k-1m">$500,000 - $1,000,000</option>
                  <option value="1m+">$1,000,000+</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  id="financingNeeded"
                  checked={formData.financingNeeded}
                  onChange={(e) => handleFieldChange('financingNeeded', e.target.checked)}
                  className="w-5 h-5 text-vm-cyan-dark focus:ring-vm-cyan border-gray-300 rounded"
                />
                <label htmlFor="financingNeeded" className="text-sm font-medium text-vm-text">
                  I will need financing assistance
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-vm-text">Goals & Timeline</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Timeline to Launch *
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => handleFieldChange('timeline', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                >
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate (0-3 months)</option>
                  <option value="short">Short-term (3-6 months)</option>
                  <option value="medium">Medium-term (6-12 months)</option>
                  <option value="long">Long-term (12+ months)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Target Market *
                </label>
                <select
                  value={formData.targetMarket}
                  onChange={(e) => handleFieldChange('targetMarket', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                >
                  <option value="">Select target market</option>
                  <option value="residential">Residential Only</option>
                  <option value="commercial">Commercial Only</option>
                  <option value="both">Both Residential & Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Expected First Year Revenue
                </label>
                <select
                  value={formData.expectedRevenue}
                  onChange={(e) => handleFieldChange('expectedRevenue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                >
                  <option value="">Select range</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-250k">$100,000 - $250,000</option>
                  <option value="250k-500k">$250,000 - $500,000</option>
                  <option value="500k+">$500,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  How did you hear about us?
                </label>
                <select
                  value={formData.howDidYouHear}
                  onChange={(e) => handleFieldChange('howDidYouHear', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                >
                  <option value="">Select source</option>
                  <option value="website">Website</option>
                  <option value="social-media">Social Media</option>
                  <option value="referral">Referral</option>
                  <option value="advertisement">Advertisement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Questions or Additional Information
                </label>
                <textarea
                  value={formData.questions}
                  onChange={(e) => handleFieldChange('questions', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent outline-none"
                  placeholder="Any questions or additional information you'd like to share..."
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-vm-text">Review Your Application</h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-vm-text mb-2">Personal Information</h3>
                <p className="text-vm-muted">{formData.firstName} {formData.lastName}</p>
                <p className="text-vm-muted">{formData.email}</p>
                <p className="text-vm-muted">{formData.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-vm-text mb-2">Location</h3>
                <p className="text-vm-muted">{formData.city}, {formData.state} {formData.zipCode}</p>
              </div>
              <div>
                <h3 className="font-semibold text-vm-text mb-2">Financial Information</h3>
                <p className="text-vm-muted">Investment Range: {formData.investmentRange}</p>
                <p className="text-vm-muted">Liquid Capital: {formData.liquidCapital}</p>
              </div>
              <div>
                <h3 className="font-semibold text-vm-text mb-2">Timeline</h3>
                <p className="text-vm-muted">{formData.timeline}</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                By submitting this application, you agree to our terms and understand that this is not a guarantee of franchise approval.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vm-surface to-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-vm-text mb-4">Application Submitted!</h1>
          <p className="text-vm-muted mb-6">
            Thank you for your interest in franchising with VelocityMaid. We'll review your application and get back to you within 2-3 business days.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-vm-navy text-white rounded-lg font-semibold hover:bg-vm-navy transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vm-surface to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-vm-cyan-dark" />
            <span className="text-2xl font-bold text-vm-text">VelocityMaid</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-vm-text mb-4">Franchise Application</h1>
          <p className="text-xl text-vm-muted">
            Join the VelocityMaid family and bring professional cleaning services to your community
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      index === currentStep
                        ? 'bg-vm-navy text-white'
                        : index < currentStep
                        ? 'bg-vm-success text-white'
                        : 'bg-gray-200 text-vm-muted'
                    }`}
                  >
                    {index < currentStep ? <CheckCircle className="w-6 h-6" /> : index + 1}
                  </div>
                  <p className={`text-xs mt-2 text-center ${index === currentStep ? 'text-vm-cyan-dark font-semibold' : 'text-vm-muted'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      index < currentStep ? 'bg-vm-success' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {renderStepContent()}

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-gray-200 text-vm-text rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:bg-gray-100 disabled:text-vm-muted disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : currentStep === steps.length - 1 ? (
                <>
                  Submit Application
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



