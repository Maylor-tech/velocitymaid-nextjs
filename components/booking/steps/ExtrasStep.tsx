'use client';

import React from 'react';
import { useBooking } from '../BookingContext';

const extrasOptions = [
  { key: 'insideFridge' as const, label: 'Inside Fridge' },
  { key: 'insideOven' as const, label: 'Inside Oven' },
  { key: 'insideCabinets' as const, label: 'Inside Cabinets' },
  { key: 'windows' as const, label: 'Windows' },
  { key: 'laundry' as const, label: 'Laundry' },
];

export default function ExtrasStep() {
  const { data, update } = useBooking();

  const handleExtraChange = (key: keyof typeof data.extras, value: boolean) => {
    update({
      extras: { ...data.extras, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-vm-text mb-2">Additional Services</h2>
        <p className="text-vm-muted">Select any additional services you'd like included</p>
      </div>

      <div className="space-y-3">
        {extrasOptions.map((option) => (
          <label
            key={option.key}
            className="flex items-center gap-3 p-4 border border-vm-border rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={data.extras[option.key]}
              onChange={(e) => handleExtraChange(option.key, e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-vm-text font-medium">{option.label}</span>
          </label>
        ))}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-vm-text mb-2">
          Special Instructions (Optional)
        </label>
        <textarea
          id="notes"
          value={data.extras.notes}
          onChange={(e) =>
            update({
              extras: { ...data.extras, notes: e.target.value },
            })
          }
          rows={4}
          placeholder="Any special requests or instructions for our team..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
      </div>
    </div>
  );
}

















