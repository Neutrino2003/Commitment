'use client';

import { useState, useRef, useEffect } from 'react';
import { useTags, useTagMutations } from '@/hooks/useTags';
import { Tag } from '@/lib/types';
import { X, Plus, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TagPickerProps {
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    className?: string;
}

const PRESET_COLORS = [
    '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF',
    '#9B59B6', '#E91E63', '#00BCD4', '#795548', '#607D8B'
];

export default function TagPicker({
    selectedTags,
    onTagsChange,
    className = ''
}: TagPickerProps) {
    const { data: tags, isLoading } = useTags();
    const { createTag } = useTagMutations();
    const [isOpen, setIsOpen] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
    const [showNewTagForm, setShowNewTagForm] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowNewTagForm(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isSelected = (tag: Tag) => {
        return selectedTags.some(t => t.id === tag.id);
    };

    const toggleTag = (tag: Tag) => {
        if (isSelected(tag)) {
            onTagsChange(selectedTags.filter(t => t.id !== tag.id));
        } else {
            onTagsChange([...selectedTags, tag]);
        }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        try {
            const newTag = await createTag.mutateAsync({
                name: newTagName.trim(),
                color: newTagColor
            });
            onTagsChange([...selectedTags, newTag]);
            setNewTagName('');
            setShowNewTagForm(false);
            toast.success('Tag created');
        } catch (error) {
            toast.error('Failed to create tag');
        }
    };

    const removeTag = (tag: Tag) => {
        onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Selected Tags Display */}
            <div
                onClick={() => setIsOpen(true)}
                className="min-h-[44px] px-3 py-2 border-3 border-ink-black bg-white cursor-pointer flex flex-wrap gap-2 items-center"
            >
                {selectedTags.length > 0 ? (
                    selectedTags.map(tag => (
                        <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm font-bold border-2 border-ink-black"
                            style={{ backgroundColor: tag.color, color: getContrastColor(tag.color) }}
                        >
                            #{tag.name}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTag(tag);
                                }}
                                className="hover:opacity-70"
                            >
                                <X size={12} strokeWidth={3} />
                            </button>
                        </span>
                    ))
                ) : (
                    <span className="text-gray-400 font-medium">Click to add tags...</span>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-3 border-ink-black shadow-neo max-h-64 overflow-y-auto">
                    {/* Existing Tags */}
                    {isLoading ? (
                        <div className="p-3 text-center text-gray-500">Loading...</div>
                    ) : (
                        <>
                            {tags?.map((tag: Tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="w-4 h-4 border-2 border-ink-black"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="font-medium">#{tag.name}</span>
                                    </span>
                                    {isSelected(tag) && (
                                        <Check size={16} strokeWidth={3} className="text-green-600" />
                                    )}
                                </button>
                            ))}

                            {tags?.length === 0 && !showNewTagForm && (
                                <div className="p-3 text-center text-gray-500 text-sm">
                                    No tags yet
                                </div>
                            )}
                        </>
                    )}

                    {/* Create New Tag */}
                    <div className="border-t-2 border-gray-200">
                        {showNewTagForm ? (
                            <form onSubmit={handleCreateTag} className="p-3 space-y-3">
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="Tag name"
                                    className="w-full px-3 py-2 border-2 border-ink-black font-medium text-sm"
                                    autoFocus
                                />
                                <div className="flex gap-1 flex-wrap">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewTagColor(c)}
                                            className={`w-6 h-6 border-2 ${newTagColor === c ? 'border-ink-black scale-110' : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewTagForm(false)}
                                        className="flex-1 px-3 py-2 text-sm font-bold border-2 border-ink-black hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newTagName.trim()}
                                        className="flex-1 px-3 py-2 text-sm font-bold bg-focus-yellow border-2 border-ink-black disabled:opacity-50"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setShowNewTagForm(true)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                            >
                                <Plus size={16} />
                                Create new tag
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to determine text color based on background
function getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
