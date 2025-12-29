'use client';

import { useState } from 'react';
import { useLists, useListMutations } from '@/hooks/useLists';
import { List } from '@/lib/types';
import { Plus, Edit2, Trash2, MoreVertical, FolderOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ListForm from './ListForm';

interface ListSidebarProps {
    selectedListId: number | null;
    onSelectList: (listId: number | null) => void;
    className?: string;
}

export default function ListSidebar({
    selectedListId,
    onSelectList,
    className = ''
}: ListSidebarProps) {
    const { data: lists, isLoading } = useLists();
    const { deleteList } = useListMutations();
    const [showForm, setShowForm] = useState(false);
    const [editingList, setEditingList] = useState<List | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    const handleEdit = (list: List) => {
        setEditingList(list);
        setShowForm(true);
        setMenuOpenId(null);
    };

    const handleDelete = (list: List) => {
        if (confirm(`Delete "${list.name}"? Tasks will be moved to no list.`)) {
            deleteList.mutate(list.id, {
                onSuccess: () => {
                    toast.success('List deleted');
                    if (selectedListId === list.id) {
                        onSelectList(null);
                    }
                },
                onError: () => toast.error('Failed to delete list'),
            });
        }
        setMenuOpenId(null);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingList(null);
    };

    const handleFormSuccess = () => {
        handleFormClose();
        toast.success(editingList ? 'List updated' : 'List created');
    };

    return (
        <div className={`bg-white border-3 border-ink-black p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg uppercase">Lists</h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="p-1.5 bg-focus-yellow border-2 border-ink-black hover:shadow-neo-sm transition-all"
                    title="New List"
                >
                    <Plus size={16} strokeWidth={3} />
                </button>
            </div>

            {/* All Tasks Option */}
            <button
                onClick={() => onSelectList(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-2 font-bold border-2 border-ink-black transition-all ${selectedListId === null
                        ? 'bg-focus-yellow shadow-neo-sm'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
            >
                <FolderOpen size={18} strokeWidth={2.5} />
                <span>All Tasks</span>
            </button>

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-gray-100 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Lists */}
            <div className="space-y-1">
                {lists?.map((list: List) => (
                    <div key={list.id} className="relative group">
                        <button
                            onClick={() => onSelectList(list.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 font-bold border-2 border-ink-black transition-all ${selectedListId === list.id
                                    ? 'bg-focus-yellow shadow-neo-sm'
                                    : 'bg-white hover:bg-gray-50'
                                }`}
                        >
                            {/* Color Indicator */}
                            <div
                                className="w-4 h-4 border-2 border-ink-black flex-shrink-0"
                                style={{ backgroundColor: list.color }}
                            />

                            {/* Icon & Name */}
                            <span className="flex-1 text-left truncate">
                                {list.icon && <span className="mr-1.5">{list.icon}</span>}
                                {list.name}
                            </span>
                        </button>

                        {/* Actions Menu */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === list.id ? null : list.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {menuOpenId === list.id && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 z-10 bg-white border-2 border-ink-black shadow-neo-sm"
                                >
                                    <button
                                        onClick={() => handleEdit(list)}
                                        className="flex items-center gap-2 w-full px-3 py-2 font-medium hover:bg-gray-100 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(list)}
                                        className="flex items-center gap-2 w-full px-3 py-2 font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {!isLoading && lists?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                    No lists yet. Create one!
                </p>
            )}

            {/* List Form Modal */}
            {showForm && (
                <ListForm
                    list={editingList}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}
