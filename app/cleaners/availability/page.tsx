export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, X, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AvailabilityData {
  workingDays: string[];
  timeRanges: Array<{ start: string; end: string }>;
  maxDailyJobs: number;
  blackoutDates: string[];
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function CleanerAvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [availability, setAvailability] = useState<AvailabilityData>({
    workingDays: [],
    timeRanges: [{ start: '09:00', end: '17:00' }],
    maxDailyJobs: 3,
    blackoutDates: [],
  });

  const [newBlackoutDate, setNewBlackoutDate] = useState('');

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/cleaners/availability');
      const result = await response.json();

      if (result.success && result.availability) {
        setAvailability({
          workingDays: result.availability.workingDays || [],
          timeRanges: result.availability.timeRanges || [{ start: '09:00', end: '17:00' }],
          maxDailyJobs: result.availability.maxDailyJobs || 3,
          blackoutDates: result.availability.blackoutDates || [],
        });
      }
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingDayToggle = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const handleTimeRangeChange = (index: number, field: 'start' | 'end', value: string) => {
    setAvailability((prev) => ({
      ...prev,
      timeRanges: prev.timeRanges.map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      ),
    }));
  };

  const addTimeRange = () => {
    setAvailability((prev) => ({
      ...prev,
      timeRanges: [...prev.timeRanges, { start: '09:00', end: '17:00' }],
    }));
  };

  const removeTimeRange = (index: number) => {
    setAvailability((prev) => ({
      ...prev,
      timeRanges: prev.timeRanges.filter((_, i) => i !== index),
    }));
  };

  const addBlackoutDate = () => {
    if (!newBlackoutDate) return;

    if (availability.blackoutDates.includes(newBlackoutDate)) {
      setError('This date is already in your blackout list');
      return;
    }

    setAvailability((prev) => ({
      ...prev,
      blackoutDates: [...prev.blackoutDates, newBlackoutDate],
    }));
    setNewBlackoutDate('');
  };

  const removeBlackoutDate = (date: string) => {
    setAvailability((prev) => ({
      ...prev,
      blackoutDates: prev.blackoutDates.filter((d) => d !== date),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate
      if (availability.workingDays.length === 0) {
        setError('Please select at least one working day');
        setSaving(false);
        return;
      }

      if (availability.timeRanges.length === 0) {
        setError('Please add at least one time range');
        setSaving(false);
        return;
      }

      // Validate time ranges
      for (const range of availability.timeRanges) {
        if (range.start >= range.end) {
          setError('Start time must be before end time');
          setSaving(false);
          return;
        }
      }

      const response = await fetch('/api/cleaners/availability/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(availability),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to save availability');
      }
    } catch (err: any) {
      console.error('Error saving availability:', err);
      setError(err.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading availability settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cleaners/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Availability</h1>
          <p className="text-gray-600">Set your working days, hours, and unavailable dates</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 text-green-600">✓</div>
            <p className="text-green-800 font-medium">Availability settings saved successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Working Days */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Working Days
          </h2>
          <p className="text-sm text-gray-600 mb-4">Select the days you're available to work</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => handleWorkingDayToggle(day.value)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  availability.workingDays.includes(day.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Time Ranges */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Working Hours
          </h2>
          <p className="text-sm text-gray-600 mb-4">Set your available time ranges</p>
          <div className="space-y-4">
            {availability.timeRanges.map((range, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={range.start}
                      onChange={(e) => handleTimeRangeChange(index, 'start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={range.end}
                      onChange={(e) => handleTimeRangeChange(index, 'end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {availability.timeRanges.length > 1 && (
                  <button
                    onClick={() => removeTimeRange(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addTimeRange}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add Another Time Range
            </button>
          </div>
        </div>

        {/* Max Daily Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Maximum Daily Jobs</h2>
          <p className="text-sm text-gray-600 mb-4">How many jobs can you handle per day?</p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max="10"
              value={availability.maxDailyJobs}
              onChange={(e) =>
                setAvailability((prev) => ({
                  ...prev,
                  maxDailyJobs: parseInt(e.target.value) || 1,
                }))
              }
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-600">jobs per day</span>
          </div>
        </div>

        {/* Blackout Dates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Blackout Dates</h2>
          <p className="text-sm text-gray-600 mb-4">Dates when you're unavailable</p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="date"
                value={newBlackoutDate}
                onChange={(e) => setNewBlackoutDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addBlackoutDate}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Add Date
              </button>
            </div>
            {availability.blackoutDates.length > 0 && (
              <div className="space-y-2">
                {availability.blackoutDates.map((date) => (
                  <div
                    key={date}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-700">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={() => removeBlackoutDate(date)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/cleaners/dashboard"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Availability
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

