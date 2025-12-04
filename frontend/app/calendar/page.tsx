'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { NeoCard } from '@/components/ui/neo-card';

interface CalendarTask {
    id: string;
    original_id?: number;
    title: string;
    due_date: string;
    priority: number;
    status: string;
    is_virtual?: boolean;
}

interface CalendarResponse {
    start_date: string;
    end_date: string;
    tasks: CalendarTask[];
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get first and last day of current month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data: calendarData, isLoading } = useQuery({
        queryKey: ['calendar', currentDate.getMonth(), currentDate.getFullYear()],
        queryFn: async () => {
            const { data } = await api.get<CalendarResponse>('/calendar/', {
                params: {
                    start_date: startOfMonth.toISOString(),
                    end_date: endOfMonth.toISOString(),
                },
            });
            return data;
        },
    });

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    // Get tasks for a specific date
    const getTasksForDate = (date: Date) => {
        if (!calendarData) return [];
        const dateStr = date.toISOString().split('T')[0];
        return calendarData.tasks.filter((task) => {
            const taskDate = task.due_date.split('T')[0];
            return taskDate === dateStr;
        });
    };

    // Generate calendar grid
    const generateCalendarDays = () => {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
        const daysInMonth = lastDayOfMonth.getDate();

        const days: (Date | null)[] = [];

        // Add empty slots for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        }

        return days;
    };

    const monthNames = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const calendarDays = generateCalendarDays();
    const today = new Date().toDateString();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-black text-2xl animate-pulse">
                LOADING CALENDAR...
            </div>
        );
    }

    const priorityColors = {
        3: '#FF6B6B', // High
        2: '#FFA500', // Medium
        1: '#4ECDC4', // Low
        0: '#95A5A6', // None
    };

    return (
        <AuthCheck>
            <Layout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-4xl font-black">
                            {monthNames[currentDate.getMonth()]} <span className="text-focus-yellow">{currentDate.getFullYear()}</span>
                        </h1>
                        <div className="flex gap-2">
                            <button
                                onClick={goToPreviousMonth}
                                className="px-6 py-3 neo-border bg-white hover:bg-gray-50 font-black text-xl"
                            >
                                ◀
                            </button>
                            <button
                                onClick={goToNextMonth}
                                className="px-6 py-3 neo-border bg-white hover:bg-gray-50 font-black text-xl"
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <NeoCard className="p-0 overflow-hidden">
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 bg-ink-black text-white">
                            {weekDays.map((day) => (
                                <div
                                    key={day}
                                    className="p-4 text-center font-black border-r-2 border-white last:border-r-0"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((date, index) => {
                                if (!date) {
                                    return (
                                        <div
                                            key={`empty-${index}`}
                                            className="aspect-square border-2 border-ink-black bg-gray-50"
                                        />
                                    );
                                }

                                const tasks = getTasksForDate(date);
                                const isToday = date.toDateString() === today;

                                return (
                                    <div
                                        key={index}
                                        className="aspect-square border-2 border-ink-black p-2 bg-white hover:bg-gray-50 relative overflow-hidden"
                                        style={{
                                            backgroundColor: isToday ? '#FFF9C4' : undefined,
                                        }}
                                    >
                                        {/* Date Number */}
                                        <div className="font-black text-lg mb-1">
                                            {date.getDate()}
                                            {isToday && <span className="text-xs ml-1 text-focus-yellow">TODAY</span>}
                                        </div>

                                        {/* Tasks */}
                                        <div className="space-y-1 overflow-y-auto max-h-32">
                                            {tasks.slice(0, 4).map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="text-xs font-bold p-1 border-2 border-ink-black truncate"
                                                    style={{
                                                        backgroundColor: priorityColors[task.priority as keyof typeof priorityColors],
                                                        color: 'white',
                                                        opacity: task.status === 'COMPLETED' ? 0.5 : 1,
                                                    }}
                                                    title={task.title}
                                                >
                                                    {task.is_virtual && '🔄 '}
                                                    {task.title}
                                                </div>
                                            ))}
                                            {tasks.length > 4 && (
                                                <div className="text-xs font-bold text-center text-gray-500">
                                                    +{tasks.length - 4} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </NeoCard>

                    {/* Legend */}
                    <div className="flex gap-4 justify-center flex-wrap">
                        {Object.entries(priorityColors).reverse().map(([priority, color]) => {
                            const labels = { '3': 'HIGH', '2': 'MEDIUM', '1': 'LOW', '0': 'NONE' };
                            return (
                                <div key={priority} className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 border-2 border-ink-black"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="font-bold text-sm">{labels[priority as keyof typeof labels]}</span>
                                </div>
                            );
                        })}
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-lg">🔄</span>
                            <span className="font-bold text-sm">RECURRING</span>
                        </div>
                    </div>
                </div>
            </Layout>
        </AuthCheck>
    );
}
