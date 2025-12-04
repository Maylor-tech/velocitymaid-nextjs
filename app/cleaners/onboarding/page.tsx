"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CreditCard, Shield, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import CleanerHeader from '../components/CleanerHeader';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function CleanerOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ssn: '', // Last 4 digits only
    
    // Step 2: ID Upload
    idType: 'drivers_license' as 'drivers_license' | 'passport' | 'state_id',
    idFront: null as File | null,
    idBack: null as File | null,
    idUploaded: false,
    
    // Step 3: Background Check
    backgroundCheckConsent: false,
    backgroundCheckCompleted: false,
    
    // Step 4: Bank Details
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
  });

  const steps: OnboardingStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic details and contact information',
      completed: !!(formData.firstName && formData.lastName && formData.email && formData.phone && formData.dateOfBirth),
    },
    {
      id: 'id',
      title: 'ID Verification',
      description: 'Upload government-issued ID',
      completed: formData.idUploaded,
    },
    {
      id: 'background',
      title: 'Background Check',
      description: 'Complete background verification',
      completed: formData.backgroundCheckCompleted,
    },
    {
      id: 'banking',
      title: 'Bank Details',
      description: 'Set up payment information',
      completed: !!(formData.bankName && formData.accountNumber && formData.routingNumber),
    },
  ];

  const handleFileUpload = (field: 'idFront' | 'idBack', file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    if (file && !file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setFormData({ ...formData, [field]: file });
    setError(null);
  };

  const handleIDUpload = async () => {
    if (!formData.idFront) {
      setError('Please upload the front of your ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('idType', formData.idType);
      uploadData.append('idFront', formData.idFront);
      if (formData.idBack) {
        uploadData.append('idBack', formData.idBack);
      }

      const response = await fetch('/api/cleaners/onboarding/upload-id', {
        method: 'POST',
        body: uploadData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ ...formData, idUploaded: true });
        setCurrentStep(2); // Move to background check
      } else {
        setError(data.error || 'Failed to upload ID');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload ID');
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundCheck = async () => {
    if (!formData.backgroundCheckConsent) {
      setError('Please consent to the background check');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cleaners/onboarding/background-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          ssn: formData.ssn,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ ...formData, backgroundCheckCompleted: true });
        setCurrentStep(3); // Move to banking
      } else {
        setError(data.error || 'Background check failed');
      }
    } catch (err: any) {
      setError(err.message || 'Background check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cleaners/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/cleaners/dashboard');
      } else {
        setError(data.error || 'Failed to complete onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            <p className="text-gray-600">Please provide your basic information to get started.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SSN (Last 4 digits) *
                </label>
                <input
                  type="text"
                  value={formData.ssn}
                  onChange={(e) => setFormData({ ...formData, ssn: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  required
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="1234"
                />
                <p className="text-xs text-gray-500 mt-1">We only need the last 4 digits for verification</p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">ID Verification</h2>
            <p className="text-gray-600">Upload a clear photo of your government-issued ID.</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Type *
              </label>
              <select
                value={formData.idType}
                onChange={(e) => setFormData({ ...formData, idType: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="drivers_license">Driver's License</option>
                <option value="state_id">State ID</option>
                <option value="passport">Passport</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Front of ID *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('idFront', e.target.files?.[0] || null)}
                    className="hidden"
                    id="idFront"
                  />
                  <label htmlFor="idFront" className="cursor-pointer">
                    {formData.idFront ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="text-sm text-gray-600">{formData.idFront.name}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Click to upload</p>
                        <p className="text-xs text-gray-500">Max 5MB, JPG/PNG</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Back of ID {formData.idType === 'passport' ? '(Optional)' : '*'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('idBack', e.target.files?.[0] || null)}
                    className="hidden"
                    id="idBack"
                  />
                  <label htmlFor="idBack" className="cursor-pointer">
                    {formData.idBack ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="text-sm text-gray-600">{formData.idBack.name}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Click to upload</p>
                        <p className="text-xs text-gray-500">Max 5MB, JPG/PNG</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Security:</strong> Your ID is encrypted and stored securely. We use it only for verification purposes.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Background Check</h2>
            <p className="text-gray-600">We need to verify your background for safety and security.</p>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What We Check</h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Criminal background check</li>
                    <li>Identity verification</li>
                    <li>Employment eligibility</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Your Privacy</h3>
                  <p className="text-sm text-gray-600">
                    Background checks are conducted by a third-party service. Your information is kept confidential and secure.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="backgroundCheckConsent"
                checked={formData.backgroundCheckConsent}
                onChange={(e) => setFormData({ ...formData, backgroundCheckConsent: e.target.checked })}
                className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
              />
              <label htmlFor="backgroundCheckConsent" className="text-sm text-gray-700">
                I consent to a background check and understand that this is required for employment with VelocityMaid. *
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Bank Details</h2>
            <p className="text-gray-600">Set up your payment information for direct deposit.</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Secure:</strong> Your banking information is encrypted and stored securely. We use bank-level encryption.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Chase Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Number *
                </label>
                <input
                  type="text"
                  value={formData.routingNumber}
                  onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                  required
                  maxLength={9}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono"
                  placeholder="123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type *
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CleanerHeader removed - not needed for onboarding */}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Onboarding</h1>
          <p className="text-gray-600">Finish setting up your account to start accepting jobs</p>
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
                        ? 'bg-primary-600 text-white'
                        : step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${index === currentStep ? 'text-primary-600' : 'text-gray-600'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  handleIDUpload();
                } else if (currentStep === 2) {
                  handleBackgroundCheck();
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Completing...
                </>
              ) : (
                <>
                  Complete Onboarding
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

