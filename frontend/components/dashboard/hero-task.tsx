'use client';

import React from 'react';
import { NeoCard } from '../ui/neo-card';
import { Pause, Play, CheckSquare, Square, Shield } from 'lucide-react';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface HeroTaskProps {
    task?: Task;
}

export function HeroTask({ task }: HeroTaskProps) {
    const router = useRouter();
    if (!task) {
        return (
            <NeoCard className="bg-gray-100 border-dashed flex items-center justify-center h-96 rounded-xl">
                <p className="text-2xl font-black text-gray-400">NO ACTIVE TASK</p>
            </NeoCard>
        );
    }

    // Dummy subtasks for visualization
    const subtasks = [
        { id: 1, text: "Analyze data", completed: true },
        { id: 2, text: "Write introduction", completed: true },
        { id: 3, text: "Draft main sections", completed: false },
        { id: 4, text: "Create charts", completed: false },
        { id: 5, text: "Review and edit", completed: false },
    ];

    return (
        <div className="relative group">
            {/* Main Card */}
            <div className="bg-focus-yellow border-3 border-ink-black rounded-xl p-8 shadow-[8px_8px_0px_0px_#1A1A1A] relative overflow-hidden">

                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h3 className="font-black text-xl uppercase tracking-tight mb-1">NOW</h3>
                        <div className="flex items-center gap-4">
                            <div className="text-7xl font-black font-mono tracking-tighter text-ink-black">
                                00:24:15
                            </div>
                            <button className="bg-ink-black text-focus-yellow p-2 rounded-full hover:scale-110 transition-transform">
                                <Pause fill="currentColor" size={24} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push(`/commitments/new?task_id=${task.id}`)}
                        className="bg-white border-2 border-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all"
                    >
                        <Shield className="w-5 h-5" />
                        BOOST
                    </button>
                </div>

                {/* Title & Meta */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black leading-tight mb-2 uppercase">{task.title}</h2>
                    <p className="font-bold opacity-70">Due: Today, 5:00 PM</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between font-black text-sm mb-2 uppercase">
                        <span>75% Complete</span>
                    </div>
                    <div className="h-6 w-full bg-black/10 rounded-full border-2 border-ink-black overflow-hidden">
                        <div className="h-full bg-ink-black w-3/4" />
                    </div>
                </div>

                {/* Subtasks */}
                <div className="space-y-3">
                    {subtasks.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-3 font-bold text-lg cursor-pointer group/item">
                            <div className={cn(
                                "w-6 h-6 border-2 border-ink-black rounded flex items-center justify-center transition-colors",
                                sub.completed ? "bg-ink-black text-focus-yellow" : "bg-transparent group-hover/item:bg-black/5"
                            )}>
                                {sub.completed && <CheckSquare size={16} strokeWidth={4} />}
                            </div>
                            <span className={cn(sub.completed && "line-through opacity-50")}>
                                {sub.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
