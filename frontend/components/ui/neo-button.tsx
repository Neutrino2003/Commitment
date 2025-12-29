import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface NeoButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
}

export const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
        const variants = {
            primary: 'bg-focus-yellow text-ink-black hover:bg-yellow-400',
            secondary: 'bg-white text-ink-black hover:bg-gray-50',
            danger: 'bg-accent-pink text-white hover:bg-pink-600',
            success: 'bg-accent-cyan text-ink-black hover:bg-cyan-300',
        };

        const sizes = {
            sm: 'px-3 py-1 text-sm',
            md: 'px-6 py-3 text-base',
            lg: 'px-8 py-4 text-lg font-bold',
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ y: -2, x: -2, boxShadow: '6px 6px 0px 0px #1A1A1A' }}
                whileTap={{ y: 2, x: 2, boxShadow: '2px 2px 0px 0px #1A1A1A' }}
                className={cn(
                    'neo-button font-bold flex items-center justify-center gap-2',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
);
NeoButton.displayName = 'NeoButton';
