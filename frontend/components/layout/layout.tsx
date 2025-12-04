'use client';

import React from 'react';
import { CheckSquare, Calendar, Flame, Settings, Home, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NeoCard } from '../ui/neo-card';

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: 'HOME', href: '/' },
        { icon: CheckSquare, label: 'TASKS', href: '/tasks' },
        { icon: Calendar, label: 'CALENDAR', href: '/calendar' },
        { icon: Flame, label: 'HABITS', href: '/habits' },
        { icon: Shield, label: 'COMMITMENTS', href: '/commitments' },
        { icon: Settings, label: 'SETTINGS', href: '/settings' },
    ];

    return (
        <div className="min-h-screen bg-dot-grid p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Floating Sidebar (Menu Card) */}
                <aside className="lg:col-span-3">
                    <NeoCard className="sticky top-8 flex flex-col gap-2 p-4">
                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div className={cn(
                                            "flex items-center gap-4 px-4 py-3 font-black text-lg transition-all rounded-lg hover:bg-gray-100",
                                            isActive && "bg-transparent" // Active state handled by icon/text weight in this design
                                        )}>
                                            <item.icon
                                                size={28}
                                                strokeWidth={3}
                                                className={isActive ? "fill-ink-black" : ""}
                                            />
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                    </NeoCard>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-9">
                    {children}
                </main>
            </div>
        </div>
    );
}
