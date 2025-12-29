'use client';

import { useMemo } from 'react';

interface HabitLog {
    date: string;
    completed: boolean;
}

interface HabitCalendarProps {
    logs: HabitLog[];
    color?: string;
    className?: string;
}

// Get the last N months of dates
function getDateRange(months: number = 12): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    while (startDate <= today) {
        dates.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);
    }

    return dates;
}

// Get week number for positioning
function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Get month labels
function getMonthLabels(dates: Date[]): { month: string; startWeek: number }[] {
    const labels: { month: string; startWeek: number }[] = [];
    let currentMonth = -1;

    dates.forEach((date) => {
        const month = date.getMonth();
        if (month !== currentMonth) {
            currentMonth = month;
            labels.push({
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                startWeek: getWeekNumber(date)
            });
        }
    });

    return labels;
}

export default function HabitCalendar({
    logs,
    color = '#6BCB77',
    className = ''
}: HabitCalendarProps) {
    const dates = useMemo(() => getDateRange(12), []);

    // Create a set of completed dates for quick lookup
    const completedDates = useMemo(() => {
        return new Set(
            logs
                .filter(log => log.completed)
                .map(log => log.date.split('T')[0])
        );
    }, [logs]);

    // Group dates by week
    const weeks = useMemo(() => {
        const weekMap: Map<number, Date[]> = new Map();

        dates.forEach(date => {
            const year = date.getFullYear();
            const weekNum = getWeekNumber(date);
            const key = year * 100 + weekNum; // Unique key per year+week

            if (!weekMap.has(key)) {
                weekMap.set(key, Array(7).fill(null));
            }

            const dayOfWeek = date.getDay();
            weekMap.get(key)![dayOfWeek] = date;
        });

        return Array.from(weekMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([_, days]) => days);
    }, [dates]);

    const monthLabels = useMemo(() => getMonthLabels(dates), [dates]);

    // Get intensity level (0-4) based on how we want to show it
    // For habits, just completed = full color, not completed = gray
    const getColor = (date: Date | null): string => {
        if (!date) return 'transparent';

        const dateStr = date.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        if (dateStr > today) {
            return 'transparent'; // Future date
        }

        if (completedDates.has(dateStr)) {
            return color;
        }

        return '#E5E7EB'; // Not completed (gray)
    };

    const getTooltip = (date: Date | null): string => {
        if (!date) return '';

        const dateStr = date.toISOString().split('T')[0];
        const completed = completedDates.has(dateStr);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `${formattedDate} - ${completed ? '✓ Completed' : '✗ Missed'}`;
    };

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className={`${className}`}>
            {/* Month Labels */}
            <div className="flex mb-1 ml-8 text-xs font-medium text-gray-500">
                {monthLabels.map((label, i) => (
                    <span
                        key={i}
                        className="flex-shrink-0"
                        style={{ width: '40px' }}
                    >
                        {label.month}
                    </span>
                ))}
            </div>

            <div className="flex">
                {/* Day Labels */}
                <div className="flex flex-col gap-[2px] mr-2 text-xs font-medium text-gray-500">
                    {dayLabels.map((day, i) => (
                        <div key={i} className="h-3 flex items-center">
                            {i % 2 === 1 ? day : ''}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex gap-[2px] overflow-x-auto">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[2px]">
                            {week.map((date, dayIndex) => (
                                <div
                                    key={dayIndex}
                                    className="w-3 h-3 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ backgroundColor: getColor(date) }}
                                    title={getTooltip(date)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <span>Less</span>
                <div className="flex gap-[2px]">
                    <div className="w-3 h-3 rounded-sm bg-gray-200" />
                    <div
                        className="w-3 h-3 rounded-sm opacity-40"
                        style={{ backgroundColor: color }}
                    />
                    <div
                        className="w-3 h-3 rounded-sm opacity-70"
                        style={{ backgroundColor: color }}
                    />
                    <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: color }}
                    />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
