'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useCommitments } from '@/hooks/useCommitments';
import { useLists } from '@/hooks/useLists';
import {
    Search,
    Command,
    CheckSquare,
    Flame,
    Shield,
    FolderOpen,
    Plus,
    Calendar,
    Settings,
    KanbanSquare,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
    id: string;
    title: string;
    description?: string;
    icon: React.ReactNode;
    action: () => void;
    category: 'navigation' | 'task' | 'habit' | 'commitment' | 'action';
}

export default function CommandPalette() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: tasks } = useTasks();
    const { data: habits } = useHabits();
    const { data: commitments } = useCommitments();
    const { data: lists } = useLists();

    // Keyboard shortcut to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Build command items
    const commandItems: CommandItem[] = [
        // Navigation
        { id: 'nav-home', title: 'Go to Home', icon: <ArrowRight size={16} />, action: () => router.push('/'), category: 'navigation' },
        { id: 'nav-tasks', title: 'Go to Tasks', icon: <CheckSquare size={16} />, action: () => router.push('/tasks'), category: 'navigation' },
        { id: 'nav-kanban', title: 'Go to Kanban Board', icon: <KanbanSquare size={16} />, action: () => router.push('/tasks/kanban'), category: 'navigation' },
        { id: 'nav-habits', title: 'Go to Habits', icon: <Flame size={16} />, action: () => router.push('/habits'), category: 'navigation' },
        { id: 'nav-commitments', title: 'Go to Commitments', icon: <Shield size={16} />, action: () => router.push('/commitments'), category: 'navigation' },
        { id: 'nav-calendar', title: 'Go to Calendar', icon: <Calendar size={16} />, action: () => router.push('/calendar'), category: 'navigation' },
        { id: 'nav-settings', title: 'Go to Settings', icon: <Settings size={16} />, action: () => router.push('/settings'), category: 'navigation' },

        // Actions
        { id: 'action-new-task', title: 'Create New Task', icon: <Plus size={16} />, action: () => router.push('/tasks'), category: 'action' },
        { id: 'action-new-commitment', title: 'Create New Commitment', icon: <Plus size={16} />, action: () => router.push('/commitments/new'), category: 'action' },

        // Tasks (dynamic)
        ...(tasks?.slice(0, 5).map(task => ({
            id: `task-${task.id}`,
            title: task.title,
            description: task.status === 'COMPLETED' ? '✓ Completed' : task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : undefined,
            icon: <CheckSquare size={16} className={task.status === 'COMPLETED' ? 'text-green-500' : ''} />,
            action: () => router.push('/tasks'),
            category: 'task' as const,
        })) || []),

        // Habits (dynamic)
        ...(habits?.slice(0, 5).map(habit => ({
            id: `habit-${habit.id}`,
            title: habit.name,
            description: `${habit.streak} day streak`,
            icon: <Flame size={16} className="text-orange-500" />,
            action: () => router.push('/habits'),
            category: 'habit' as const,
        })) || []),

        // Commitments (dynamic)
        ...(commitments?.slice(0, 5).map(commitment => ({
            id: `commitment-${commitment.id}`,
            title: commitment.title,
            description: commitment.status,
            icon: <Shield size={16} className="text-purple-500" />,
            action: () => router.push('/commitments'),
            category: 'commitment' as const,
        })) || []),

        // Lists (dynamic)
        ...(lists?.map(list => ({
            id: `list-${list.id}`,
            title: `${list.icon || '📁'} ${list.name}`,
            description: 'View tasks in list',
            icon: <FolderOpen size={16} style={{ color: list.color }} />,
            action: () => router.push('/tasks'),
            category: 'navigation' as const,
        })) || []),
    ];

    // Filter items based on query
    const filteredItems = query
        ? commandItems.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
        )
        : commandItems;

    // Group by category
    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, CommandItem[]>);

    const flatItems = filteredItems;

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatItems[selectedIndex]) {
                flatItems[selectedIndex].action();
                setIsOpen(false);
            }
        }
    }, [flatItems, selectedIndex]);

    const categoryLabels: Record<string, string> = {
        navigation: 'Navigation',
        action: 'Quick Actions',
        task: 'Tasks',
        habit: 'Habits',
        commitment: 'Commitments',
    };

    return (
        <>
            {/* Trigger Button - Can be placed in navbar */}
            <button
                onClick={() => setIsOpen(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-2 border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-200 transition-colors"
            >
                <Search size={14} />
                <span>Search...</span>
                <kbd className="ml-2 px-1.5 py-0.5 bg-white border text-xs rounded font-mono">⌘K</kbd>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        {/* Command Palette */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
                        >
                            <div className="bg-white border-3 border-ink-black shadow-neo mx-4">
                                {/* Search Input */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-gray-200">
                                    <Command size={20} className="text-gray-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            setSelectedIndex(0);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a command or search..."
                                        className="flex-1 bg-transparent outline-none font-medium text-lg"
                                    />
                                    <kbd className="px-2 py-1 bg-gray-100 border text-xs rounded font-mono">ESC</kbd>
                                </div>

                                {/* Results */}
                                <div className="max-h-80 overflow-y-auto p-2">
                                    {flatItems.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No results found for "{query}"
                                        </div>
                                    ) : (
                                        Object.entries(groupedItems).map(([category, items]) => (
                                            <div key={category} className="mb-2">
                                                <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase">
                                                    {categoryLabels[category] || category}
                                                </div>
                                                {items.map((item, idx) => {
                                                    const globalIndex = flatItems.indexOf(item);
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => {
                                                                item.action();
                                                                setIsOpen(false);
                                                            }}
                                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${globalIndex === selectedIndex
                                                                    ? 'bg-focus-yellow'
                                                                    : 'hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            <span className="text-gray-600">{item.icon}</span>
                                                            <div className="flex-1 text-left">
                                                                <div className="font-medium">{item.title}</div>
                                                                {item.description && (
                                                                    <div className="text-xs text-gray-500">{item.description}</div>
                                                                )}
                                                            </div>
                                                            {globalIndex === selectedIndex && (
                                                                <ArrowRight size={14} className="text-gray-400" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-4 py-2 border-t-2 border-gray-200 text-xs text-gray-400">
                                    <div className="flex items-center gap-4">
                                        <span><kbd className="px-1 bg-gray-100 rounded">↑↓</kbd> Navigate</span>
                                        <span><kbd className="px-1 bg-gray-100 rounded">↵</kbd> Select</span>
                                        <span><kbd className="px-1 bg-gray-100 rounded">ESC</kbd> Close</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
