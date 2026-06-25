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

/** Online bookable markets — slug doubles as branch slug (Option A). */
const markets = [
  { code: 'new-jersey', label: 'New Jersey' },
  { code: 'vermont', label: 'Vermont' },
] as const;

const BOOKABLE_SLUGS = new Set<string>(markets.map((m) => m.code));

const selectedCardClass =
  'border-2 border-vm-cyan bg-[#E6FAFB] shadow-md';
const unselectedCardClass =
  'border border-vm-border hover:border-vm-cyan/50 bg-white hover:shadow-sm';

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

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const response = await fetch('/api/branches');
        const result = await response.json();
        if (result.success) {
          setBranches(
            result.branches.filter((b: Branch) => BOOKABLE_SLUGS.has(b.slug)),
          );
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const availableBranches = data.market
    ? branches.filter((b) => b.slug === data.market)
    : [];

  const selectedMarketLabel =
    markets.find((m) => m.code === data.market)?.label ?? data.market;

  useEffect(() => {
    if (data.market && data.branchSlug) {
      const selectedBranch = branches.find((b) => b.slug === data.branchSlug);
      if (selectedBranch && selectedBranch.slug !== data.market) {
        update({ branchSlug: null });
      }
    }
  }, [data.market, branches, data.branchSlug, update]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading font-semibold text-vm-navy text-2xl mb-2">
          Select Your Market
        </h2>
        <p className="font-body text-vm-muted">
          Choose the market where you need cleaning services
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {markets.map((market) => (
          <button
            key={market.code}
            type="button"
            onClick={() => {
              update({ market: market.code, branchSlug: null });
            }}
            className={`p-6 rounded-lg transition-all text-left ${
              data.market === market.code ? selectedCardClass : unselectedCardClass
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe
                  className={`w-6 h-6 ${
                    data.market === market.code ? 'text-vm-cyan' : 'text-vm-muted'
                  }`}
                />
                <h3 className="font-heading font-medium text-vm-text text-lg">
                  {market.label}
                </h3>
              </div>
              {data.market === market.code && (
                <div className="w-6 h-6 rounded-full bg-vm-cyan flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {!data.market && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-body text-sm text-yellow-800">
            <strong>Please select a market</strong> to continue with your booking.
          </p>
        </div>
      )}

      {data.market && (
        <div className="border-t border-vm-border pt-8">
          <div>
            <h2 className="font-heading font-semibold text-vm-navy text-2xl mb-2">
              Select Your Location
            </h2>
            <p className="font-body text-vm-muted">
              Choose the branch location for your cleaning service
            </p>
          </div>

          {loadingBranches ? (
            <div className="text-center py-8">
              <p className="font-body text-vm-muted">Loading locations...</p>
            </div>
          ) : availableBranches.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="font-body text-sm text-yellow-800">
                No locations available for {selectedMarketLabel}. Please select a
                different market.
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
                    className={`p-6 rounded-lg transition-all text-left ${
                      data.branchSlug === branch.slug
                        ? selectedCardClass
                        : unselectedCardClass
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-medium text-vm-text text-lg">
                          {branch.name}
                        </h3>
                        <p className="font-body text-sm text-vm-muted mt-1">
                          {branch.city}, {branch.state}
                        </p>
                      </div>
                      {data.branchSlug === branch.slug && (
                        <div className="w-6 h-6 rounded-full bg-vm-cyan flex items-center justify-center shrink-0">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {!data.branchSlug && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <p className="font-body text-sm text-red-800">
                    <strong>Please select a location</strong> to continue with your
                    booking.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {data.market && data.branchSlug && (
        <div className="border-t border-vm-border pt-8">
          <div>
            <h3 className="font-heading font-semibold text-vm-navy text-xl mb-2">
              Select Service Type
            </h3>
            <p className="font-body text-vm-muted mb-4">
              Choose the type of cleaning service you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {serviceTypes.map((service) => (
              <button
                key={service.value}
                type="button"
                onClick={() => update({ serviceType: service.value })}
                className={`p-6 rounded-lg transition-all text-left ${
                  data.serviceType === service.value
                    ? selectedCardClass
                    : unselectedCardClass
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={
                      data.serviceType === service.value
                        ? 'text-vm-cyan'
                        : 'text-vm-muted'
                    }
                  >
                    {service.icon}
                  </div>
                  <h3 className="font-heading font-medium text-vm-text">
                    {service.label}
                  </h3>
                </div>
                <p className="font-body text-sm text-vm-muted">{service.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
