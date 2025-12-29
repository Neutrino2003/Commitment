'use client';

import React, { useMemo } from 'react';
import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';
import { useHabits } from '@/hooks/useHabits';
import { Habit } from '@/lib/types';
import HabitCalendar from '@/components/habits/HabitCalendar';
import { NeoCard } from '@/components/ui/neo-card';
import Link from 'next/link';
import {
    BarChart3,
    TrendingUp,
    Target,
    Flame,
    Calendar,
    ArrowLeft,
    Award
} from 'lucide-react';

export default function HabitAnalyticsPage() {
    const { data: habits, isLoading } = useHabits();

    // Calculate overall stats
    const stats = useMemo(() => {
        if (!habits) return null;

        const activeHabits = habits.filter((h: Habit) => h.is_active);
        const totalHabits = activeHabits.length;
        const avgCompletionRate = activeHabits.reduce((sum: number, h: Habit) => sum + (h.completion_rate || 0), 0) / (totalHabits || 1);
        const totalStreak = activeHabits.reduce((sum: number, h: Habit) => sum + (h.streak || 0), 0);
        const longestStreak = Math.max(...activeHabits.map((h: Habit) => h.streak || 0), 0);
        const bestHabit = activeHabits.sort((a: Habit, b: Habit) => (b.completion_rate || 0) - (a.completion_rate || 0))[0];

        return {
            totalHabits,
            avgCompletionRate,
            totalStreak,
            longestStreak,
            bestHabit
        };
    }, [habits]);

    // Get day labels for weekly chart
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Calculate weekly completion pattern
    const weeklyPattern = useMemo(() => {
        if (!habits) return dayLabels.map(() => 0);

        const dayCounts = Array(7).fill(0);
        const dayTotals = Array(7).fill(0);

        habits.forEach((habit: Habit) => {
            habit.recent_logs?.forEach(log => {
                const day = new Date(log.date).getDay();
                dayTotals[day]++;
                if (log.completed) dayCounts[day]++;
            });
        });

        return dayCounts.map((count, i) =>
            dayTotals[i] > 0 ? Math.round((count / dayTotals[i]) * 100) : 0
        );
    }, [habits]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-black text-2xl animate-pulse">
                LOADING ANALYTICS...
            </div>
        );
    }

    return (
        <AuthCheck>
            <Layout>
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link
                                href="/habits"
                                className="text-sm font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
                            >
                                <ArrowLeft size={14} />
                                Back to Habits
                            </Link>
                            <h1 className="text-4xl font-black flex items-center gap-3">
                                <BarChart3 size={36} />
                                Habit <span className="text-focus-yellow">Analytics</span>
                            </h1>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <NeoCard className="p-4 text-center">
                            <Flame className="mx-auto text-orange-500 mb-2" size={28} />
                            <div className="text-3xl font-black">{stats?.totalHabits || 0}</div>
                            <div className="text-sm font-bold text-gray-500">Active Habits</div>
                        </NeoCard>

                        <NeoCard className="p-4 text-center">
                            <Target className="mx-auto text-green-500 mb-2" size={28} />
                            <div className="text-3xl font-black">{Math.round(stats?.avgCompletionRate || 0)}%</div>
                            <div className="text-sm font-bold text-gray-500">Avg Completion</div>
                        </NeoCard>

                        <NeoCard className="p-4 text-center">
                            <TrendingUp className="mx-auto text-blue-500 mb-2" size={28} />
                            <div className="text-3xl font-black">{stats?.totalStreak || 0}</div>
                            <div className="text-sm font-bold text-gray-500">Total Streak Days</div>
                        </NeoCard>

                        <NeoCard className="p-4 text-center">
                            <Award className="mx-auto text-purple-500 mb-2" size={28} />
                            <div className="text-3xl font-black">{stats?.longestStreak || 0}</div>
                            <div className="text-sm font-bold text-gray-500">Longest Streak</div>
                        </NeoCard>
                    </div>

                    {/* Weekly Pattern */}
                    <NeoCard className="p-6 mb-8">
                        <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                            <Calendar size={20} />
                            Weekly Completion Pattern
                        </h3>
                        <div className="flex items-end justify-between gap-2 h-40">
                            {dayLabels.map((day, i) => (
                                <div key={day} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-focus-yellow border-2 border-ink-black transition-all"
                                        style={{
                                            height: `${weeklyPattern[i]}%`,
                                            minHeight: '4px'
                                        }}
                                    />
                                    <span className="text-xs font-bold mt-2 text-gray-600">{day}</span>
                                    <span className="text-xs font-medium text-gray-400">{weeklyPattern[i]}%</span>
                                </div>
                            ))}
                        </div>
                    </NeoCard>

                    {/* Individual Habit Calendars */}
                    <h3 className="font-black text-xl mb-4">Habit Heatmaps</h3>
                    <div className="space-y-6">
                        {habits?.filter((h: Habit) => h.is_active).map((habit: Habit) => (
                            <NeoCard key={habit.id} className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{habit.icon || '📌'}</span>
                                        <div>
                                            <h4 className="font-black">{habit.name}</h4>
                                            <p className="text-sm text-gray-500">
                                                {habit.streak} day streak • {Math.round(habit.completion_rate || 0)}% completion
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: habit.color || '#6BCB77' }}
                                    />
                                </div>
                                <HabitCalendar
                                    logs={habit.recent_logs || []}
                                    color={habit.color || '#6BCB77'}
                                />
                            </NeoCard>
                        ))}
                    </div>

                    {/* Best Habit Highlight */}
                    {stats?.bestHabit && (
                        <NeoCard className="p-6 mt-8 bg-gradient-to-r from-focus-yellow to-yellow-200">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">{stats.bestHabit.icon || '🏆'}</div>
                                <div>
                                    <div className="text-sm font-bold text-gray-600">Best Performing Habit</div>
                                    <div className="text-2xl font-black">{stats.bestHabit.name}</div>
                                    <div className="text-sm font-medium">
                                        {Math.round(stats.bestHabit.completion_rate || 0)}% completion rate
                                    </div>
                                </div>
                            </div>
                        </NeoCard>
                    )}
                </div>
            </Layout>
        </AuthCheck>
    );
}
