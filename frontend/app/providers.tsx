'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { TimerProvider } from '@/contexts/TimerContext';
import LiveTimer from '@/components/tasks/LiveTimer';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <TimerProvider>
                {children}
                <LiveTimer />
                <Toaster position="bottom-left" />
            </TimerProvider>
        </QueryClientProvider>
    );
}
