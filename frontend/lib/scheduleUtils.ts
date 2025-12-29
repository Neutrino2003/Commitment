/**
 * Schedule utility functions for task time management.
 * Handles time-block, scheduled timer, and deadline task types.
 */

export type ScheduleType = 'time-block' | 'timer' | 'deadline' | 'none';

export interface Task {
    id: number;
    title: string;
    start_date?: string | null;
    due_date?: string | null;
    duration_minutes?: number | null;
    status: string;
    is_recurring?: boolean;
}

/**
 * Determines the schedule type of a task based on its fields.
 */
export function getTaskScheduleType(task: Task): ScheduleType {
    const hasStart = !!task.start_date;
    const hasDue = !!task.due_date;
    const hasDuration = !!task.duration_minutes;

    if (hasStart && hasDue) return 'time-block';        // 3:00 PM - 5:00 PM
    if (hasStart && hasDuration) return 'timer';         // Start at 5:00, 30 mins
    if (hasDue) return 'deadline';                       // Due by Dec 31
    return 'none';
}

/**
 * Calculates time remaining until a date.
 */
export function getTimeUntil(targetDate: string | Date): {
    total: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
} {
    const target = new Date(targetDate);
    const now = new Date();
    const total = target.getTime() - now.getTime();

    if (total <= 0) {
        return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    return {
        total,
        days: Math.floor(total / (1000 * 60 * 60 * 24)),
        hours: Math.floor((total / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((total / (1000 * 60)) % 60),
        seconds: Math.floor((total / 1000) % 60),
        isPast: false,
    };
}

/**
 * Formats duration in minutes to human-readable string.
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Formats remaining time as human-readable countdown.
 */
export function formatTimeRemaining(targetDate: string | Date): string {
    const { days, hours, minutes, seconds, isPast } = getTimeUntil(targetDate);

    if (isPast) return 'Overdue';

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Formats seconds as MM:SS or HH:MM:SS.
 */
export function formatTimerDisplay(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Checks if current time is within task's time block.
 */
export function isWithinTimeBlock(task: Task): boolean {
    if (!task.start_date || !task.due_date) return false;

    const now = new Date();
    const start = new Date(task.start_date);
    const end = new Date(task.due_date);

    return now >= start && now <= end;
}

/**
 * Checks if it's time to start a scheduled task.
 */
export function shouldStartNow(task: Task, bufferMinutes: number = 5): boolean {
    if (!task.start_date) return false;

    const now = new Date();
    const start = new Date(task.start_date);
    const bufferMs = bufferMinutes * 60 * 1000;

    return now >= new Date(start.getTime() - bufferMs) && now <= start;
}

/**
 * Gets the urgency level for styling.
 */
export function getUrgencyLevel(targetDate: string | Date): 'critical' | 'urgent' | 'soon' | 'normal' {
    const { total, isPast } = getTimeUntil(targetDate);

    if (isPast) return 'critical';
    if (total < 60 * 60 * 1000) return 'critical';      // < 1 hour
    if (total < 24 * 60 * 60 * 1000) return 'urgent';   // < 1 day
    if (total < 3 * 24 * 60 * 60 * 1000) return 'soon'; // < 3 days
    return 'normal';
}

/**
 * Gets the start time for today if task is recurring.
 */
export function getTodayStartTime(task: Task): Date | null {
    if (!task.start_date) return null;

    const originalStart = new Date(task.start_date);
    const today = new Date();

    // Create today's start time with same hours/minutes
    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        originalStart.getHours(),
        originalStart.getMinutes(),
        0
    );
}

/**
 * Calculates progress percentage for time blocks.
 */
export function getTimeBlockProgress(task: Task): number {
    if (!task.start_date || !task.due_date) return 0;

    const now = new Date();
    const start = new Date(task.start_date);
    const end = new Date(task.due_date);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    return Math.round((elapsed / total) * 100);
}

/**
 * Calculates progress percentage for timer.
 */
export function getTimerProgress(elapsedSeconds: number, totalMinutes: number): number {
    const totalSeconds = totalMinutes * 60;
    return Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));
}
