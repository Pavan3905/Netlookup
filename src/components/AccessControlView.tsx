import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  X, 
  RotateCcw
} from 'lucide-react';
import { ScheduledPolicy, NetworkDevice, RouterCapabilities } from '../types';

interface AccessControlViewProps {
  schedules: ScheduledPolicy[];
  devices: NetworkDevice[];
  routerCapabilities: RouterCapabilities;
  onAddSchedule: (schedule: ScheduledPolicy) => void;
  onToggleSchedule: (id: string) => void;
  onDeleteSchedule: (id: string) => void;
  onRestoreAllPolicies: () => void;
}

export const AccessControlView: React.FC<AccessControlViewProps> = ({
  schedules,
  devices,
  routerCapabilities,
  onAddSchedule,
  onToggleSchedule,
  onDeleteSchedule,
  onRestoreAllPolicies
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [scheduleName, setScheduleName] = useState('Bedtime Pause');
  const [targetDeviceId, setTargetDeviceId] = useState(devices[0]?.internalId || '');
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('06:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const daysOfWeek = [
    { num: 1, label: 'M' },
    { num: 2, label: 'T' },
    { num: 3, label: 'W' },
    { num: 4, label: 'T' },
    { num: 5, label: 'F' },
    { num: 6, label: 'S' },
    { num: 7, label: 'S' }
  ];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const target = devices.find(d => d.internalId === targetDeviceId);
    if (!target) return;

    const newSchedule: ScheduledPolicy = {
      id: `sch-${Date.now()}`,
      name: scheduleName.trim() || 'Access Schedule',
      targetDeviceId: target.internalId,
      targetName: target.displayName,
      targetMacOrIp: target.macAddress || target.ipAddress,
      action: 'PAUSE_INTERNET',
      startTime,
      endTime,
      activeDays: selectedDays,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isEnabled: true,
      crossesMidnight: endTime < startTime,
      lastExecutedTimestamp: Date.now(),
      lastResult: 'SUCCESS_VERIFIED'
    };

    onAddSchedule(newSchedule);
    setIsCreating(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Control</h1>
          <p className="text-xs text-slate-500">Automated internet pause schedules</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRestoreAllPolicies}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
            title="Resume internet on all paused devices"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Resume All</span>
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-xs text-slate-400">
            No active schedules. Click "New Schedule" to pause access automatically.
          </div>
        ) : (
          schedules.map((schedule) => (
            <div 
              key={schedule.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{schedule.name}</span>
                  <span className="text-xs text-slate-500">· {schedule.targetName}</span>
                </div>

                <div className="text-xs text-slate-600 font-mono flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{schedule.startTime} → {schedule.endTime}</span>
                  {schedule.crossesMidnight && (
                    <span className="text-[10px] text-amber-700 font-sans font-medium">(next day)</span>
                  )}
                </div>

                <div className="flex items-center gap-1 pt-1">
                  {daysOfWeek.map((d) => (
                    <span
                      key={d.num}
                      className={`w-5 h-5 rounded-md text-[10px] font-semibold flex items-center justify-center ${
                        schedule.activeDays.includes(d.num)
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleSchedule(schedule.id)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    schedule.isEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-xs" />
                </button>

                <button
                  onClick={() => onDeleteSchedule(schedule.id)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Schedule Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">New Schedule</h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Schedule Name</label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Device</label>
              <select
                value={targetDeviceId}
                onChange={(e) => setTargetDeviceId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                {devices.map(d => (
                  <option key={d.internalId} value={d.internalId}>
                    {d.displayName} ({d.ipAddress})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pause Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Resume At</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Repeat on Days</label>
              <div className="flex items-center gap-1.5">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.num}
                    type="button"
                    onClick={() => toggleDay(day.num)}
                    className={`flex-1 h-9 rounded-xl text-xs font-bold transition-colors ${
                      selectedDays.includes(day.num)
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
