'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TaskQueueProps {
    tasks: Task[];
}

export function TaskQueue({ tasks }: TaskQueueProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Next</h3>

            <div className="flex flex-col gap-4">
                {tasks.map((task) => {
                    // Determine color based on priority or context (mock logic for now)
                    const colorClass = task.priority === 3 ? "bg-accent-pink" :
                        task.priority === 2 ? "bg-accent-cyan" : "bg-focus-yellow";

                    const borderColorClass = task.priority === 3 ? "border-accent-pink" :
                        task.priority === 2 ? "border-accent-cyan" : "border-focus-yellow";

                    return (
                        <div
                            key={task.id}
                            className="relative bg-white border-3 border-ink-black rounded-xl p-0 shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer overflow-hidden group"
                        >
                            <div className="flex items-stretch">
                                {/* Colored Strip */}
                                <div className={cn("w-4 border-r-3 border-ink-black", colorClass)} />

                                <div className="p-4 flex-1 flex flex-col justify-center">
                                    <h4 className="font-black text-xl leading-none mb-1 uppercase">{task.title}</h4>
                                    <div className="flex items-center gap-2 text-sm font-bold opacity-60">
                                        <span>Tomorrow, 10:00 AM</span>
                                        <span>•</span>
                                        <span>#{task.tags?.[0]?.name || 'Work'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
