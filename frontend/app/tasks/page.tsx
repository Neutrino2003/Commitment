'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';
import { useTasks, useTaskMutations } from '@/hooks/useTasks';
import { useLists } from '@/hooks/useLists';
import { useTags } from '@/hooks/useTags';
import { Task } from '@/lib/types';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoButton } from '@/components/ui/neo-button';
import { Filter, Plus, SortAsc, Calendar as CalendarIcon, Tag as TagIcon, List as ListIcon, KanbanSquare } from 'lucide-react';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { TaskCard } from '@/components/tasks/TaskCard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TasksPage() {
    const router = useRouter();
    const { data: tasks, isLoading } = useTasks();
    const { data: lists } = useLists();
    const { data: tags } = useTags();
    const { completeTask, createTask, updateTask, deleteTask } = useTaskMutations();
    const queryClient = useQueryClient();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Default to tomorrow 9 AM
    const getDefaultDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const [newTask, setNewTask] = useState({
        title: '',
        notes: '',
        priority: 1,
        due_date: getDefaultDate(),
        list: '' as string | number,
        parent_id: null as number | null,
    });

    const [filter, setFilter] = useState({
        list: null as number | null,
        tag: null as number | null,
        priority: null as number | null,
        status: 'TODO' as string | null,
    });

    const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('priority');

    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

    const handleEditTask = (task: Task) => {
        setNewTask({
            title: task.title,
            notes: task.notes || '',
            priority: task.priority,
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
            list: task.list || '',
            parent_id: task.parent || null,
        });
        setEditingTaskId(task.id);
        setIsEditing(true);
        setShowCreateModal(true);
    };

    const handleAddSubtask = (parentTask: Task) => {
        setNewTask({
            title: '',
            notes: '',
            priority: parentTask.priority,
            due_date: parentTask.due_date ? parentTask.due_date.split('T')[0] : getDefaultDate(),
            list: parentTask.list || '',
            parent_id: parentTask.id,
        });
        setIsEditing(false);
        setEditingTaskId(null);
        setShowCreateModal(true);
    };

    const handleBoostTask = (task: Task) => {
        router.push(`/commitments/new?task_id=${task.id}`);
    };

    const handleDeleteTask = (id: number) => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask.mutate(id, {
                onSuccess: () => toast.success('Task deleted'),
                onError: () => toast.error('Failed to delete task'),
            });
        }
    };

    const handleSubmitTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...newTask,
            list: newTask.list ? Number(newTask.list) : null,
            due_date: newTask.due_date || null,
            tag_ids: [],
            // parent_id is already in newTask
        };

        if (isEditing && editingTaskId) {
            updateTask.mutate({ id: editingTaskId, ...payload, priority: payload.priority as 0 | 1 | 2 | 3 }, {
                onSuccess: () => {
                    toast.success('Task Updated!');
                    setShowCreateModal(false);
                    resetForm();
                },
                onError: () => toast.error('Failed to update task'),
            });
        } else {
            createTask.mutate({ ...payload, priority: payload.priority as 0 | 1 | 2 | 3 }, {
                onSuccess: () => {
                    toast.success('Task Created!');
                    setShowCreateModal(false);
                    resetForm();
                },
                onError: () => toast.error('Failed to create task'),
            });
        }
    };

    const resetForm = () => {
        setNewTask({ title: '', notes: '', priority: 1, due_date: getDefaultDate(), list: '', parent_id: null });
        setIsEditing(false);
        setEditingTaskId(null);
    };

    // Filter Logic
    const filteredTasks = tasks?.filter(task => {
        if (filter.status && task.status !== filter.status && !(filter.status === 'ALL')) return false;
        if (filter.status === 'TODO' && task.status === 'COMPLETED') return false;

        if (filter.list && task.list !== filter.list) return false;
        if (filter.tag && !task.tags.some(t => t.id === filter.tag)) return false;
        if (filter.priority !== null && task.priority !== filter.priority) return false;

        return true;
    }) || [];

    // Sort Logic
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        // If sorting by priority or due_date, we might break tree structure visually,
        // but let's keep it simple for now.
        if (sortBy === 'priority') return b.priority - a.priority;
        if (sortBy === 'due_date') {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Tree Rendering Helper
    const renderTaskTree = (taskList: Task[]) => {
        // If we are filtering or sorting by something other than default,
        // we might want to show a flat list to avoid confusion.
        // But let's try to nest if possible.

        // Group by parent
        const taskMap = new Map<number, Task>();
        const childrenMap = new Map<number, Task[]>();

        taskList.forEach(task => {
            taskMap.set(task.id, task);
            const parentId = task.parent || task.parent_id;
            if (parentId) {
                if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
                childrenMap.get(parentId)?.push(task);
            }
        });

        // Identify roots (tasks whose parents are not in the current filtered list OR have no parent)
        const roots = taskList.filter(task => {
            const parentId = task.parent || task.parent_id;
            return !parentId || !taskMap.has(parentId);
        });

        // Recursive render
        const renderNode = (task: Task) => (
            <div key={task.id} className="relative">
                <TaskCard
                    task={task}
                    onComplete={(id: number) => completeTask.mutate(id)}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    onBoost={handleBoostTask}
                    onClick={setSelectedTask}
                    listName={lists?.find(l => l.id === task.list)?.name}
                />
                {childrenMap.has(task.id) && (
                    <div className="ml-6 mt-2 pl-2 border-l-2 border-gray-100 space-y-2">
                        {childrenMap.get(task.id)?.map(child => renderNode(child))}
                    </div>
                )}
            </div>
        );

        return (
            <div className="space-y-3">
                {roots.map(task => renderNode(task))}
            </div>
        );
    };

    const priorityColors = {
        3: '#FF6B6B', // High
        2: '#FFA500', // Medium
        1: '#4ECDC4', // Low
        0: '#95A5A6', // None
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-black text-2xl animate-pulse">
                LOADING TASKS...
            </div>
        );
    }

    return (
        <AuthCheck>
            <Layout>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
                    {/* Sidebar Filters */}
                    <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={24} strokeWidth={3} />
                            <h2 className="text-2xl font-black">FILTERS</h2>
                        </div>

                        {/* Status Filter */}
                        <NeoCard className="p-4 space-y-2">
                            <h3 className="font-bold mb-2">STATUS</h3>
                            {['TODO', 'COMPLETED', 'ALL'].map(status => (
                                <div
                                    key={status}
                                    onClick={() => setFilter({ ...filter, status: status === 'ALL' ? null : status })}
                                    className={`cursor-pointer px-3 py-2 font-bold border-2 border-transparent hover:border-ink-black ${filter.status === (status === 'ALL' ? null : status) ? 'bg-focus-yellow border-ink-black' : ''}`}
                                >
                                    {status}
                                </div>
                            ))}
                        </NeoCard>

                        {/* Priority Filter */}
                        <NeoCard className="p-4 space-y-2">
                            <h3 className="font-bold mb-2">PRIORITY</h3>
                            <div className="flex flex-wrap gap-2">
                                {[3, 2, 1, 0].map(p => (
                                    <div
                                        key={p}
                                        onClick={() => setFilter({ ...filter, priority: filter.priority === p ? null : p })}
                                        className={`w-8 h-8 flex items-center justify-center border-2 border-ink-black cursor-pointer font-bold ${filter.priority === p ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                                        style={{ backgroundColor: priorityColors[p as keyof typeof priorityColors] }}
                                    >
                                        {p}
                                    </div>
                                ))}
                            </div>
                        </NeoCard>

                        {/* Lists Filter */}
                        <NeoCard className="p-4 space-y-2">
                            <h3 className="font-bold mb-2 flex items-center gap-2">
                                <ListIcon size={16} /> LISTS
                            </h3>
                            <div className="space-y-1">
                                <div
                                    onClick={() => setFilter({ ...filter, list: null })}
                                    className={`cursor-pointer px-2 py-1 font-bold hover:bg-gray-100 ${filter.list === null ? 'text-focus-yellow' : ''}`}
                                >
                                    ALL LISTS
                                </div>
                                {lists?.map(list => (
                                    <div
                                        key={list.id}
                                        onClick={() => setFilter({ ...filter, list: filter.list === list.id ? null : list.id })}
                                        className={`cursor-pointer px-2 py-1 font-bold hover:bg-gray-100 flex items-center gap-2 ${filter.list === list.id ? 'bg-gray-100' : ''}`}
                                    >
                                        <span>{list.icon}</span>
                                        <span style={{ color: list.color }}>{list.name}</span>
                                    </div>
                                ))}
                            </div>
                        </NeoCard>

                        {/* Tags Filter */}
                        <NeoCard className="p-4 space-y-2">
                            <h3 className="font-bold mb-2 flex items-center gap-2">
                                <TagIcon size={16} /> TAGS
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {tags?.map(tag => (
                                    <div
                                        key={tag.id}
                                        onClick={() => setFilter({ ...filter, tag: filter.tag === tag.id ? null : tag.id })}
                                        className={`px-2 py-1 border-2 border-ink-black text-xs font-bold cursor-pointer ${filter.tag === tag.id ? 'bg-ink-black text-white' : 'bg-white'}`}
                                        style={{ borderColor: filter.tag === tag.id ? 'black' : tag.color, color: filter.tag === tag.id ? 'white' : 'black' }}
                                    >
                                        #{tag.name}
                                    </div>
                                ))}
                            </div>
                        </NeoCard>
                    </div>

                    {/* Task List */}
                    <div className="lg:col-span-9 flex flex-col h-full">
                        {/* Toolbar */}
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-4xl font-black">
                                ALL <span className="text-focus-yellow">TASKS</span>
                                <span className="ml-4 text-lg opacity-50 font-medium">({filteredTasks.length})</span>
                            </h1>

                            <div className="flex gap-4">
                                {/* View Toggle */}
                                <Link href="/tasks/kanban">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-ink-black font-bold hover:bg-gray-50 transition-colors">
                                        <KanbanSquare size={18} />
                                        Kanban
                                    </button>
                                </Link>
                                <div className="flex items-center gap-2 bg-white border-2 border-ink-black px-3 py-2">
                                    <SortAsc size={20} />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="font-bold bg-transparent focus:outline-none"
                                    >
                                        <option value="priority">PRIORITY</option>
                                        <option value="due_date">DUE DATE</option>
                                        <option value="created_at">NEWEST</option>
                                    </select>
                                </div>
                                <NeoButton onClick={() => setShowCreateModal(true)}>
                                    <Plus size={20} strokeWidth={3} className="mr-2" />
                                    NEW TASK
                                </NeoButton>
                            </div>
                        </div>

                        {/* Tasks Container */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-20">
                            {sortedTasks.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <div className="text-6xl mb-4">📝</div>
                                    <h2 className="text-2xl font-black">NO TASKS FOUND</h2>
                                    <p>Try adjusting your filters or create a new task.</p>
                                </div>
                            ) : (
                                renderTaskTree(sortedTasks as Task[])
                            )}
                        </div>
                    </div>
                </div>

                {/* Create/Edit Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <NeoCard className="w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                            <h2 className="text-2xl font-black mb-6">{isEditing ? 'EDIT TASK' : 'NEW TASK'}</h2>
                            <form onSubmit={handleSubmitTask} className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-2">TITLE</label>
                                    <input
                                        type="text"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                                        placeholder="What needs to be done?"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-2">NOTES</label>
                                    <textarea
                                        value={newTask.notes}
                                        onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                                        className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                                        placeholder="Add details..."
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold mb-2">PRIORITY</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                                            className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                                        >
                                            <option value={3}>High</option>
                                            <option value={2}>Medium</option>
                                            <option value={1}>Low</option>
                                            <option value={0}>None</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-2">LIST</label>
                                        <select
                                            value={newTask.list}
                                            onChange={(e) => setNewTask({ ...newTask, list: e.target.value })}
                                            className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                                        >
                                            <option value="">No List</option>
                                            {lists?.map(list => (
                                                <option key={list.id} value={list.id}>{list.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-bold mb-2">DUE DATE</label>
                                    <input
                                        type="date"
                                        value={newTask.due_date}
                                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                        className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                                    />
                                </div>
                                <NeoButton type="submit" className="w-full mt-4">
                                    {isEditing ? 'SAVE CHANGES' : 'CREATE TASK'}
                                </NeoButton>
                            </form>
                        </NeoCard>
                    </div>
                )}

                {/* Task Detail Modal */}
                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={() => setSelectedTask(null)}
                        onDelete={(id) => {
                            handleDeleteTask(id);
                            setSelectedTask(null);
                        }}
                    />
                )}
            </Layout>
        </AuthCheck>
    );
}
