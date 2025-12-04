'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';
import { useHabits, useHabitMutations } from '@/hooks/useHabits';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard } from '@/components/ui/neo-card';
import { Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function HabitsPage() {
    const { data: habits, isLoading } = useHabits();
    const { logCompletion, createHabit, updateHabit, deleteHabit } = useHabitMutations();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        frequency: 'DAILY' as const,
        color: '#4CAF50',
        icon: '🎯',
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            frequency: 'DAILY',
            color: '#4CAF50',
            icon: '🎯',
        });
        setIsEditing(false);
        setEditingHabitId(null);
        setShowCreateForm(false);
    };

    const handleLogToday = (habitId: number) => {
        const today = new Date().toISOString().split('T')[0];
        logCompletion.mutate({
            habit: habitId,
            date: today,
            completed: true,
        }, {
            onSuccess: () => toast.success('Habit logged!'),
            onError: () => toast.error('Failed to log habit'),
        });
    };

    const handleEditHabit = (habit: any) => {
        setFormData({
            name: habit.name,
            description: habit.description || '',
            frequency: habit.frequency,
            color: habit.color,
            icon: habit.icon || '🎯',
        });
        setEditingHabitId(habit.id);
        setIsEditing(true);
        setShowCreateForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteHabit = (id: number) => {
        if (confirm('Are you sure you want to delete this habit?')) {
            deleteHabit.mutate(id, {
                onSuccess: () => toast.success('Habit deleted'),
                onError: () => toast.error('Failed to delete habit'),
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && editingHabitId) {
            updateHabit.mutate({ id: editingHabitId, ...formData }, {
                onSuccess: () => {
                    toast.success('Habit updated!');
                    resetForm();
                },
                onError: () => toast.error('Failed to update habit'),
            });
        } else {
            createHabit.mutate(formData, {
                onSuccess: () => {
                    toast.success('Habit created!');
                    resetForm();
                },
                onError: () => toast.error('Failed to create habit'),
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-black text-2xl animate-pulse">
                LOADING HABITS...
            </div>
        );
    }

    return (
        <AuthCheck>
            <Layout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-4xl font-black">
                            HABITS <span className="text-focus-yellow">TRACKER</span>
                        </h1>
                        {!showCreateForm && (
                            <NeoButton onClick={() => setShowCreateForm(true)}>
                                + NEW HABIT
                            </NeoButton>
                        )}
                    </div>

                    {/* Create/Edit Form */}
                    {showCreateForm && (
                        <NeoCard className="relative">
                            <button
                                onClick={resetForm}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-black mb-6">{isEditing ? 'EDIT HABIT' : 'NEW HABIT'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-2">HABIT NAME</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow text-lg font-medium"
                                        placeholder="Exercise, Read, Meditate..."
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-2">DESCRIPTION</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow text-lg font-medium"
                                        placeholder="Why is this habit important?"
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold mb-2">FREQUENCY</label>
                                        <select
                                            value={formData.frequency}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                            className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow text-lg font-medium"
                                        >
                                            <option value="DAILY">Daily</option>
                                            <option value="WEEKLY">Weekly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-2">COLOR</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="w-full h-12 neo-border cursor-pointer"
                                            />
                                            <div className="text-4xl">{formData.icon}</div>
                                        </div>
                                    </div>
                                </div>
                                <NeoButton type="submit" className="w-full">
                                    {isEditing ? 'SAVE CHANGES' : 'CREATE HABIT'}
                                </NeoButton>
                            </form>
                        </NeoCard>
                    )}

                    {/* Habits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {habits?.map((habit) => {
                            const today = new Date().toISOString().split('T')[0];
                            const completedToday = habit.recent_logs.some(
                                (log) => log.date === today && log.completed
                            );

                            return (
                                <NeoCard
                                    key={habit.id}
                                    className="relative overflow-hidden group"
                                    style={{
                                        borderLeftWidth: '8px',
                                        borderLeftColor: habit.color,
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="text-3xl mb-2">{habit.icon || '🎯'}</div>
                                            <h3 className="text-xl font-black">{habit.name}</h3>
                                            {habit.description && (
                                                <p className="text-sm opacity-70 mt-1">{habit.description}</p>
                                            )}
                                        </div>

                                        {/* Edit/Delete Actions */}
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditHabit(habit)}
                                                className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-black transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHabit(habit.id)}
                                                className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-500 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="text-center p-3 bg-gray-50 border-2 border-ink-black">
                                            <div className="text-2xl font-black text-focus-yellow">
                                                🔥 {habit.streak}
                                            </div>
                                            <div className="text-xs font-bold opacity-70">STREAK</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 border-2 border-ink-black">
                                            <div className="text-2xl font-black" style={{ color: habit.color }}>
                                                {Math.round(habit.completion_rate)}%
                                            </div>
                                            <div className="text-xs font-bold opacity-70">RATE</div>
                                        </div>
                                    </div>

                                    {/* Log Today Button */}
                                    <NeoButton
                                        onClick={() => handleLogToday(habit.id)}
                                        disabled={completedToday}
                                        className="w-full"
                                        style={{
                                            backgroundColor: completedToday ? '#4CAF50' : undefined,
                                            color: completedToday ? 'white' : undefined,
                                        }}
                                    >
                                        {completedToday ? '✓ DONE TODAY' : 'LOG TODAY'}
                                    </NeoButton>

                                    {/* Recent Logs Mini Heatmap */}
                                    <div className="mt-4 flex gap-1 justify-center">
                                        {Array.from({ length: 7 }).map((_, i) => {
                                            const date = new Date();
                                            date.setDate(date.getDate() - (6 - i));
                                            const dateStr = date.toISOString().split('T')[0];
                                            const log = habit.recent_logs.find((l) => l.date === dateStr);
                                            const completed = log?.completed || false;

                                            return (
                                                <div
                                                    key={i}
                                                    className="w-6 h-6 border-2 border-ink-black"
                                                    style={{
                                                        backgroundColor: completed ? habit.color : '#f5f5f5',
                                                    }}
                                                    title={dateStr}
                                                />
                                            );
                                        })}
                                    </div>
                                </NeoCard>
                            );
                        })}
                    </div>

                    {habits?.length === 0 && !showCreateForm && (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">🎯</div>
                            <h2 className="text-2xl font-black mb-2">NO HABITS YET</h2>
                            <p className="text-lg opacity-70 mb-6">
                                Create your first habit to start building discipline!
                            </p>
                            <NeoButton onClick={() => setShowCreateForm(true)}>
                                + CREATE FIRST HABIT
                            </NeoButton>
                        </div>
                    )}
                </div>
            </Layout>
        </AuthCheck>
    );
}
