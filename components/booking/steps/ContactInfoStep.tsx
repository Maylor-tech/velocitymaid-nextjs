'use client';

import React from 'react';
import { useBooking } from '../BookingContext';

export default function ContactInfoStep() {
  const { data, update } = useBooking();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-vm-text mb-2">Contact Information</h2>
        <p className="text-vm-muted">We'll use this to confirm your booking and send updates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-vm-text mb-2">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={data.contact.firstName || ''}
            onChange={(e) =>
              update({
                contact: { ...data.contact, firstName: e.target.value },
              })
            }
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="John"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-vm-text mb-2">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={data.contact.lastName || ''}
            onChange={(e) =>
              update({
                contact: { ...data.contact, lastName: e.target.value },
              })
            }
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Smith"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-vm-text mb-2">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          value={data.contact.email || ''}
          onChange={(e) =>
            update({
              contact: { ...data.contact, email: e.target.value },
            })
          }
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="john.smith@example.com"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-vm-text mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          id="phone"
          value={data.contact.phone || ''}
          onChange={(e) =>
            update({
              contact: { ...data.contact, phone: e.target.value },
            })
          }
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-vm-text mb-4">Service Address (Optional)</h3>
        <p className="text-sm text-vm-muted mb-4">
          If different from your contact address, provide the service location
        </p>

        <div>
          <label htmlFor="streetAddress" className="block text-sm font-medium text-vm-text mb-2">
            Street Address
          </label>
          <input
            type="text"
            id="streetAddress"
            value={data.contact.streetAddress || ''}
            onChange={(e) =>
              update({
                contact: { ...data.contact, streetAddress: e.target.value },
              })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-vm-text mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              value={data.contact.city || ''}
              onChange={(e) =>
                update({
                  contact: { ...data.contact, city: e.target.value },
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Miami"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-vm-text mb-2">
              State
            </label>
            <input
              type="text"
              id="state"
              value={data.contact.state || ''}
              onChange={(e) =>
                update({
                  contact: { ...data.contact, state: e.target.value },
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="FL"
            />
          </div>

          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-vm-text mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              id="zip"
              value={data.contact.zip || ''}
              onChange={(e) =>
                update({
                  contact: { ...data.contact, zip: e.target.value },
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="33101"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
