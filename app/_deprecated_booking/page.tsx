"use client";

import { useState, useEffect, Suspense } from 'react';
import { Calendar, Clock, Home, Sparkles, ArrowRight, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';
import { getBranchPricingForBooking } from '@/utils/branchPricing';

interface FormData {
  firstName: string;
  lastInitial: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  addOns: {
    laundry: boolean;
    windows: boolean;
    oven: boolean;
    refrigerator: boolean;
  };
  specialInstructions: string;
  serviceLocation: 'new_jersey' | 'vermont' | 'miami';
}

// Default prices (fallback)
const DEFAULT_SERVICE_PRICES: Record<string, number> = {
  basic: 120,
  deep: 220,
  moveInOut: 320,
};

const DEFAULT_ADDON_PRICES = {
  laundry: 15,
  windows: 20,
  oven: 30,
  refrigerator: 25,
};

function BookingPageContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastInitial: '',
    phone: '',
    email: '',
    address: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    serviceLocation: 'new_jersey', // Default to New Jersey
    addOns: {
      laundry: false,
      windows: false,
      oven: false,
      refrigerator: false,
    },
    specialInstructions: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [branchPricing, setBranchPricing] = useState<{
    branchId: string | null;
    branchSlug: string | null;
    prices: {
      basic: number;
      deep: number;
      moveInOut: number;
      addOns: {
        laundry: number;
        windows: number;
        oven: number;
        refrigerator: number;
      };
    };
  } | null>(null);
  const [extractedZipCode, setExtractedZipCode] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [portAntonioServiceAreas, setPortAntonioServiceAreas] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedRoutingCode, setSelectedRoutingCode] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<'JMD' | 'USD'>('JMD'); // Default to JMD for Port Antonio
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoData, setPromoData] = useState<{ title: string; discountType: string; discountValue: number } | null>(null);
  const [multiCurrencyPricing, setMultiCurrencyPricing] = useState<{
    supportsMultiCurrency: boolean;
    packages: Array<{
      code: string;
      name: string;
      jmdPrice?: number;
      usdPrice?: number;
      basePrice: number;
      hours: number;
    }>;
    addons: {
      laundry: number;
      fridge: number;
      oven: number;
      windows_per_room: number;
    };
  } | null>(null);

  // Read branch and zip from query params
  useEffect(() => {
    const branchParam = searchParams.get('branch');
    const zipParam = searchParams.get('zip');
    const refParam = searchParams.get('ref');
    
    if (branchParam) {
      setSelectedBranch(branchParam);
      
      // If Port Antonio, fetch service areas and pricing
      if (branchParam === 'port-antonio') {
        fetchPortAntonioServiceAreas();
        fetchPortAntonioPricing();
      }
    }
    
    if (zipParam) {
      setExtractedZipCode(zipParam);
      if (branchParam === 'port-antonio') {
        setSelectedRoutingCode(zipParam.toUpperCase());
      }
    }
    
    // Handle promo code
    const promoParam = searchParams.get('promo');
    if (promoParam) {
      setPromoCode(promoParam);
      // Fetch promo data
      fetch(`/api/promo/validate?branch=${branchParam || 'new-jersey'}&promo=${promoParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.promo) {
            setPromoData(data.promo);
          }
        })
        .catch(err => console.error('Failed to fetch promo:', err));
    }
    
    // Handle referral code
    if (refParam) {
      setReferralCode(refParam);
      setReferralDiscount(20); // $20 discount
      // Store in sessionStorage for later use
      sessionStorage.setItem('referralCode', refParam);
    }
    
    // Legacy location param support
    const locationParam = searchParams.get('location');
    if (locationParam === 'vermont') {
      setFormData(prev => ({
        ...prev,
        serviceLocation: 'vermont',
      }));
    }
    if (locationParam === 'new_jersey') {
      setFormData(prev => ({
        ...prev,
        serviceLocation: 'new_jersey',
      }));
    }
  }, [searchParams]);

  // Fetch Port Antonio service areas
  const fetchPortAntonioServiceAreas = async () => {
    try {
      const response = await fetch('/api/admin/branches/port-antonio');
      const data = await response.json();
      if (data.success && data.branch?.serviceAreas) {
        const areas = data.branch.serviceAreas
          .filter((area: any) => area.zipCode.startsWith('PA-'))
          .map((area: any) => ({
            code: area.zipCode,
            name: area.city || area.zipCode.replace('PA-', ''),
          }));
        setPortAntonioServiceAreas(areas);
      }
    } catch (err) {
      console.error('Error fetching Port Antonio service areas:', err);
      // Fallback to default routing codes
      setPortAntonioServiceAreas([
        { code: 'PA-100', name: 'Port Antonio' },
        { code: 'PA-101', name: 'Boundbrook' },
        { code: 'PA-102', name: 'Bryan\'s Bay' },
        { code: 'PA-103', name: 'Drapers' },
        { code: 'PA-104', name: 'Fairy Hill' },
        { code: 'PA-105', name: 'San San' },
        { code: 'PA-106', name: 'Anchovy' },
        { code: 'PA-107', name: 'Norwich' },
        { code: 'PA-108', name: 'Boston' },
        { code: 'PA-109', name: 'Long Bay' },
      ]);
    }
  };

  // Fetch Port Antonio multi-currency pricing
  const fetchPortAntonioPricing = async () => {
    try {
      const response = await fetch('/api/branches/port-antonio/pricing');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.pricing) {
          setMultiCurrencyPricing(data.pricing);
        }
      }
    } catch (error) {
      console.error('Error fetching Port Antonio pricing:', error);
    }
  };

  // Track booking_started event when page loads
  useEffect(() => {
    const locationDisplayName = formData.serviceLocation === 'vermont' ? 'Vermont' : formData.serviceLocation === 'miami' ? 'Miami' : 'New Jersey';
    sendGAEvent('event', 'booking_started', {
      page_path: '/booking',
      page_title: 'Booking Page',
      location: locationDisplayName
    });
  }, [formData.serviceLocation]);

  // Extract ZIP code from address (only for non-Port Antonio branches)
  useEffect(() => {
    if (selectedBranch === 'port-antonio') {
      // For Port Antonio, use selected routing code
      setExtractedZipCode(selectedRoutingCode || null);
      return;
    }
    
    if (formData.address) {
      // Try to extract ZIP code from address (US format: 5 digits)
      const zipMatch = formData.address.match(/\b\d{5}\b/);
      if (zipMatch) {
        setExtractedZipCode(zipMatch[0]);
      } else {
        setExtractedZipCode(null);
      }
    } else {
      setExtractedZipCode(null);
    }
  }, [formData.address, selectedBranch, selectedRoutingCode]);

  // Load branch pricing when ZIP or location changes
  useEffect(() => {
    const pricing = getBranchPricingForBooking(extractedZipCode || undefined, formData.serviceLocation);
    setBranchPricing(pricing);
  }, [extractedZipCode, formData.serviceLocation]);

  // Calculate total price using branch pricing or multi-currency pricing
  useEffect(() => {
    let total = 0;
    
    // Port Antonio with multi-currency pricing
    if (selectedBranch === 'port-antonio' && multiCurrencyPricing && formData.serviceType) {
      const serviceCodeMap: Record<string, string> = {
        basic: 'STANDARD_CLEAN',
        deep: 'DEEP_CLEAN',
        moveInOut: 'MOVE_IN_OUT',
      };
      const packageCode = serviceCodeMap[formData.serviceType];
      if (packageCode) {
        const pkg = multiCurrencyPricing.packages.find(p => p.code === packageCode);
        if (pkg) {
          total += selectedCurrency === 'JMD' ? (pkg.jmdPrice || pkg.basePrice) : (pkg.usdPrice || pkg.basePrice);
        }
      }
      
      // Add-ons
      if (formData.addOns.laundry) {
        total += selectedCurrency === 'JMD' 
          ? multiCurrencyPricing.addons.laundry 
          : Math.round(multiCurrencyPricing.addons.laundry / 150); // Approximate USD conversion
      }
      if (formData.addOns.windows) {
        total += selectedCurrency === 'JMD'
          ? multiCurrencyPricing.addons.windows_per_room
          : Math.round(multiCurrencyPricing.addons.windows_per_room / 150);
      }
      if (formData.addOns.oven) {
        total += selectedCurrency === 'JMD'
          ? multiCurrencyPricing.addons.oven
          : Math.round(multiCurrencyPricing.addons.oven / 150);
      }
      if (formData.addOns.refrigerator) {
        total += selectedCurrency === 'JMD'
          ? multiCurrencyPricing.addons.fridge
          : Math.round(multiCurrencyPricing.addons.fridge / 150);
      }
    } else if (formData.serviceType && branchPricing) {
      // Standard U.S. branch pricing
      const servicePrice = branchPricing.prices[formData.serviceType as keyof typeof branchPricing.prices];
      if (typeof servicePrice === 'number') {
        total += servicePrice;
      }
    } else if (formData.serviceType) {
      // Fallback to default pricing
      total += DEFAULT_SERVICE_PRICES[formData.serviceType] || 0;
    }
    
    // Apply promo discount
    if (promoData && total > 0) {
      if (promoData.discountType === 'percent') {
        const discount = (total * promoData.discountValue) / 100;
        setPromoDiscount(discount);
        total -= discount;
      } else if (promoData.discountType === 'fixed') {
        const discount = Math.min(promoData.discountValue, total);
        setPromoDiscount(discount);
        total -= discount;
      }
    } else {
      setPromoDiscount(0);
    }
    
    if (selectedBranch !== 'port-antonio' && branchPricing) {
      if (formData.addOns.laundry) total += branchPricing.prices.addOns.laundry;
      if (formData.addOns.windows) total += branchPricing.prices.addOns.windows;
      if (formData.addOns.oven) total += branchPricing.prices.addOns.oven;
      if (formData.addOns.refrigerator) total += branchPricing.prices.addOns.refrigerator;
    } else if (selectedBranch !== 'port-antonio') {
      // Fallback to default pricing
      if (formData.addOns.laundry) total += DEFAULT_ADDON_PRICES.laundry;
      if (formData.addOns.windows) total += DEFAULT_ADDON_PRICES.windows;
      if (formData.addOns.oven) total += DEFAULT_ADDON_PRICES.oven;
      if (formData.addOns.refrigerator) total += DEFAULT_ADDON_PRICES.refrigerator;
    }
    
    setTotalPrice(total);
  }, [formData.serviceType, formData.addOns, branchPricing, selectedBranch, multiCurrencyPricing, selectedCurrency, promoData]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (30 days from today)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    handleFieldChange('phone', formatted);
  };


  // Individual field validation functions
  const validateField = (field: keyof FormData, value: any): string => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      case 'lastInitial':
        if (!value.trim()) return 'Last initial is required';
        if (!/^[A-Z]$/.test(value)) return 'Please enter exactly one letter';
        return '';
      case 'phone':
        const phoneDigits = value.replace(/\D/g, '');
        if (!phoneDigits) return 'Phone number is required';
        if (phoneDigits.length !== 10) return 'Please enter a valid 10-digit phone number';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address (e.g., john@example.com)';
        return '';
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 10) return 'Please enter a complete address (at least 10 characters)';
        return '';
      case 'serviceType':
        if (!value) return 'Please select a service type';
        return '';
      case 'preferredDate':
        if (!value) return 'Please select a preferred date';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        if (selectedDate < today) return 'Date cannot be in the past';
        if (selectedDate > maxDate) return 'Date must be within the next 30 days';
        return '';
      case 'preferredTime':
        if (!value) return 'Please select a preferred time';
        return '';
      default:
        return '';
    }
  };

  // Handle blur event for real-time validation
  const handleBlur = (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: error });
  };

  // Clear error when user starts typing
  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error if field was previously touched and is now valid
    if (touched[field]) {
      const error = validateField(field, value);
      if (!error) {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
      } else {
        setErrors({ ...errors, [field]: error });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const fieldsToValidate: (keyof FormData)[] = [
      'firstName', 'lastInitial', 'phone', 'email', 'address',
      'serviceType', 'preferredDate', 'preferredTime'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validate routing code for Port Antonio
    if (selectedBranch === 'port-antonio' && !selectedRoutingCode) {
      // Add a custom error for routing code
      alert('Please select an Area Code for your location in Port Antonio.');
      return false;
    }

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastInitial: true,
      phone: true,
      email: true,
      address: true,
      serviceType: true,
      preferredDate: true,
      preferredTime: true,
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert serviceLocation value to display name for API
      const locationDisplayName = formData.serviceLocation === 'vermont' ? 'Vermont' : formData.serviceLocation === 'miami' ? 'Miami' : 'New Jersey';
      
          const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          serviceLocation: locationDisplayName, // Send display name to API
          totalPrice,
          zipCode: selectedBranch === 'port-antonio' ? selectedRoutingCode : extractedZipCode, // Send ZIP code or routing code for branch routing
          branchId: branchPricing?.branchId || (selectedBranch === 'port-antonio' ? branchPricing?.branchId : null), // Send branch ID if resolved
          currency: selectedBranch === 'port-antonio' ? selectedCurrency : 'USD', // Send currency for Port Antonio
          referralCode: referralCode || null, // Send referral code if present
          referralDiscount: referralDiscount || 0, // Send discount amount
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Track booking_submitted event
        const locationDisplayName = formData.serviceLocation === 'vermont' ? 'Vermont' : formData.serviceLocation === 'miami' ? 'Miami' : 'New Jersey';
        sendGAEvent('event', 'booking_submitted', {
          service_type: formData.serviceType,
          total_price: totalPrice,
          has_addons: Object.values(formData.addOns).some(v => v),
          location: locationDisplayName
        });
        
        // Handle JMD (local payment) vs USD (Stripe) redirects
        if (data.redirectUrl) {
          // JMD booking - redirect to success page
          window.location.href = data.redirectUrl;
        } else if (data.url) {
          // USD booking - redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          alert(data.message || 'Booking confirmed!');
          setIsSubmitting(false);
        }
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold">VelocityMaid</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Your Cleaning Service</h1>
          <p className="text-xl text-gray-600 mb-4">Quick & easy booking in 60 seconds</p>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-gray-700">
              <strong>Service Area:</strong> {selectedBranch === 'port-antonio'
                ? 'We serve Port Antonio and surrounding Portland Parish areas. Select your area code below.'
                : formData.serviceLocation === 'vermont' 
                ? 'We serve Ludlow, Okemo Valley, and surrounding Vermont areas. Please ensure your address is within our service area.'
                : formData.serviceLocation === 'miami'
                ? 'We serve Miami-Dade County and surrounding areas. Please ensure your address is within our service area.'
                : 'We proudly serve all of New Jersey. Please ensure your address is within our service area.'}
              <br />
              {selectedBranch === 'port-antonio' && (
                <>
                  <strong>Payment:</strong> All Jamaica bookings are paid in JMD. Payment options: cash, bank transfer, or approved digital wallet.
                  <br />
                </>
              )}
              <strong>Policy:</strong> By booking, you agree to our <a href="/terms" className="text-primary-600 hover:underline">Terms of Service</a> and <a href="/refunds" className="text-primary-600 hover:underline">Refund Policy</a>.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
              {/* Service Location Section */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-primary-600" />
                  Service Location
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Choose where this cleaning will take place.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="serviceLocation"
                      value="new_jersey"
                      checked={formData.serviceLocation === 'new_jersey'}
                      onChange={() => handleFieldChange('serviceLocation', 'new_jersey')}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">New Jersey</p>
                      <p className="text-xs text-gray-600">
                        Newark, East Orange, Irvington, Bloomfield, Jersey City, Elizabeth, Union, Montclair and nearby areas.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="serviceLocation"
                      value="vermont"
                      checked={formData.serviceLocation === 'vermont'}
                      onChange={() => handleFieldChange('serviceLocation', 'vermont')}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Vermont</p>
                      <p className="text-xs text-gray-600">
                        Ludlow, Okemo Valley, Proctorsville, Cavendish and nearby ski communities.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="serviceLocation"
                      value="miami"
                      checked={formData.serviceLocation === 'miami'}
                      onChange={() => handleFieldChange('serviceLocation', 'miami')}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Miami</p>
                      <p className="text-xs text-gray-600">
                        Miami-Dade County and surrounding areas. We serve Miami Beach, Coral Gables, Aventura, and nearby communities.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Contact Info Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Home className="w-6 h-6 mr-2 text-primary-600" />
                  Contact Info
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        onBlur={() => handleBlur('firstName')}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="John"
                        {...(errors.firstName && { 'aria-invalid': 'true' })}
                        {...(errors.firstName && { 'aria-describedby': 'firstName-error' })}
                      />
                      {errors.firstName && <p id="firstName-error" className="text-red-500 text-sm mt-1" role="alert">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastInitial" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Initial *
                      </label>
                      <input
                        type="text"
                        id="lastInitial"
                        value={formData.lastInitial}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 1);
                          handleFieldChange('lastInitial', value);
                        }}
                        onBlur={() => handleBlur('lastInitial')}
                        maxLength={1}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl font-bold ${
                          errors.lastInitial ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="M"
                        {...(errors.lastInitial && { 'aria-invalid': 'true' })}
                        {...(errors.lastInitial && { 'aria-describedby': 'lastInitial-error' })}
                      />
                      {errors.lastInitial && <p id="lastInitial-error" className="text-red-500 text-sm mt-1" role="alert">{errors.lastInitial}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      onBlur={() => handleBlur('phone')}
                      maxLength={14}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="(802) 555-1234"
                      {...(errors.phone && { 'aria-invalid': 'true' })}
                      {...(errors.phone && { 'aria-describedby': 'phone-error' })}
                    />
                    {errors.phone && <p id="phone-error" className="text-red-500 text-sm mt-1" role="alert">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="john@example.com"
                      {...(errors.email && { 'aria-invalid': 'true' })}
                      {...(errors.email && { 'aria-describedby': 'email-error' })}
                    />
                    {errors.email && <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      onBlur={() => handleBlur('address')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={
                        selectedBranch === 'port-antonio'
                          ? 'Street address, Port Antonio, Jamaica'
                          : '123 Main St, Newark, NJ 07102 (New Jersey addresses only)'
                      }
                      {...(errors.address && { 'aria-invalid': 'true' })}
                      {...(errors.address && { 'aria-describedby': 'address-error' })}
                    />
                    {errors.address && <p id="address-error" className="text-red-500 text-sm mt-1" role="alert">{errors.address}</p>}
                  </div>
                  
                  {/* Routing Code Selector for Port Antonio */}
                  {selectedBranch === 'port-antonio' && (
                    <>
                      <div>
                        <label htmlFor="routingCode" className="block text-sm font-medium text-gray-700 mb-1">
                          Area Code *
                        </label>
                        <select
                          id="routingCode"
                          value={selectedRoutingCode}
                          onChange={(e) => {
                            setSelectedRoutingCode(e.target.value);
                            setExtractedZipCode(e.target.value);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          <option value="">Select your area</option>
                          {portAntonioServiceAreas.map((area) => (
                            <option key={area.code} value={area.code}>
                              {area.code} - {area.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Select the area code for your location in Portland, Jamaica
                        </p>
                      </div>
                      {/* Currency Toggle for Port Antonio */}
                      {multiCurrencyPricing?.supportsMultiCurrency && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pricing Currency *
                          </label>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <label className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg border-2 transition-colors ${
                              selectedCurrency === 'JMD' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}>
                              <input
                                type="radio"
                                name="currency"
                                value="JMD"
                                checked={selectedCurrency === 'JMD'}
                                onChange={() => setSelectedCurrency('JMD')}
                                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <div>
                                <p className="font-semibold text-gray-900">Local Customer (JMD)</p>
                                <p className="text-xs text-gray-600">Pay in Jamaican Dollars</p>
                              </div>
                            </label>
                            <label className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg border-2 transition-colors ${
                              selectedCurrency === 'USD' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}>
                              <input
                                type="radio"
                                name="currency"
                                value="USD"
                                checked={selectedCurrency === 'USD'}
                                onChange={() => setSelectedCurrency('USD')}
                                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <div>
                                <p className="font-semibold text-gray-900">Visitor / USD Pricing</p>
                                <p className="text-xs text-gray-600">Pay online with card</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Service Selection Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-primary-600" />
                  Service Selection
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Service Type *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 border border-gray-200">
                        <input
                          type="radio"
                          name="serviceType"
                          value="basic"
                          checked={formData.serviceType === 'basic'}
                          onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                          onBlur={() => handleBlur('serviceType')}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                          {...(errors.serviceType && { 'aria-invalid': 'true' })}
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Basic Clean</span>
                          <span className="text-primary-600 font-bold ml-2">
                            {selectedBranch === 'port-antonio' && multiCurrencyPricing ? (
                              selectedCurrency === 'JMD' 
                                ? `J$${(multiCurrencyPricing.packages.find(p => p.code === 'STANDARD_CLEAN')?.jmdPrice || 0).toLocaleString()}`
                                : `$${multiCurrencyPricing.packages.find(p => p.code === 'STANDARD_CLEAN')?.usdPrice || 0}`
                            ) : (
                              `$${branchPricing?.prices.basic || DEFAULT_SERVICE_PRICES.basic}`
                            )}
                          </span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 border border-gray-200">
                        <input
                          type="radio"
                          name="serviceType"
                          value="deep"
                          checked={formData.serviceType === 'deep'}
                          onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                          onBlur={() => handleBlur('serviceType')}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                          {...(errors.serviceType && { 'aria-invalid': 'true' })}
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Deep Clean</span>
                          <span className="text-primary-600 font-bold ml-2">
                            {selectedBranch === 'port-antonio' && multiCurrencyPricing ? (
                              selectedCurrency === 'JMD' 
                                ? `J$${(multiCurrencyPricing.packages.find(p => p.code === 'DEEP_CLEAN')?.jmdPrice || 0).toLocaleString()}`
                                : `$${multiCurrencyPricing.packages.find(p => p.code === 'DEEP_CLEAN')?.usdPrice || 0}`
                            ) : (
                              `$${branchPricing?.prices.deep || DEFAULT_SERVICE_PRICES.deep}`
                            )}
                          </span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 border border-gray-200">
                        <input
                          type="radio"
                          name="serviceType"
                          value="moveInOut"
                          checked={formData.serviceType === 'moveInOut'}
                          onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                          onBlur={() => handleBlur('serviceType')}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                          {...(errors.serviceType && { 'aria-invalid': 'true' })}
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Move In/Out</span>
                          <span className="text-primary-600 font-bold ml-2">
                            {selectedBranch === 'port-antonio' && multiCurrencyPricing ? (
                              selectedCurrency === 'JMD' 
                                ? `J$${(multiCurrencyPricing.packages.find(p => p.code === 'MOVE_IN_OUT')?.jmdPrice || 0).toLocaleString()}`
                                : `$${multiCurrencyPricing.packages.find(p => p.code === 'MOVE_IN_OUT')?.usdPrice || 0}`
                            ) : (
                              `$${branchPricing?.prices.moveInOut || DEFAULT_SERVICE_PRICES.moveInOut}`
                            )}
                          </span>
                        </div>
                      </label>
                    </div>
                    {errors.serviceType && <p className="text-red-500 text-sm mt-1" role="alert">{errors.serviceType}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        value={formData.preferredDate}
                        onChange={(e) => handleFieldChange('preferredDate', e.target.value)}
                        onBlur={() => handleBlur('preferredDate')}
                        min={getMinDate()}
                        max={getMaxDate()}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.preferredDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        {...(errors.preferredDate && { 'aria-invalid': 'true' })}
                        {...(errors.preferredDate && { 'aria-describedby': 'preferredDate-error' })}
                      />
                      {errors.preferredDate && <p id="preferredDate-error" className="text-red-500 text-sm mt-1" role="alert">{errors.preferredDate}</p>}
                    </div>
                    <div>
                      <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Time *
                      </label>
                      <select
                        id="preferredTime"
                        value={formData.preferredTime}
                        onChange={(e) => handleFieldChange('preferredTime', e.target.value)}
                        onBlur={() => handleBlur('preferredTime')}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.preferredTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                        {...(errors.preferredTime && { 'aria-invalid': 'true' })}
                        {...(errors.preferredTime && { 'aria-describedby': 'preferredTime-error' })}
                      >
                        <option value="">Select a time</option>
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
                        <option value="evening">Evening (3 PM - 6 PM)</option>
                      </select>
                      {errors.preferredTime && <p id="preferredTime-error" className="text-red-500 text-sm mt-1" role="alert">{errors.preferredTime}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Add-ons Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Add-ons (Optional)</h2>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.addOns.laundry}
                      onChange={(e) => setFormData({
                        ...formData,
                        addOns: { ...formData.addOns, laundry: e.target.checked }
                      })}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="flex-1 text-gray-700">
                      Laundry {selectedBranch === 'port-antonio' && multiCurrencyPricing ? (
                        selectedCurrency === 'JMD' 
                          ? `(J$${multiCurrencyPricing.addons.laundry.toLocaleString()}/load)`
                          : `($${Math.round(multiCurrencyPricing.addons.laundry / 150)}/load)`
                      ) : (
                        '($15/load)'
                      )}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.addOns.windows}
                      onChange={(e) => setFormData({
                        ...formData,
                        addOns: { ...formData.addOns, windows: e.target.checked }
                      })}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="flex-1 text-gray-700">
                      Interior Windows {selectedBranch === 'port-antonio' && multiCurrencyPricing ? (
                        selectedCurrency === 'JMD' 
                          ? `(J$${multiCurrencyPricing.addons.windows_per_room.toLocaleString()}/room)`
                          : `($${Math.round(multiCurrencyPricing.addons.windows_per_room / 150)}/room)`
                      ) : (
                        '($20/room)'
                      )}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.addOns.oven}
                      onChange={(e) => setFormData({
                        ...formData,
                        addOns: { ...formData.addOns, oven: e.target.checked }
                      })}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="flex-1 text-gray-700">
                      Inside Oven {selectedBranch === 'port-antonio' && multiCurrencyPricing ? (
                        selectedCurrency === 'JMD' 
                          ? `(J$${multiCurrencyPricing.addons.oven.toLocaleString()})`
                          : `($${Math.round(multiCurrencyPricing.addons.oven / 150)})`
                      ) : (
                        '($30)'
                      )}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.addOns.refrigerator}
                      onChange={(e) => setFormData({
                        ...formData,
                        addOns: { ...formData.addOns, refrigerator: e.target.checked }
                      })}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="flex-1 text-gray-700">
                      Inside Refrigerator {selectedBranch === 'port-antonio' && multiCurrencyPricing ? (
                        selectedCurrency === 'JMD' 
                          ? `(J$${multiCurrencyPricing.addons.fridge.toLocaleString()})`
                          : `($${Math.round(multiCurrencyPricing.addons.fridge / 150)})`
                      ) : (
                        '($25)'
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions (Optional)
                </label>
                <textarea
                  id="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value.slice(0, 200) })}
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any special requests or notes..."
                />
                <p className="text-sm text-gray-500 mt-1">{formData.specialInstructions.length}/200 characters</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Secure Payment</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              {formData.serviceLocation && (
                <div className="flex justify-between items-center mb-3 text-sm">
                  <span className="text-gray-600">Service Location</span>
                  <span className="font-semibold text-gray-900">
                    {formData.serviceLocation === 'new_jersey' ? 'New Jersey' : formData.serviceLocation === 'miami' ? 'Miami' : 'Vermont'}
                  </span>
                </div>
              )}
              <div className="space-y-3 mb-4">
                {formData.serviceType && (
                  <div className="flex justify-between text-gray-700">
                    <span>
                      {formData.serviceType === 'basic' && 'Basic Clean'}
                      {formData.serviceType === 'deep' && 'Deep Clean'}
                      {formData.serviceType === 'moveInOut' && 'Move In/Out'}
                    </span>
                    <span className="font-semibold">${
                      (() => {
                        if (!branchPricing || !formData.serviceType) return DEFAULT_SERVICE_PRICES[formData.serviceType] || 0;
                        const price = branchPricing.prices[formData.serviceType as keyof typeof branchPricing.prices];
                        return typeof price === 'number' ? price : (DEFAULT_SERVICE_PRICES[formData.serviceType] || 0);
                      })()
                    }</span>
                  </div>
                )}
                {formData.addOns.laundry && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Laundry</span>
                    <span>${branchPricing ? (typeof branchPricing.prices.addOns === 'object' && branchPricing.prices.addOns?.laundry ? branchPricing.prices.addOns.laundry : DEFAULT_ADDON_PRICES.laundry) : DEFAULT_ADDON_PRICES.laundry}</span>
                  </div>
                )}
                {formData.addOns.windows && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Interior Windows</span>
                    <span>${branchPricing ? (typeof branchPricing.prices.addOns === 'object' && branchPricing.prices.addOns?.windows ? branchPricing.prices.addOns.windows : DEFAULT_ADDON_PRICES.windows) : DEFAULT_ADDON_PRICES.windows}</span>
                  </div>
                )}
                {formData.addOns.oven && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Inside Oven</span>
                    <span>${branchPricing ? (typeof branchPricing.prices.addOns === 'object' && branchPricing.prices.addOns?.oven ? branchPricing.prices.addOns.oven : DEFAULT_ADDON_PRICES.oven) : DEFAULT_ADDON_PRICES.oven}</span>
                  </div>
                )}
                {formData.addOns.refrigerator && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Inside Refrigerator</span>
                    <span>${branchPricing ? (typeof branchPricing.prices.addOns === 'object' && branchPricing.prices.addOns?.refrigerator ? branchPricing.prices.addOns.refrigerator : DEFAULT_ADDON_PRICES.refrigerator) : DEFAULT_ADDON_PRICES.refrigerator}</span>
                  </div>
                )}
              </div>
              {promoDiscount > 0 && promoData && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center text-yellow-600 mb-2">
                    <span className="text-sm font-semibold">{promoData.title}</span>
                    <span className="text-lg font-bold">-${promoDiscount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Promo: {promoCode}</p>
                </div>
              )}
              {referralDiscount > 0 && referralCode && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center text-green-600 mb-2">
                    <span className="text-sm font-semibold">Referral Discount</span>
                    <span className="text-lg font-bold">-${referralDiscount}</span>
                  </div>
                  <p className="text-xs text-gray-500">Applied from referral code: {referralCode}</p>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {selectedBranch === 'port-antonio' && selectedCurrency === 'JMD' 
                      ? `J$${(totalPrice || 0).toLocaleString()}`
                      : `$${totalPrice || 0}`
                    }
                  </span>
                </div>
                {selectedBranch === 'port-antonio' && selectedCurrency === 'JMD' && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    All Jamaica bookings are paid in JMD. Payment options: cash, bank transfer, or approved digital wallet.
                  </p>
                )}
              </div>
              {totalPrice === 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center">Select a service to see total</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking form...</p>
        </div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}

