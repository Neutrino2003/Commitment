import React from 'react';
import { cn } from '@/lib/utils';

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean;
}

export const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
    ({ className, active, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'neo-card p-6 transition-all duration-200',
                    active && '!bg-focus-yellow transform -translate-y-1 !shadow-[8px_8px_0px_0px_#1A1A1A]',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
NeoCard.displayName = 'NeoCard';
