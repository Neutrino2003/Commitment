'use client';

import { useState } from 'react';
import { useHabits, useHabitMutations } from '@/hooks/useHabits';
import { Habit } from '@/lib/types';
import { Check, X, Flame, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QuickLogWidgetProps {
    className?: string;
}

export default function QuickLogWidget({ className = '' }: QuickLogWidgetProps) {
    const { data: habits, isLoading } = useHabits();
    const { logCompletion } = useHabitMutations();
    const [loggingId, setLoggingId] = useState<number | null>(null);

    const today = new Date().toISOString().split('T')[0];

    const isCompletedToday = (habit: Habit): boolean => {
        return habit.recent_logs?.some(log =>
            log.date.split('T')[0] === today && log.completed
        ) || false;
    };

    const handleLog = async (habitId: number, completed: boolean) => {
        setLoggingId(habitId);
        try {
            await logCompletion.mutateAsync({
                habit: habitId,
                date: today,
                completed
            });
            toast.success(completed ? 'Habit logged! 🎉' : 'Skipped for today');
        } catch (error) {
            toast.error('Failed to log habit');
        } finally {
            setLoggingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className={`p-4 bg-white border-3 border-ink-black ${className}`}>
                <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-gray-200 w-1/2" />
                    <div className="h-12 bg-gray-100" />
                    <div className="h-12 bg-gray-100" />
                </div>
            </div>
        );
    }

    const activeHabits = habits?.filter((h: Habit) => h.is_active) || [];
    const completedCount = activeHabits.filter(isCompletedToday).length;

    return (
        <div className={`p-4 bg-white border-3 border-ink-black ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg uppercase flex items-center gap-2">
                    <Flame size={20} className="text-orange-500" />
                    Today's Habits
                </h3>
                <span className="text-sm font-bold text-gray-500">
                    {completedCount}/{activeHabits.length} done
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 mb-4 border border-ink-black">
                <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${activeHabits.length > 0 ? (completedCount / activeHabits.length) * 100 : 0}%` }}
                />
            </div>

            {/* Habit List */}
            {activeHabits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                    No active habits. Create some!
                </p>
            ) : (
                <div className="space-y-2">
                    {activeHabits.map((habit: Habit) => {
                        const completed = isCompletedToday(habit);
                        const isLogging = loggingId === habit.id;

                        return (
                            <div
                                key={habit.id}
                                className={`flex items-center justify-between p-3 border-2 border-ink-black transition-all ${completed ? 'bg-green-50' : 'bg-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{habit.icon || '📌'}</span>
                                    <div>
                                        <p className={`font-bold ${completed ? 'line-through text-gray-500' : ''}`}>
                                            {habit.name}
                                        </p>
                                        {habit.streak > 0 && (
                                            <p className="text-xs text-orange-500 font-medium flex items-center gap-1">
                                                <TrendingUp size={12} />
                                                {habit.streak} day streak
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {completed ? (
                                        <span className="px-3 py-1 bg-green-500 text-white font-bold text-sm flex items-center gap-1">
                                            <Check size={14} />
                                            Done
                                        </span>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleLog(habit.id, true)}
                                                disabled={isLogging}
                                                className="p-2 bg-green-500 text-white border-2 border-ink-black hover:bg-green-600 disabled:opacity-50 transition-colors"
                                                title="Mark complete"
                                            >
                                                {isLogging ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Check size={16} strokeWidth={3} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleLog(habit.id, false)}
                                                disabled={isLogging}
                                                className="p-2 bg-gray-200 text-gray-600 border-2 border-ink-black hover:bg-gray-300 disabled:opacity-50 transition-colors"
                                                title="Skip today"
                                            >
                                                <X size={16} strokeWidth={3} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* All completed message */}
            {activeHabits.length > 0 && completedCount === activeHabits.length && (
                <div className="mt-4 p-3 bg-focus-yellow border-2 border-ink-black text-center font-bold">
                    🎉 All habits completed today! Keep it up!
                </div>
            )}
        </div>
    );
}
