'use client';

import React, { useState, useCallback } from 'react';
import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';
import { useTasks, useTaskMutations } from '@/hooks/useTasks';
import { useLists } from '@/hooks/useLists';
import { Task, List } from '@/lib/types';
import { NeoButton } from '@/components/ui/neo-button';
import { KanbanSquare, LayoutGrid, Plus, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// Status configuration
const STATUS_COLUMNS = [
    { id: 'TODO', label: 'To Do', color: '#4D96FF', bgColor: 'bg-blue-50' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: '#FFA500', bgColor: 'bg-orange-50' },
    { id: 'COMPLETED', label: 'Completed', color: '#6BCB77', bgColor: 'bg-green-50' },
];

// Priority badges
const PRIORITY_CONFIG = {
    3: { label: 'High', color: '#FF6B6B', bg: 'bg-red-100' },
    2: { label: 'Med', color: '#FFA500', bg: 'bg-orange-100' },
    1: { label: 'Low', color: '#4ECDC4', bg: 'bg-teal-100' },
    0: { label: '', color: '#95A5A6', bg: 'bg-gray-100' },
};

export default function KanbanPage() {
    const { data: tasks, isLoading } = useTasks();
    const { data: lists } = useLists();
    const { updateTask, createTask } = useTaskMutations();

    const [selectedListId, setSelectedListId] = useState<number | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [showListFilter, setShowListFilter] = useState(false);

    // Filter tasks by list
    const filteredTasks = tasks?.filter(task => {
        if (selectedListId !== null && task.list !== selectedListId) return false;
        // Exclude cancelled tasks
        if (task.status === 'CANCELLED') return false;
        return true;
    }) || [];

    // Group tasks by status
    const tasksByStatus = STATUS_COLUMNS.reduce((acc, column) => {
        acc[column.id] = filteredTasks.filter(task => task.status === column.id);
        return acc;
    }, {} as Record<string, Task[]>);

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id.toString());
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = useCallback((e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedTask) return;

        if (draggedTask.status !== newStatus) {
            updateTask.mutate(
                {
                    id: draggedTask.id,
                    status: newStatus as Task['status']
                },
                {
                    onSuccess: () => toast.success(`Moved to ${STATUS_COLUMNS.find(c => c.id === newStatus)?.label}`),
                    onError: () => toast.error('Failed to update task'),
                }
            );
        }

        setDraggedTask(null);
    }, [draggedTask, updateTask]);

    const handleDragEnd = () => {
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    // Quick add task
    const handleQuickAdd = async (status: string) => {
        const title = prompt('Task title:');
        if (!title?.trim()) return;

        createTask.mutate(
            {
                title: title.trim(),
                status: status as Task['status'],
                priority: 1,
                list: selectedListId || undefined,
            },
            {
                onSuccess: () => toast.success('Task created'),
                onError: () => toast.error('Failed to create task'),
            }
        );
    };

    const selectedList = lists?.find(l => l.id === selectedListId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-black text-2xl animate-pulse">
                LOADING KANBAN...
            </div>
        );
    }

    return (
        <AuthCheck>
            <Layout>
                <div className="h-[calc(100vh-7rem)] flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black flex items-center gap-3">
                                <KanbanSquare size={32} strokeWidth={2.5} />
                                KANBAN <span className="text-focus-yellow">BOARD</span>
                            </h1>

                            {/* List Filter */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowListFilter(!showListFilter)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-3 border-ink-black font-bold hover:bg-gray-50 transition-colors"
                                >
                                    {selectedList ? (
                                        <>
                                            <span
                                                className="w-3 h-3 border border-ink-black"
                                                style={{ backgroundColor: selectedList.color }}
                                            />
                                            {selectedList.icon} {selectedList.name}
                                        </>
                                    ) : (
                                        <>
                                            <Filter size={16} />
                                            All Lists
                                        </>
                                    )}
                                    <ChevronDown size={16} />
                                </button>

                                {showListFilter && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border-3 border-ink-black shadow-neo z-20">
                                        <button
                                            onClick={() => { setSelectedListId(null); setShowListFilter(false); }}
                                            className={`w-full text-left px-4 py-2 font-medium hover:bg-gray-50 ${selectedListId === null ? 'bg-focus-yellow' : ''}`}
                                        >
                                            All Lists
                                        </button>
                                        {lists?.map((list: List) => (
                                            <button
                                                key={list.id}
                                                onClick={() => { setSelectedListId(list.id); setShowListFilter(false); }}
                                                className={`w-full text-left px-4 py-2 font-medium hover:bg-gray-50 flex items-center gap-2 ${selectedListId === list.id ? 'bg-focus-yellow' : ''}`}
                                            >
                                                <span
                                                    className="w-3 h-3 border border-ink-black"
                                                    style={{ backgroundColor: list.color }}
                                                />
                                                {list.icon} {list.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/tasks">
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border-3 border-ink-black font-bold hover:bg-gray-50">
                                    <LayoutGrid size={18} />
                                    List View
                                </button>
                            </Link>
                            <Link href="/tasks">
                                <NeoButton>
                                    <Plus size={20} strokeWidth={3} className="mr-2" />
                                    NEW TASK
                                </NeoButton>
                            </Link>
                        </div>
                    </div>

                    {/* Kanban Board */}
                    <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
                        {STATUS_COLUMNS.map((column) => (
                            <div
                                key={column.id}
                                className={`flex flex-col border-3 border-ink-black bg-white overflow-hidden transition-all ${dragOverColumn === column.id ? 'ring-4 ring-focus-yellow ring-offset-2' : ''
                                    }`}
                                onDragOver={(e) => handleDragOver(e, column.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                {/* Column Header */}
                                <div
                                    className="flex items-center justify-between p-4 border-b-3 border-ink-black"
                                    style={{ backgroundColor: column.color }}
                                >
                                    <h3 className="font-black text-white uppercase flex items-center gap-2">
                                        {column.label}
                                        <span className="bg-white/30 px-2 py-0.5 rounded text-sm">
                                            {tasksByStatus[column.id]?.length || 0}
                                        </span>
                                    </h3>
                                    <button
                                        onClick={() => handleQuickAdd(column.id)}
                                        className="p-1 bg-white/20 hover:bg-white/40 rounded transition-colors"
                                        title="Quick add"
                                    >
                                        <Plus size={18} className="text-white" strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Column Body */}
                                <div className={`flex-1 overflow-y-auto p-3 space-y-3 ${column.bgColor}`}>
                                    {tasksByStatus[column.id]?.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm font-medium">
                                            Drop tasks here
                                        </div>
                                    ) : (
                                        tasksByStatus[column.id]?.map((task) => (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task)}
                                                onDragEnd={handleDragEnd}
                                                className={`p-3 bg-white border-2 border-ink-black shadow-sm cursor-grab active:cursor-grabbing hover:shadow-neo-sm transition-all ${draggedTask?.id === task.id ? 'opacity-50 scale-95' : ''
                                                    }`}
                                            >
                                                {/* Priority Badge */}
                                                {task.priority > 0 && (
                                                    <span
                                                        className={`inline-block px-2 py-0.5 text-xs font-bold mb-2 ${PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG].bg}`}
                                                        style={{ color: PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG].color }}
                                                    >
                                                        {PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG].label}
                                                    </span>
                                                )}

                                                {/* Task Title */}
                                                <h4 className="font-bold text-sm leading-tight mb-2">
                                                    {task.title}
                                                </h4>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    {/* Due Date */}
                                                    {task.due_date && (
                                                        <span className={`font-medium ${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED'
                                                                ? 'text-red-500'
                                                                : ''
                                                            }`}>
                                                            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}

                                                    {/* Tags */}
                                                    <div className="flex gap-1">
                                                        {task.tags?.slice(0, 2).map(tag => (
                                                            <span
                                                                key={tag.id}
                                                                className="px-1.5 py-0.5 border font-medium"
                                                                style={{ borderColor: tag.color, color: tag.color }}
                                                            >
                                                                #{tag.name}
                                                            </span>
                                                        ))}
                                                        {task.tags?.length > 2 && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 font-medium">
                                                                +{task.tags.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* List indicator */}
                                                {task.list && lists && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <span
                                                            className="text-xs font-medium flex items-center gap-1"
                                                            style={{ color: lists.find(l => l.id === task.list)?.color }}
                                                        >
                                                            {lists.find(l => l.id === task.list)?.icon}
                                                            {lists.find(l => l.id === task.list)?.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Layout>
        </AuthCheck>
    );
}
