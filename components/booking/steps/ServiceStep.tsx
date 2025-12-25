'use client';

import React, { useState, useEffect } from 'react';
import { useBooking } from '../BookingContext';
import { ServiceType } from '../types';
import { Home, Sparkles, Truck, Globe } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  status: string;
}

export default function ServiceStep() {
  const { data, update } = useBooking();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const serviceTypes: Array<{ value: ServiceType; label: string; description: string; icon: React.ReactNode }> = [
    {
      value: 'STANDARD',
      label: 'Standard Cleaning',
      description: 'Regular maintenance cleaning for your home',
      icon: <Home className="w-6 h-6" />,
    },
    {
      value: 'DEEP_CLEAN',
      label: 'Deep Clean',
      description: 'Thorough cleaning including hard-to-reach areas',
      icon: <Sparkles className="w-6 h-6" />,
    },
    {
      value: 'MOVE_IN_OUT',
      label: 'Move In / Out',
      description: 'Comprehensive cleaning for moving',
      icon: <Truck className="w-6 h-6" />,
    },
  ];

  // Available countries (Phase 0)
  const countries = [
    { code: 'Jamaica', label: 'Jamaica' },
    { code: 'USA', label: 'United States' },
  ];

  // Fetch branches from API (Phase 0 route)
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const response = await fetch('/api/branches');
        const result = await response.json();
        if (result.success) {
          setBranches(result.branches);
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Filter branches by selected country
  const availableBranches = data.country
    ? branches.filter(b => {
        const branchCountry = b.country || '';
        if (data.country === 'Jamaica') {
          return branchCountry === 'Jamaica' || branchCountry === 'JM';
        }
        if (data.country === 'USA') {
          return branchCountry === 'USA' || branchCountry === 'US' || branchCountry === 'United States';
        }
        return false;
      })
    : [];

  // Reset branch when country changes
  useEffect(() => {
    if (data.country && data.branchSlug) {
      const selectedBranch = branches.find(b => b.slug === data.branchSlug);
      if (selectedBranch) {
        const branchCountry = selectedBranch.country || '';
        const countryMatch = 
          (data.country === 'Jamaica' && (branchCountry === 'Jamaica' || branchCountry === 'JM')) ||
          (data.country === 'USA' && (branchCountry === 'USA' || branchCountry === 'US' || branchCountry === 'United States'));
        if (!countryMatch) {
          update({ branchSlug: null });
        }
      }
    }
  }, [data.country, branches, data.branchSlug, update]);

  return (
    <div className="space-y-8">
      {/* Country Selection - FIRST STEP (CRITICAL) */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Country</h2>
        <p className="text-gray-600">Choose the country where you need cleaning services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {countries.map((country) => (
          <button
            key={country.code}
            type="button"
            onClick={() => {
              update({ country: country.code, branchSlug: null }); // Reset branch when country changes
            }}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              data.country === country.code
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className={`w-6 h-6 ${data.country === country.code ? 'text-blue-600' : 'text-gray-400'}`} />
                <h3 className={`font-semibold text-lg ${data.country === country.code ? 'text-blue-700' : 'text-gray-900'}`}>
                  {country.label}
                </h3>
              </div>
              {data.country === country.code && (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {!data.country && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Please select a country</strong> to continue with your booking.
          </p>
        </div>
      )}

      {/* Branch Selection - SECOND STEP (after country) */}
      {data.country && (
        <div className="border-t pt-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Location</h2>
            <p className="text-gray-600">Choose the branch location for your cleaning service</p>
          </div>

          {loadingBranches ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading locations...</p>
            </div>
          ) : availableBranches.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                No locations available for {data.country}. Please select a different country.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {availableBranches.map((branch) => (
                  <button
                    key={branch.slug}
                    type="button"
                    onClick={() => update({ branchSlug: branch.slug })}
                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                      data.branchSlug === branch.slug
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-semibold text-lg ${data.branchSlug === branch.slug ? 'text-blue-700' : 'text-gray-900'}`}>
                          {branch.name}
                        </h3>
                        <p className={`text-sm mt-1 ${data.branchSlug === branch.slug ? 'text-blue-600' : 'text-gray-600'}`}>
                          {branch.city}, {branch.state}
                        </p>
                      </div>
                      {data.branchSlug === branch.slug && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {!data.branchSlug && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Please select a location</strong> to continue with your booking.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Service Type Selection - THIRD STEP (after country and branch) */}
      {data.country && data.branchSlug && (
        <div className="border-t pt-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select Service Type</h3>
            <p className="text-gray-600 mb-4">Choose the type of cleaning service you need</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {serviceTypes.map((service) => (
              <button
                key={service.value}
                type="button"
                onClick={() => update({ serviceType: service.value })}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  data.serviceType === service.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`${
                      data.serviceType === service.value ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {service.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{service.label}</h3>
                </div>
                <p className="text-sm text-gray-600">{service.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}







