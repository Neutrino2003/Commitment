'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface LegoBrickProps {
    color: string;
    label: string;
    icon?: React.ReactNode;
    completed?: boolean;
    onClick?: () => void;
}

export function LegoBrick({ color, label, icon, completed, onClick }: LegoBrickProps) {
    // Map colors to Tailwind classes
    const colorMap: Record<string, string> = {
        orange: 'bg-orange-500 border-orange-700',
        blue: 'bg-blue-500 border-blue-700',
        green: 'bg-green-500 border-green-700',
        purple: 'bg-purple-500 border-purple-700',
        red: 'bg-red-500 border-red-700',
    };

    const studColorMap: Record<string, string> = {
        orange: 'bg-orange-400 border-orange-600',
        blue: 'bg-blue-400 border-blue-600',
        green: 'bg-green-400 border-green-600',
        purple: 'bg-purple-400 border-purple-600',
        red: 'bg-red-400 border-red-600',
    };

    const baseColor = colorMap[color] || colorMap['blue'];
    const studColor = studColorMap[color] || studColorMap['blue'];

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative h-16 w-full rounded-md border-b-4 border-r-4 border-l-2 border-t-2 flex items-center justify-between px-4 cursor-pointer shadow-md mb-1",
                baseColor,
                completed ? "opacity-50 grayscale" : "opacity-100"
            )}
        >
            {/* Studs (Top) */}
            <div className="absolute -top-3 left-0 w-full flex justify-around px-2">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-6 h-3 rounded-t-md border-t-2 border-l-2 border-r-2",
                            studColor
                        )}
                    />
                ))}
            </div>

            <div className="font-black text-white uppercase tracking-wider text-lg truncate">
                {label}
            </div>

            <div className="text-white">
                {completed ? <Check size={24} strokeWidth={4} /> : icon}
            </div>
        </motion.div>
    );
}
