'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Timer, HelpCircle } from 'lucide-react';

export type ScheduleType = 'none' | 'deadline' | 'time-block' | 'timer';

interface TaskScheduleFormProps {
    /** Current schedule type */
    scheduleType: ScheduleType;
    /** Start time (for time-block and timer) */
    startTime?: string;
    /** End time / Due date */
    endTime?: string;
    /** Duration in minutes (for timer) */
    duration?: number;
    /** Is recurring */
    isRecurring?: boolean;
    /** Recurrence pattern */
    recurrencePattern?: 'daily' | 'weekly' | 'custom';
    /** On change callback */
    onChange: (data: {
        scheduleType: ScheduleType;
        startTime?: string;
        endTime?: string;
        duration?: number;
        isRecurring?: boolean;
        recurrencePattern?: string;
    }) => void;
    /** Compact mode */
    compact?: boolean;
}

const SCHEDULE_OPTIONS = [
    { id: 'none', label: 'No Schedule', icon: HelpCircle, description: 'Simple task without deadline' },
    { id: 'deadline', label: 'Deadline', icon: Calendar, description: 'Complete by specific date/time' },
    { id: 'time-block', label: 'Time Block', icon: Clock, description: 'Work during time window' },
    { id: 'timer', label: 'Timed Session', icon: Timer, description: 'Start at time for duration' },
] as const;

const DURATION_PRESETS = [15, 25, 30, 45, 60, 90, 120];

export default function TaskScheduleForm({
    scheduleType = 'none',
    startTime = '',
    endTime = '',
    duration = 30,
    isRecurring = false,
    recurrencePattern = 'daily',
    onChange,
    compact = false
}: TaskScheduleFormProps) {
    const [localType, setLocalType] = useState<ScheduleType>(scheduleType);
    const [localStartTime, setLocalStartTime] = useState(startTime);
    const [localEndTime, setLocalEndTime] = useState(endTime);
    const [localDuration, setLocalDuration] = useState(duration);
    const [localRecurring, setLocalRecurring] = useState(isRecurring);
    const [localPattern, setLocalPattern] = useState(recurrencePattern);

    // Sync with parent when local values change
    useEffect(() => {
        onChange({
            scheduleType: localType,
            startTime: localStartTime || undefined,
            endTime: localEndTime || undefined,
            duration: localDuration,
            isRecurring: localRecurring,
            recurrencePattern: localRecurring ? localPattern : undefined
        });
    }, [localType, localStartTime, localEndTime, localDuration, localRecurring, localPattern]);

    return (
        <div className="space-y-4">
            {/* Schedule Type Selector */}
            <div>
                <label className="block font-bold text-sm text-gray-600 mb-2 uppercase">
                    Schedule Type
                </label>
                <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
                    {SCHEDULE_OPTIONS.map(option => {
                        const Icon = option.icon;
                        const isSelected = localType === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setLocalType(option.id as ScheduleType)}
                                className={`
                                    p-3 border-2 text-left transition-all
                                    ${isSelected
                                        ? 'border-ink-black bg-focus-yellow'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }
                                `}
                            >
                                <Icon size={18} className="mb-1" />
                                <div className="font-bold text-sm">{option.label}</div>
                                {!compact && (
                                    <div className="text-xs text-gray-500">{option.description}</div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Deadline Options */}
            {localType === 'deadline' && (
                <div className="p-4 bg-gray-50 border-2 border-gray-200 space-y-3">
                    <div>
                        <label className="block font-bold text-sm text-gray-600 mb-1">Due Date & Time</label>
                        <input
                            type="datetime-local"
                            value={localEndTime}
                            onChange={(e) => setLocalEndTime(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-ink-black font-medium focus:outline-none focus:border-focus-yellow"
                        />
                    </div>
                </div>
            )}

            {/* Time Block Options */}
            {localType === 'time-block' && (
                <div className="p-4 bg-gray-50 border-2 border-gray-200 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-sm text-gray-600 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={localStartTime}
                                onChange={(e) => setLocalStartTime(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-ink-black font-medium focus:outline-none focus:border-focus-yellow"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-sm text-gray-600 mb-1">End Time</label>
                            <input
                                type="time"
                                value={localEndTime}
                                onChange={(e) => setLocalEndTime(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-ink-black font-medium focus:outline-none focus:border-focus-yellow"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Timer Options */}
            {localType === 'timer' && (
                <div className="p-4 bg-gray-50 border-2 border-gray-200 space-y-3">
                    <div>
                        <label className="block font-bold text-sm text-gray-600 mb-1">Start Time</label>
                        <input
                            type="time"
                            value={localStartTime}
                            onChange={(e) => setLocalStartTime(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-ink-black font-medium focus:outline-none focus:border-focus-yellow"
                        />
                    </div>
                    <div>
                        <label className="block font-bold text-sm text-gray-600 mb-1">Duration</label>
                        <div className="flex flex-wrap gap-2">
                            {DURATION_PRESETS.map(mins => (
                                <button
                                    key={mins}
                                    type="button"
                                    onClick={() => setLocalDuration(mins)}
                                    className={`
                                        px-3 py-1 border-2 font-bold text-sm transition-all
                                        ${localDuration === mins
                                            ? 'border-ink-black bg-blue-500 text-white'
                                            : 'border-gray-300 bg-white hover:border-gray-400'
                                        }
                                    `}
                                >
                                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                                </button>
                            ))}
                            <input
                                type="number"
                                value={localDuration}
                                onChange={(e) => setLocalDuration(parseInt(e.target.value) || 30)}
                                className="w-20 px-2 py-1 border-2 border-gray-300 font-medium text-center"
                                min={1}
                                max={480}
                            />
                            <span className="self-center text-sm text-gray-500">mins</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Recurring Options */}
            {localType !== 'none' && (
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localRecurring}
                            onChange={(e) => setLocalRecurring(e.target.checked)}
                            className="w-5 h-5 border-2 border-ink-black"
                        />
                        <span className="font-bold text-sm">Repeat</span>
                    </label>

                    {localRecurring && (
                        <select
                            value={localPattern}
                            onChange={(e) => setLocalPattern(e.target.value as any)}
                            className="px-3 py-1 border-2 border-ink-black font-medium"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekdays">Weekdays</option>
                            <option value="weekly">Weekly</option>
                            <option value="custom">Custom...</option>
                        </select>
                    )}
                </div>
            )}
        </div>
    );
}
