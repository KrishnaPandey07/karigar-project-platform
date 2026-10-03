import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import LoadingState from '../../components/common/LoadingState';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  CalendarOff,
  Save,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
  { day: 0, label: 'Sunday' },
];

export default function VendorAvailabilityPage() {
  const [schedule, setSchedule] = useState([]);
  const [timeOffs, setTimeOffs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [feedback, setFeedback] = useState({ error: null, success: null });

  // Time off form
  const [newTimeOff, setNewTimeOff] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [isAddingTimeOff, setIsAddingTimeOff] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient('/vendors/me/profile');
      if (res.success && res.data?.vendor) {
        const existingAvail = res.data.vendor.availabilities || [];
        // Map 7 days with defaults if not present
        const mapped = DAYS_OF_WEEK.map(({ day }) => {
          const match = existingAvail.find((a) => a.dayOfWeek === day);
          return {
            dayOfWeek: day,
            startTime: match?.startTime || '09:00',
            endTime: match?.endTime || '17:00',
            isActive: match?.isActive ?? (day !== 0), // Sunday off by default
          };
        });
        setSchedule(mapped);
        setTimeOffs(res.data.vendor.timeOffs || []);
      }
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleChange = (dayOfWeek, field, value) => {
    setSchedule((prev) =>
      prev.map((item) => (item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item))
    );
    setFeedback({ error: null, success: null });
  };

  const handleSaveSchedule = async () => {
    setFeedback({ error: null, success: null });

    // Client-side validation: check endTime > startTime for active days
    for (const item of schedule) {
      if (item.isActive && item.startTime >= item.endTime) {
        const dayName = DAYS_OF_WEEK.find((d) => d.day === item.dayOfWeek)?.label;
        setFeedback({
          error: `On ${dayName}, closing time (${item.endTime}) must be later than opening time (${item.startTime}).`,
          success: null,
        });
        return;
      }
    }

    setIsSavingSchedule(true);
    try {
      const res = await apiClient('/vendors/me/schedule', {
        method: 'PUT',
        body: { schedule },
      });

      if (res.success) {
        setFeedback({ success: 'Weekly working hours updated successfully!', error: null });
      }
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to save schedule', success: null });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleAddTimeOff = async (e) => {
    e.preventDefault();
    setFeedback({ error: null, success: null });

    if (!newTimeOff.startDate || !newTimeOff.endDate) {
      setFeedback({ error: 'Please choose both start and end dates', success: null });
      return;
    }

    if (new Date(newTimeOff.startDate) > new Date(newTimeOff.endDate)) {
      setFeedback({ error: 'End date must be on or after start date', success: null });
      return;
    }

    setIsAddingTimeOff(true);
    try {
      const res = await apiClient('/vendors/me/time-off', {
        method: 'POST',
        body: newTimeOff,
      });

      if (res.success) {
        setFeedback({ success: 'Time off registered successfully!', error: null });
        setNewTimeOff({ startDate: '', endDate: '', reason: '' });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        error: err.message || 'Conflict: Overlaps with an existing time off period.',
        success: null,
      });
    } finally {
      setIsAddingTimeOff(false);
    }
  };

  const handleDeleteTimeOff = async (id) => {
    try {
      await apiClient(`/vendors/me/time-off/${id}`, { method: 'DELETE' });
      setFeedback({ success: 'Time off period removed', error: null });
      await loadData();
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to remove time off', success: null });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your schedule & calendar..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            Working Hours & Availability Schedule
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Specify when you accept jobs and block out personal time off to prevent unwanted requests.
          </p>
        </div>

        <button
          onClick={handleSaveSchedule}
          disabled={isSavingSchedule}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSavingSchedule ? 'Saving...' : 'Save Weekly Schedule'}
        </button>
      </div>

      {feedback.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{feedback.error}</span>
        </div>
      )}

      {feedback.success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span>{feedback.success}</span>
        </div>
      )}

      {/* 7-Day Weekly Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          Weekly Operating Hours
        </h3>

        <div className="divide-y divide-gray-100">
          {DAYS_OF_WEEK.map(({ day, label }) => {
            const item = schedule.find((s) => s.dayOfWeek === day) || {
              isActive: false,
              startTime: '09:00',
              endTime: '17:00',
            };

            return (
              <div
                key={day}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 w-40">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={item.isActive}
                    onChange={(e) => handleScheduleChange(day, 'isActive', e.target.checked)}
                    className="h-4 w-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                  />
                  <label
                    htmlFor={`day-${day}`}
                    className={`text-sm font-semibold ${
                      item.isActive ? 'text-gray-900' : 'text-gray-400 line-through'
                    }`}
                  >
                    {label}
                  </label>
                </div>

                {item.isActive ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">From</span>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-medium text-gray-400 italic">
                    Closed / Not Available
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Off / Blackout Manager */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-brand-600" />
            Time Off & Holiday Blackouts
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Going on vacation or taking a break? Add dates here to automatically pause incoming job dispatches.
          </p>
        </div>

        {/* Add Time Off Form */}
        <form onSubmit={handleAddTimeOff} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-xs font-semibold text-gray-700 block mb-3 uppercase tracking-wider">
            Schedule Time Off
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={newTimeOff.startDate}
                onChange={(e) => setNewTimeOff((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={newTimeOff.endDate}
                onChange={(e) => setNewTimeOff((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">Reason / Note</label>
              <input
                type="text"
                placeholder="e.g. Annual Vacation, Family"
                value={newTimeOff.reason}
                onChange={(e) => setNewTimeOff((p) => ({ ...p, reason: e.target.value }))}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isAddingTimeOff}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition shadow-sm disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {isAddingTimeOff ? 'Adding...' : 'Add Time Off'}
          </button>
        </form>

        {/* Existing Time Offs */}
        {timeOffs.length > 0 ? (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-700 block">Registered Periods:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {timeOffs.map((to) => (
                <div
                  key={to.id}
                  className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div>
                    <span className="font-semibold text-gray-900 block">
                      {new Date(to.startDate).toLocaleDateString()} &rarr; {new Date(to.endDate).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500 text-[11px]">{to.reason || 'Personal Time Off'}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTimeOff(to.id)}
                    title="Remove Time Off"
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No scheduled time off. You are fully bookable!</p>
        )}
      </div>
    </div>
  );
}
