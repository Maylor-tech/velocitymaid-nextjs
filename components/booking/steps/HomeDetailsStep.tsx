'use client';

import React from 'react';
import { useBooking } from '../BookingContext';

export default function HomeDetailsStep() {
  const { data, update } = useBooking();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-vm-text mb-2">Home Details</h2>
        <p className="text-vm-muted">Help us understand your space to provide accurate pricing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-vm-text mb-2">
            Bedrooms *
          </label>
          <select
            id="bedrooms"
            value={data.home.bedrooms}
            onChange={(e) =>
              update({
                home: { ...data.home, bedrooms: parseInt(e.target.value) || 1 },
              })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Bedroom' : 'Bedrooms'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-vm-text mb-2">
            Bathrooms *
          </label>
          <select
            id="bathrooms"
            value={data.home.bathrooms}
            onChange={(e) =>
              update({
                home: { ...data.home, bathrooms: parseInt(e.target.value) || 1 },
              })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Bathroom' : 'Bathrooms'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="sqft" className="block text-sm font-medium text-vm-text mb-2">
          Approximate Square Footage (Optional)
        </label>
        <input
          type="number"
          id="sqft"
          value={data.home.sqft || ''}
          onChange={(e) =>
            update({
              home: {
                ...data.home,
                sqft: e.target.value ? parseInt(e.target.value) : null,
              },
            })
          }
          placeholder="e.g., 1500"
          min="0"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <p className="mt-1 text-xs text-vm-muted">This helps us estimate cleaning time</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-vm-text mb-2">Do you have pets?</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => update({ home: { ...data.home, pets: true } })}
            className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
              data.home.pets
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-vm-border hover:border-gray-300 text-vm-text'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => update({ home: { ...data.home, pets: false } })}
            className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
              !data.home.pets
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-vm-border hover:border-gray-300 text-vm-text'
            }`}
          >
            No
          </button>
        </div>
        <p className="mt-2 text-xs text-vm-muted">
          Pet-friendly cleaning products and extra attention to pet areas
        </p>
      </div>
    </div>
  );
}

















