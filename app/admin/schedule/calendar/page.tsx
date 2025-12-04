export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: string;
  customerName: string;
  preferredDate: string;
  preferredTime: string | null;
  serviceType: string | null;
  status: string;
  assignedCleaner: {
    id: string;
    name: string;
  } | null;
  branch: {
    name: string;
  };
}

export default function AdminScheduleCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [currentDate]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);

      const response = await fetch(
        `/api/admin/schedule/jobs?days=${getDaysInMonth(currentDate)}`
      );
      const data = await response.json();

      if (data.success) {
        // Filter jobs for current month
        const monthJobs = (data.jobs || []).filter((job: Job) => {
          const jobDate = new Date(job.preferredDate);
          return jobDate >= startDate && jobDate <= endDate;
        });
        setJobs(monthJobs);
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return jobs.filter((job) => {
      const jobDateStr = new Date(job.preferredDate).toISOString().split('T')[0];
      return jobDateStr === dateStr;
    });
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      ACCEPTED: 'bg-green-100 border-green-300 text-green-800',
      DECLINED: 'bg-red-100 border-red-300 text-red-800',
      assigned: 'bg-blue-100 border-blue-300 text-blue-800',
      in_progress: 'bg-purple-100 border-purple-300 text-purple-800',
      completed: 'bg-gray-100 border-gray-300 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days: (Date | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Calendar</h1>
              <p className="text-gray-600">Month view of all scheduled jobs</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin/schedule"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                List View
              </Link>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-24"></div>;
                }

                const dateJobs = getJobsForDate(date);
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isSelected =
                  selectedDate?.toDateString() === date.toDateString();

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`h-24 border rounded-lg p-2 cursor-pointer transition-colors ${
                      isToday
                        ? 'bg-blue-50 border-blue-300'
                        : isSelected
                        ? 'bg-gray-50 border-gray-300'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-16">
                      {dateJobs.slice(0, 2).map((job) => (
                        <div
                          key={job.id}
                          className={`text-xs px-1.5 py-0.5 rounded border ${getStatusColor(
                            job.status
                          )}`}
                          title={`${job.customerName} - ${job.serviceType || 'Service'}`}
                        >
                          <div className="truncate font-medium">
                            {job.customerName.split(' ')[0]}
                          </div>
                          {job.assignedCleaner && (
                            <div className="truncate text-xs opacity-75">
                              {job.assignedCleaner.name.split(' ')[0]}
                            </div>
                          )}
                        </div>
                      ))}
                      {dateJobs.length > 2 && (
                        <div className="text-xs text-gray-500 px-1.5">
                          +{dateJobs.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Jobs on {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <div className="space-y-3">
              {getJobsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-600">No jobs scheduled for this date</p>
              ) : (
                getJobsForDate(selectedDate).map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{job.customerName}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {job.serviceType || 'Cleaning Service'}
                        </p>
                        {job.assignedCleaner && (
                          <p className="text-sm text-gray-600 mt-1">
                            Cleaner: {job.assignedCleaner.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Time: {job.preferredTime || 'TBD'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { status: 'pending', label: 'Pending' },
              { status: 'ACCEPTED', label: 'Accepted' },
              { status: 'DECLINED', label: 'Declined' },
              { status: 'assigned', label: 'Assigned' },
              { status: 'in_progress', label: 'In Progress' },
              { status: 'completed', label: 'Completed' },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border ${getStatusColor(item.status)}`}
                ></div>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

