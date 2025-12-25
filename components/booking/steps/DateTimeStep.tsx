'use client';

import React from 'react';
import { useBooking } from '../BookingContext';

const timeSlots = [
  { value: '09:00-12:00', label: '9:00 AM - 12:00 PM' },
  { value: '12:00-15:00', label: '12:00 PM - 3:00 PM' },
  { value: '15:00-18:00', label: '3:00 PM - 6:00 PM' },
];

const flexibilityOptions = [
  { value: 'FLEXIBLE', label: 'Flexible' },
  { value: 'EXACT_TIME', label: 'Exact time preferred' },
  { value: 'MORNING', label: 'Morning preferred' },
  { value: 'AFTERNOON', label: 'Afternoon preferred' },
];

export default function DateTimeStep() {
  const { data, update } = useBooking();

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Your Service</h2>
        <p className="text-gray-600">Select your preferred date and time</p>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Date *
        </label>
        <input
          type="date"
          id="date"
          value={data.schedule.date || ''}
          onChange={(e) =>
            update({
              schedule: { ...data.schedule, date: e.target.value || null },
            })
          }
          min={today}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-2">
          Time Slot {data.schedule.flexibility === 'EXACT_TIME' ? '*' : '(Optional)'}
        </label>
        <select
          id="timeSlot"
          value={data.schedule.timeSlot || ''}
          onChange={(e) =>
            update({
              schedule: { ...data.schedule, timeSlot: e.target.value || null },
            })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="">
            {data.schedule.flexibility === 'EXACT_TIME' 
              ? 'Select a time slot...' 
              : 'Optional - Select if you have a preference'}
          </option>
          {timeSlots.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>
        {data.schedule.flexibility !== 'EXACT_TIME' && (
          <p className="mt-1 text-xs text-gray-500">
            {data.schedule.flexibility === 'FLEXIBLE' 
              ? 'Time slot is optional when flexibility is set to "Flexible"'
              : 'You can select a time slot or leave it for us to schedule'}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="flexibility" className="block text-sm font-medium text-gray-700 mb-2">
          Flexibility
        </label>
        <select
          id="flexibility"
          value={data.schedule.flexibility}
          onChange={(e) =>
            update({
              schedule: {
                ...data.schedule,
                flexibility: e.target.value as typeof data.schedule.flexibility,
              },
            })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {flexibilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Let us know how flexible you are with the timing
        </p>
      </div>
    </div>
  );
}













