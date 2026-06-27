"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save, Plus, AlertCircle } from 'lucide-react';

interface AvailabilityData {
  workingDays: string[];
  timeRanges: Array<{ start: string; end: string }>;
  maxDailyJobs: number;
  blackoutDates: string[];
  isActive: boolean;
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

interface AvailabilityEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cleanerId: string;
  onSave: () => void;
}

export default function AvailabilityEditorModal({
  isOpen,
  onClose,
  cleanerId,
  onSave,
}: AvailabilityEditorModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData>({
    workingDays: [],
    timeRanges: [{ start: '09:00', end: '17:00' }],
    maxDailyJobs: 3,
    blackoutDates: [],
    isActive: true,
  });
  const [newBlackoutDate, setNewBlackoutDate] = useState('');

  useEffect(() => {
    if (isOpen && cleanerId) {
      fetchAvailability();
    }
  }, [isOpen, cleanerId]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cleaners/${cleanerId}/availability`);
      if (!res.ok) throw new Error('Failed to load availability');
      const data = await res.json();

      if (data.success && data.availability) {
        setAvailability({
          workingDays: data.availability.workingDays || [],
          timeRanges: data.availability.timeRanges || [{ start: '09:00', end: '17:00' }],
          maxDailyJobs: data.availability.maxDailyJobs || 3,
          blackoutDates: data.availability.blackoutDates || [],
          isActive: data.availability.isActive ?? true,
        });
      }
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      setError(err.message || 'Failed to load availability');
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
      setError('This date is already in the blackout list');
      return;
    }
    setAvailability((prev) => ({
      ...prev,
      blackoutDates: [...prev.blackoutDates, newBlackoutDate],
    }));
    setNewBlackoutDate('');
    setError(null);
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

      for (const range of availability.timeRanges) {
        if (range.start >= range.end) {
          setError('Start time must be before end time');
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`/api/admin/cleaners/${cleanerId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availability),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save availability');
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving availability:', err);
      setError(err.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-vm-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-vm-text">Edit Availability</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-vm-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vm-navy mx-auto" />
              <p className="mt-2 text-sm text-vm-muted">Loading availability...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-vm-surface rounded-lg">
                <div>
                  <p className="text-sm font-medium text-vm-text">Availability Active</p>
                  <p className="text-xs text-vm-muted">Toggle to enable/disable availability</p>
                </div>
                <button
                  onClick={() =>
                    setAvailability((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    availability.isActive ? 'bg-vm-navy' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      availability.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Working Days */}
              <div>
                <h3 className="text-sm font-semibold text-vm-text mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Working Days
                </h3>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => handleWorkingDayToggle(day.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        availability.workingDays.includes(day.value)
                          ? 'bg-vm-navy text-white'
                          : 'bg-vm-surface text-vm-text hover:bg-gray-200'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Ranges */}
              <div>
                <h3 className="text-sm font-semibold text-vm-text mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Working Hours
                </h3>
                <div className="space-y-3">
                  {availability.timeRanges.map((range, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-vm-surface rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-vm-text mb-1">
                            Start
                          </label>
                          <input
                            type="time"
                            value={range.start}
                            onChange={(e) => handleTimeRangeChange(index, 'start', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-vm-text mb-1">End</label>
                          <input
                            type="time"
                            value={range.end}
                            onChange={(e) => handleTimeRangeChange(index, 'end', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                          />
                        </div>
                      </div>
                      {availability.timeRanges.length > 1 && (
                        <button
                          onClick={() => removeTimeRange(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTimeRange}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-vm-muted hover:border-vm-border hover:text-vm-cyan-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Time Range
                  </button>
                </div>
              </div>

              {/* Max Daily Jobs */}
              <div>
                <h3 className="text-sm font-semibold text-vm-text mb-3">Max Daily Jobs</h3>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                />
              </div>

              {/* Blackout Dates */}
              <div>
                <h3 className="text-sm font-semibold text-vm-text mb-3">Blackout Dates</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="date"
                    value={newBlackoutDate}
                    onChange={(e) => setNewBlackoutDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
                  />
                  <button
                    onClick={addBlackoutDate}
                    className="px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors"
                  >
                    Add
                  </button>
                </div>
                {availability.blackoutDates.length > 0 && (
                  <div className="space-y-2">
                    {availability.blackoutDates.map((date) => (
                      <div
                        key={date}
                        className="flex items-center justify-between p-2 bg-vm-surface rounded-lg"
                      >
                        <span className="text-sm text-vm-text">
                          {new Date(date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => removeBlackoutDate(date)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-vm-border px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-vm-text bg-vm-surface rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


















