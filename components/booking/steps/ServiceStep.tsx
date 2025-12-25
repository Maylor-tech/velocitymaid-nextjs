'use client';

import React from 'react';
import { useBooking } from '../BookingContext';
import { ServiceType } from '../types';
import { Home, Sparkles, Truck } from 'lucide-react';

export default function ServiceStep() {
  const { data, update } = useBooking();

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

  const branches = [
    { slug: 'new-jersey', label: 'New Jersey', sublabel: 'Newark Area' },
    { slug: 'vermont', label: 'Vermont', sublabel: 'Ludlow Area' },
    { slug: 'miami', label: 'Miami', sublabel: 'South Florida' },
    { slug: 'port-antonio', label: 'Jamaica', sublabel: 'Port Antonio' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Location</h2>
        <p className="text-gray-600">Choose where you need cleaning services</p>
      </div>

      {/* Location Selection - Prominent and Required */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => (
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
                  {branch.label}
                </h3>
                <p className={`text-sm mt-1 ${data.branchSlug === branch.slug ? 'text-blue-600' : 'text-gray-600'}`}>
                  {branch.sublabel}
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Please select a location</strong> to continue with your booking.
          </p>
        </div>
      )}

      {/* Service Type Selection */}
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
              disabled={!data.branchSlug}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                !data.branchSlug
                  ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
                  : data.serviceType === service.value
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
    </div>
  );
}







