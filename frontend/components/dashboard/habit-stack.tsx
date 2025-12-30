'use client';

import React from 'react';
import { Habit } from '@/lib/types';
import { LegoBrick } from './lego-brick';
import { Activity, BookOpen, Droplets, Flame, Zap } from 'lucide-react';

// Extended Habit type with computed property
type HabitWithToday = Habit & { completed_today?: boolean };

interface HabitStackProps {
    habits: HabitWithToday[];
}

export function HabitStack({ habits }: HabitStackProps) {
    const colors = ['orange', 'blue', 'green', 'purple', 'red'];
    const icons = [
        <Flame key="1" size={24} strokeWidth={3} />,
        <BookOpen key="2" size={24} strokeWidth={3} />,
        <Zap key="3" size={24} strokeWidth={3} />,
        <Droplets key="4" size={24} strokeWidth={3} />,
        <Activity key="5" size={24} strokeWidth={3} />,
    ];

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Habit Stack</h3>

            <div className="flex flex-col gap-3 pt-2">
                {habits.map((habit, index) => (
                    <LegoBrick
                        key={habit.id}
                        label={habit.name}
                        color={colors[index % colors.length]}
                        icon={icons[index % icons.length]}
                        completed={habit.completed_today}
                        onClick={() => console.log('Toggle habit', habit.id)}
                    />
                ))}
            </div>
        </div>
    );
}
