'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatTimerDisplay, getTimeUntil, getUrgencyLevel } from '@/lib/scheduleUtils';

interface CountdownTimerProps {
    /** Target date/time to count down to */
    targetDate: string | Date;
    /** Label to show above timer */
    label?: string;
    /** Callback when countdown reaches zero */
    onComplete?: () => void;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show seconds (default: true for < 1 hour) */
    showSeconds?: boolean;
    /** Custom class name */
    className?: string;
}

export default function CountdownTimer({
    targetDate,
    label,
    onComplete,
    size = 'md',
    showSeconds,
    className = ''
}: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(() => getTimeUntil(targetDate));

    useEffect(() => {
        const timer = setInterval(() => {
            const newTime = getTimeUntil(targetDate);
            setTimeLeft(newTime);

            if (newTime.isPast && onComplete) {
                onComplete();
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    const urgency = getUrgencyLevel(targetDate);

    const urgencyColors = {
        critical: 'text-red-600 bg-red-50 border-red-500',
        urgent: 'text-orange-600 bg-orange-50 border-orange-500',
        soon: 'text-yellow-600 bg-yellow-50 border-yellow-500',
        normal: 'text-gray-700 bg-gray-50 border-gray-300',
    };

    const sizeClasses = {
        sm: 'text-sm px-2 py-1',
        md: 'text-lg px-3 py-2',
        lg: 'text-2xl px-4 py-3 font-black',
    };

    // Determine if we should show seconds
    const shouldShowSeconds = showSeconds ?? (timeLeft.days === 0 && timeLeft.hours === 0);

    const formatDisplay = () => {
        if (timeLeft.isPast) {
            return 'OVERDUE';
        }

        if (timeLeft.days > 0) {
            return `${timeLeft.days}d ${timeLeft.hours}h`;
        }

        if (timeLeft.hours > 0) {
            if (shouldShowSeconds) {
                return `${timeLeft.hours}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;
            }
            return `${timeLeft.hours}h ${timeLeft.minutes}m`;
        }

        if (shouldShowSeconds) {
            return formatTimerDisplay(timeLeft.minutes * 60 + timeLeft.seconds);
        }

        return `${timeLeft.minutes}m`;
    };

    return (
        <div className={`inline-flex flex-col items-center ${className}`}>
            {label && (
                <span className="text-xs font-medium text-gray-500 mb-1 uppercase">
                    {label}
                </span>
            )}
            <div
                className={`
                    font-mono font-bold border-2 
                    ${urgencyColors[urgency]} 
                    ${sizeClasses[size]}
                    ${timeLeft.isPast ? 'animate-pulse' : ''}
                `}
            >
                {formatDisplay()}
            </div>
        </div>
    );
}
