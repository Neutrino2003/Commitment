'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface ActiveTimer {
    taskId: number;
    taskTitle: string;
    durationMinutes: number;
    startedAt: number; // timestamp
    pausedAt?: number;
    elapsedSeconds: number;
    status: 'running' | 'paused' | 'completed';
}

interface TimerContextType {
    activeTimer: ActiveTimer | null;
    startTimer: (taskId: number, taskTitle: string, durationMinutes: number) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    stopTimer: () => void;
    completeTimer: () => void;
    getElapsedSeconds: () => number;
    getRemainingSeconds: () => number;
}

const TimerContext = createContext<TimerContextType | null>(null);

const STORAGE_KEY = 'commitment_active_timer';

export function TimerProvider({ children }: { children: ReactNode }) {
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const timer = JSON.parse(saved);
                // Recalculate elapsed time if timer was running
                if (timer.status === 'running') {
                    const now = Date.now();
                    const additionalSeconds = Math.floor((now - timer.startedAt) / 1000);
                    timer.elapsedSeconds = Math.min(
                        timer.elapsedSeconds + additionalSeconds,
                        timer.durationMinutes * 60
                    );
                    timer.startedAt = now;
                }
                setActiveTimer(timer);
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Save to localStorage when timer changes
    useEffect(() => {
        if (activeTimer) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(activeTimer));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [activeTimer]);

    // Tick every second when running
    useEffect(() => {
        if (activeTimer?.status !== 'running') return;

        const interval = setInterval(() => {
            setActiveTimer(prev => {
                if (!prev || prev.status !== 'running') return prev;

                const newElapsed = prev.elapsedSeconds + 1;
                const totalSeconds = prev.durationMinutes * 60;

                if (newElapsed >= totalSeconds) {
                    // Timer completed
                    // Trigger notification
                    if (Notification.permission === 'granted') {
                        new Notification('Timer Complete!', {
                            body: `${prev.taskTitle} - Time's up!`,
                            icon: '/favicon.ico'
                        });
                    }

                    return {
                        ...prev,
                        elapsedSeconds: totalSeconds,
                        status: 'completed'
                    };
                }

                return {
                    ...prev,
                    elapsedSeconds: newElapsed
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [activeTimer?.status]);

    const startTimer = useCallback((taskId: number, taskTitle: string, durationMinutes: number) => {
        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        setActiveTimer({
            taskId,
            taskTitle,
            durationMinutes,
            startedAt: Date.now(),
            elapsedSeconds: 0,
            status: 'running'
        });
    }, []);

    const pauseTimer = useCallback(() => {
        setActiveTimer(prev => {
            if (!prev || prev.status !== 'running') return prev;
            return {
                ...prev,
                pausedAt: Date.now(),
                status: 'paused'
            };
        });
    }, []);

    const resumeTimer = useCallback(() => {
        setActiveTimer(prev => {
            if (!prev || prev.status !== 'paused') return prev;
            return {
                ...prev,
                startedAt: Date.now(),
                pausedAt: undefined,
                status: 'running'
            };
        });
    }, []);

    const stopTimer = useCallback(() => {
        setActiveTimer(null);
    }, []);

    const completeTimer = useCallback(() => {
        setActiveTimer(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                status: 'completed'
            };
        });
    }, []);

    const getElapsedSeconds = useCallback(() => {
        return activeTimer?.elapsedSeconds ?? 0;
    }, [activeTimer]);

    const getRemainingSeconds = useCallback(() => {
        if (!activeTimer) return 0;
        return Math.max(0, activeTimer.durationMinutes * 60 - activeTimer.elapsedSeconds);
    }, [activeTimer]);

    return (
        <TimerContext.Provider value={{
            activeTimer,
            startTimer,
            pauseTimer,
            resumeTimer,
            stopTimer,
            completeTimer,
            getElapsedSeconds,
            getRemainingSeconds
        }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}
