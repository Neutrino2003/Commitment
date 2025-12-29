'use client';

import { useState, useEffect } from 'react';
import { useListMutations } from '@/hooks/useLists';
import { List } from '@/lib/types';
import { X } from 'lucide-react';
import { NeoButton } from '@/components/ui/neo-button';

interface ListFormProps {
    list?: List | null;
    onClose: () => void;
    onSuccess: () => void;
}

const PRESET_COLORS = [
    '#FF6B6B', // Red
    '#FF8E53', // Orange
    '#FFD93D', // Yellow
    '#6BCB77', // Green
    '#4D96FF', // Blue
    '#9B59B6', // Purple
    '#E91E63', // Pink
    '#00BCD4', // Cyan
    '#795548', // Brown
    '#607D8B', // Gray
];

const PRESET_ICONS = ['📋', '💼', '🏠', '🛒', '💡', '🎯', '📚', '🏋️', '🎮', '✈️', '💰', '❤️'];

export default function ListForm({ list, onClose, onSuccess }: ListFormProps) {
    const { createList, updateList } = useListMutations();
    const [name, setName] = useState(list?.name || '');
    const [color, setColor] = useState(list?.color || '#4D96FF');
    const [icon, setIcon] = useState(list?.icon || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (list) {
            setName(list.name);
            setColor(list.color);
            setIcon(list.icon);
        }
    }, [list]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        setIsSubmitting(true);

        const data = { name: name.trim(), color, icon };

        try {
            if (list) {
                await updateList.mutateAsync({ id: list.id, ...data });
            } else {
                await createList.mutateAsync(data);
            }
            onSuccess();
        } catch (error) {
            console.error('Failed to save list:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border-3 border-ink-black shadow-neo p-6 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black uppercase">
                        {list ? 'Edit List' : 'New List'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 transition-colors"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Input */}
                    <div>
                        <label className="block font-bold mb-2 uppercase text-sm">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Work, Personal, Shopping..."
                            className="w-full px-4 py-3 border-3 border-ink-black font-medium focus:outline-none focus:border-focus-yellow"
                            autoFocus
                            required
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block font-bold mb-2 uppercase text-sm">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 border-2 transition-all ${color === c
                                            ? 'border-ink-black scale-110 shadow-neo-sm'
                                            : 'border-transparent hover:border-gray-300'
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        {/* Custom Color Input */}
                        <div className="flex items-center gap-2 mt-3">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-10 h-10 border-2 border-ink-black cursor-pointer"
                            />
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                placeholder="#FFFFFF"
                                className="flex-1 px-3 py-2 border-2 border-ink-black font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Icon Picker */}
                    <div>
                        <label className="block font-bold mb-2 uppercase text-sm">
                            Icon (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setIcon('')}
                                className={`w-10 h-10 border-2 font-medium text-sm ${icon === ''
                                        ? 'border-ink-black bg-gray-100'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                ∅
                            </button>
                            {PRESET_ICONS.map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setIcon(i)}
                                    className={`w-10 h-10 border-2 text-lg ${icon === i
                                            ? 'border-ink-black bg-focus-yellow'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-3 bg-gray-50 border-2 border-dashed border-gray-300">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Preview</p>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-5 h-5 border-2 border-ink-black"
                                style={{ backgroundColor: color }}
                            />
                            <span className="font-bold">
                                {icon && <span className="mr-1.5">{icon}</span>}
                                {name || 'List Name'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 font-bold border-3 border-ink-black bg-white hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <NeoButton
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? 'Saving...' : (list ? 'Update' : 'Create')}
                        </NeoButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
