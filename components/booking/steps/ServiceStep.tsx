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
    { slug: 'new-jersey', label: 'New Jersey – Newark' },
    { slug: 'vermont', label: 'Vermont – Ludlow' },
    { slug: 'miami', label: 'Miami' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Service Type</h2>
        <p className="text-gray-600">Choose the type of cleaning service you need</p>
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

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Location</h3>
        <select
          value={data.branchSlug || ''}
          onChange={(e) => update({ branchSlug: e.target.value || null })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="">Choose a location...</option>
          {branches.map((branch) => (
            <option key={branch.slug} value={branch.slug}>
              {branch.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}







