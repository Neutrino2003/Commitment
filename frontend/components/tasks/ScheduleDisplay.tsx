'use client';

import { Task } from '@/lib/types';
import {
    getTaskScheduleType,
    formatDuration,
    formatTimeRemaining,
    isWithinTimeBlock,
    getTimeBlockProgress,
    getTodayStartTime,
    ScheduleType
} from '@/lib/scheduleUtils';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { Calendar, Clock, Timer, Play, AlertCircle } from 'lucide-react';

interface ScheduleDisplayProps {
    task: Task;
    showProgress?: boolean;
    compact?: boolean;
    className?: string;
    onStartTimer?: () => void;
}

export default function ScheduleDisplay({
    task,
    showProgress = true,
    compact = false,
    className = '',
    onStartTimer
}: ScheduleDisplayProps) {
    const scheduleType = getTaskScheduleType(task as any);

    if (scheduleType === 'none') {
        return null;
    }

    // Time Block: 3:00 PM - 5:00 PM
    if (scheduleType === 'time-block') {
        const isActive = isWithinTimeBlock(task as any);
        const progress = getTimeBlockProgress(task as any);
        const startTime = new Date(task.start_date!);
        const endTime = new Date(task.due_date!);

        return (
            <div className={`space-y-2 ${className}`}>
                <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className={isActive ? 'text-green-500' : 'text-gray-400'} />
                    <span className="font-medium">
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' → '}
                        {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isActive && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-white">
                            ACTIVE
                        </span>
                    )}
                </div>

                {showProgress && isActive && (
                    <div className="relative h-2 bg-gray-200 overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-focus-yellow transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {!isActive && task.start_date && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Starts in</span>
                        <CountdownTimer
                            targetDate={getTodayStartTime(task as any) || task.start_date}
                            size="sm"
                        />
                    </div>
                )}
            </div>
        );
    }

    // Scheduled Timer: Start at 5:00 PM for 30 mins
    if (scheduleType === 'timer') {
        const startTime = getTodayStartTime(task as any) || new Date(task.start_date!);
        const now = new Date();
        const isTimeToStart = now >= startTime;

        return (
            <div className={`space-y-2 ${className}`}>
                <div className="flex items-center gap-2 text-sm">
                    <Timer size={14} className="text-blue-500" />
                    <span className="font-medium">
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                        {formatDuration(task.duration_minutes!)}
                    </span>
                </div>

                {!isTimeToStart ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Starts in</span>
                        <CountdownTimer targetDate={startTime} size="sm" />
                    </div>
                ) : (
                    <button
                        onClick={onStartTimer}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm font-bold border-2 border-ink-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo transition-all"
                    >
                        <Play size={14} />
                        Start Timer
                    </button>
                )}

                {task.is_recurring && (
                    <span className="text-xs text-gray-400">🔄 Recurring</span>
                )}
            </div>
        );
    }

    // Deadline: Due by Dec 31
    if (scheduleType === 'deadline') {
        const dueDate = new Date(task.due_date!);
        const now = new Date();
        const isOverdue = now > dueDate;

        return (
            <div className={`space-y-2 ${className}`}>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                    <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                        {dueDate.toLocaleDateString([], {
                            weekday: compact ? undefined : 'short',
                            month: 'short',
                            day: 'numeric'
                        })}
                        {!compact && (
                            <span className="text-gray-400 ml-1">
                                {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </span>
                </div>

                {!compact && (
                    <div className="flex items-center gap-2">
                        {isOverdue ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle size={12} />
                                OVERDUE
                            </span>
                        ) : (
                            <CountdownTimer targetDate={dueDate} size="sm" label="remaining" />
                        )}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
