'use client';

import { useTimer } from '@/contexts/TimerContext';
import { formatTimerDisplay, getTimerProgress } from '@/lib/scheduleUtils';
import { Play, Pause, Square, Check, X, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveTimer() {
    const {
        activeTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        completeTimer,
        getRemainingSeconds
    } = useTimer();

    if (!activeTimer) return null;

    const remainingSeconds = getRemainingSeconds();
    const totalSeconds = activeTimer.durationMinutes * 60;
    const progress = getTimerProgress(activeTimer.elapsedSeconds, activeTimer.durationMinutes);
    const isCompleted = activeTimer.status === 'completed';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <div className={`
                    p-4 border-3 border-ink-black shadow-neo-lg
                    ${isCompleted ? 'bg-green-50' : 'bg-white'}
                    min-w-[280px]
                `}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Timer size={18} className={isCompleted ? 'text-green-500' : 'text-blue-500'} />
                            <span className="font-bold text-sm truncate max-w-[160px]">
                                {activeTimer.taskTitle}
                            </span>
                        </div>
                        <button
                            onClick={stopTimer}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Timer Display */}
                    <div className="text-center mb-4">
                        <div className={`
                            text-4xl font-black font-mono
                            ${isCompleted ? 'text-green-500' : ''}
                            ${remainingSeconds < 60 && !isCompleted ? 'text-red-500 animate-pulse' : ''}
                        `}>
                            {isCompleted ? '✓ DONE' : formatTimerDisplay(remainingSeconds)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {formatTimerDisplay(activeTimer.elapsedSeconds)} / {formatTimerDisplay(totalSeconds)}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 bg-gray-100 border-2 border-ink-black mb-4 overflow-hidden">
                        <motion.div
                            className={`
                                absolute inset-y-0 left-0
                                ${isCompleted ? 'bg-green-500' : 'bg-focus-yellow'}
                            `}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                        {isCompleted ? (
                            <button
                                onClick={stopTimer}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white font-bold border-2 border-ink-black"
                            >
                                <Check size={18} />
                                Complete
                            </button>
                        ) : (
                            <>
                                {activeTimer.status === 'running' ? (
                                    <button
                                        onClick={pauseTimer}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 font-bold border-2 border-ink-black hover:bg-yellow-300 transition-colors"
                                    >
                                        <Pause size={18} />
                                        Pause
                                    </button>
                                ) : (
                                    <button
                                        onClick={resumeTimer}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white font-bold border-2 border-ink-black hover:bg-blue-400 transition-colors"
                                    >
                                        <Play size={18} />
                                        Resume
                                    </button>
                                )}
                                <button
                                    onClick={completeTimer}
                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white font-bold border-2 border-ink-black hover:bg-green-400 transition-colors"
                                    title="Mark Complete"
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    onClick={stopTimer}
                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 font-bold border-2 border-ink-black hover:bg-gray-300 transition-colors"
                                    title="Cancel"
                                >
                                    <Square size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
