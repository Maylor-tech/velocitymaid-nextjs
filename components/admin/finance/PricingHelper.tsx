'use client';

import { useState } from 'react';
import { Calculator, X } from 'lucide-react';
import { calculateJobPrice, getRecommendedBaseRate, type JobPricingInput } from '../../lib/finance/pricing';

interface PricingHelperProps {
  serviceType?: string | null;
  onPriceCalculated?: (price: number) => void;
}

export default function PricingHelper({ serviceType, onPriceCalculated }: PricingHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [baseRate, setBaseRate] = useState<number>(getRecommendedBaseRate(serviceType || undefined));
  const [bedrooms, setBedrooms] = useState<number>(0);
  const [bathrooms, setBathrooms] = useState<number>(0);
  const [squareFeet, setSquareFeet] = useState<string>('');
  const [isDeepClean, setIsDeepClean] = useState(false);
  const [isMoveOut, setIsMoveOut] = useState(false);
  const [travelDistanceKm, setTravelDistanceKm] = useState<string>('');
  const [breakdown, setBreakdown] = useState<ReturnType<typeof calculateJobPrice> | null>(null);

  const handleCalculate = () => {
    const input: JobPricingInput = {
      baseRate,
      bedrooms: bedrooms > 0 ? bedrooms : undefined,
      bathrooms: bathrooms > 0 ? bathrooms : undefined,
      squareFeet: squareFeet ? parseFloat(squareFeet) : undefined,
      isDeepClean,
      isMoveOut,
      travelDistanceKm: travelDistanceKm ? parseFloat(travelDistanceKm) : undefined,
    };

    const result = calculateJobPrice(input);
    setBreakdown(result);

    if (onPriceCalculated) {
      onPriceCalculated(result.total);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-vm-text bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calculator className="w-4 h-4" />
        Pricing Helper
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-vm-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-vm-text">Job Pricing Calculator</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setBreakdown(null);
                }}
                className="text-vm-muted hover:text-vm-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-vm-text mb-1">
                    Base Rate ($)
                  </label>
                  <input
                    type="number"
                    value={baseRate}
                    onChange={(e) => setBaseRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vm-text mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vm-text mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vm-text mb-1">
                    Square Feet (optional)
                  </label>
                  <input
                    type="number"
                    value={squareFeet}
                    onChange={(e) => setSquareFeet(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                    min="0"
                    placeholder="Leave empty to use bedrooms/bathrooms"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vm-text mb-1">
                    Travel Distance (km)
                  </label>
                  <input
                    type="number"
                    value={travelDistanceKm}
                    onChange={(e) => setTravelDistanceKm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                    min="0"
                    step="0.1"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isDeepClean}
                    onChange={(e) => {
                      setIsDeepClean(e.target.checked);
                      if (e.target.checked) setIsMoveOut(false);
                    }}
                    className="w-4 h-4 text-vm-cyan-dark border-gray-300 rounded focus:ring-vm-cyan"
                  />
                  <span className="text-sm text-vm-text">Deep Clean</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isMoveOut}
                    onChange={(e) => {
                      setIsMoveOut(e.target.checked);
                      if (e.target.checked) setIsDeepClean(false);
                    }}
                    className="w-4 h-4 text-vm-cyan-dark border-gray-300 rounded focus:ring-vm-cyan"
                  />
                  <span className="text-sm text-vm-text">Move-out Clean</span>
                </label>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                className="w-full px-4 py-3 bg-vm-navy text-white font-medium rounded-lg hover:bg-vm-navy transition-colors"
              >
                Calculate Price
              </button>

              {/* Breakdown */}
              {breakdown && (
                <div className="bg-vm-surface rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-vm-text mb-3">Price Breakdown</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-vm-muted">Base:</span>
                      <span className="text-vm-text">{formatCurrency(breakdown.base)}</span>
                    </div>
                    {breakdown.sizeAdjustment > 0 && (
                      <div className="flex justify-between">
                        <span className="text-vm-muted">Size Adjustment:</span>
                        <span className="text-vm-text">+{formatCurrency(breakdown.sizeAdjustment)}</span>
                      </div>
                    )}
                    {breakdown.typeAdjustment > 0 && (
                      <div className="flex justify-between">
                        <span className="text-vm-muted">Type Adjustment:</span>
                        <span className="text-vm-text">+{formatCurrency(breakdown.typeAdjustment)}</span>
                      </div>
                    )}
                    {breakdown.travelFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-vm-muted">Travel Fee:</span>
                        <span className="text-vm-text">+{formatCurrency(breakdown.travelFee)}</span>
                      </div>
                    )}
                    {breakdown.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-vm-muted">Discount:</span>
                        <span className="text-red-600">-{formatCurrency(breakdown.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="font-semibold text-vm-text">Total:</span>
                      <span className="font-bold text-lg text-vm-cyan-dark">{formatCurrency(breakdown.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
















