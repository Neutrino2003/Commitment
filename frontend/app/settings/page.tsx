'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';
import { useLists, useListMutations } from '@/hooks/useLists';
import { useTags, useTagMutations } from '@/hooks/useTags';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard } from '@/components/ui/neo-card';

export default function SettingsPage() {
    const { data: lists } = useLists();
    const { data: tags } = useTags();
    const { createList, updateList, deleteList } = useListMutations();
    const { createTag, updateTag, deleteTag } = useTagMutations();

    const [showListForm, setShowListForm] = useState(false);
    const [showTagForm, setShowTagForm] = useState(false);
    const [newList, setNewList] = useState({ name: '', color: '#1E90FF', icon: '📋' });
    const [newTag, setNewTag] = useState({ name: '', color: '#808080' });

    const handleCreateList = (e: React.FormEvent) => {
        e.preventDefault();
        createList.mutate(newList, {
            onSuccess: () => {
                setShowListForm(false);
                setNewList({ name: '', color: '#1E90FF', icon: '📋' });
            },
        });
    };

    const handleCreateTag = (e: React.FormEvent) => {
        e.preventDefault();
        createTag.mutate(newTag, {
            onSuccess: () => {
                setShowTagForm(false);
                setNewTag({ name: '', color: '#808080' });
            },
        });
    };

    return (
        <AuthCheck>
            <Layout>
                <div className="space-y-8">
                    <h1 className="text-4xl font-black">
                        SETTINGS <span className="text-focus-yellow">& ORGANIZATION</span>
                    </h1>

                    {/* Lists Section */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-black">LISTS</h2>
                            <NeoButton onClick={() => setShowListForm(!showListForm)} size="sm">
                                {showListForm ? 'CANCEL' : '+ NEW LIST'}
                            </NeoButton>
                        </div>

                        {showListForm && (
                            <NeoCard className="mb-4">
                                <form onSubmit={handleCreateList} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block font-bold mb-2">LIST NAME</label>
                                            <input
                                                type="text"
                                                value={newList.name}
                                                onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                                                className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow text-lg font-medium"
                                                placeholder="Work, Personal, Shopping..."
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">ICON</label>
                                            <input
                                                type="text"
                                                value={newList.icon}
                                                onChange={(e) => setNewList({ ...newList, icon: e.target.value })}
                                                className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow text-lg font-medium text-center"
                                                placeholder="📋"
                                                maxLength={2}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-2">COLOR</label>
                                        <input
                                            type="color"
                                            value={newList.color}
                                            onChange={(e) => setNewList({ ...newList, color: e.target.value })}
                                            className="w-full h-12 neo-border cursor-pointer"
                                        />
                                    </div>
                                    <NeoButton type="submit" className="w-full">
                                        CREATE LIST
                                    </NeoButton>
                                </form>
                            </NeoCard>
                        )}

                        <div className="space-y-3">
                            {lists?.map((list) => (
                                <NeoCard
                                    key={list.id}
                                    className="flex items-center justify-between"
                                    style={{
                                        borderLeftWidth: '6px',
                                        borderLeftColor: list.color,
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{list.icon}</div>
                                        <div>
                                            <h3 className="text-lg font-black">{list.name}</h3>
                                            <p className="text-sm opacity-70">
                                                Color: <span style={{ color: list.color }}>{list.color}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete list "${list.name}"?`)) {
                                                deleteList.mutate(list.id);
                                            }
                                        }}
                                        className="px-4 py-2 neo-border bg-accent-pink text-white font-bold hover:bg-red-600"
                                    >
                                        DELETE
                                    </button>
                                </NeoCard>
                            ))}
                            {lists?.length === 0 && !showListForm && (
                                <div className="text-center py-8 opacity-50">
                                    <p className="font-bold">No lists yet. Create one to organize your tasks!</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Tags Section */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-black">TAGS</h2>
                            <NeoButton onClick={() => setShowTagForm(!showTagForm)} size="sm">
                                {showTagForm ? 'CANCEL' : '+ NEW TAG'}
                            </NeoButton>
                        </div>

                        {showTagForm && (
                            <NeoCard className="mb-4">
                                <form onSubmit={handleCreateTag} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-bold mb-2">TAG NAME</label>
                                            <input
                                                type="text"
                                                value={newTag.name}
                                                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                                                className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow text-lg font-medium"
                                                placeholder="urgent, meeting, important..."
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">COLOR</label>
                                            <input
                                                type="color"
                                                value={newTag.color}
                                                onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                                                className="w-full h-12 neo-border cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <NeoButton type="submit" className="w-full">
                                        CREATE TAG
                                    </NeoButton>
                                </form>
                            </NeoCard>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {tags?.map((tag) => (
                                <div
                                    key={tag.id}
                                    className="inline-flex items-center gap-2 px-4 py-2 neo-border font-bold"
                                    style={{
                                        backgroundColor: tag.color,
                                        color: 'white',
                                    }}
                                >
                                    <span>#{tag.name}</span>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete tag "#${tag.name}"?`)) {
                                                deleteTag.mutate(tag.id);
                                            }
                                        }}
                                        className="text-white hover:text-red-200 font-black"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {tags?.length === 0 && !showTagForm && (
                                <div className="text-center py-8 opacity-50 w-full">
                                    <p className="font-bold">No tags yet. Create some to label your tasks!</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Profile Section */}
                    <section>
                        <h2 className="text-2xl font-black mb-4">PROFILE</h2>
                        <NeoCard>
                            <div className="space-y-4">
                                <div>
                                    <p className="font-bold mb-1">USERNAME</p>
                                    <p className="text-lg opacity-70">
                                        {typeof window !== 'undefined' && localStorage.getItem('username') || 'User'}
                                    </p>
                                </div>
                                <NeoButton
                                    onClick={() => {
                                        if (confirm('Logout?')) {
                                            localStorage.clear();
                                            window.location.href = '/login';
                                        }
                                    }}
                                    className="bg-accent-pink text-white"
                                >
                                    LOGOUT
                                </NeoButton>
                            </div>
                        </NeoCard>
                    </section>
                </div>
            </Layout>
        </AuthCheck>
    );
}
