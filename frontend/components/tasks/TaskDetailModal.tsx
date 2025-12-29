'use client';

import { useState, useEffect } from 'react';
import { Task, Tag, List } from '@/lib/types';
import { useTaskMutations } from '@/hooks/useTasks';
import { useLists } from '@/hooks/useLists';
import { useTags } from '@/hooks/useTags';
import { taskAttachmentsApi } from '@/lib/api';
import { NeoButton } from '@/components/ui/neo-button';
import FileUpload from '@/components/ui/FileUpload';
import AttachmentList from '@/components/ui/AttachmentList';
import TagPicker from './TagPicker';
import {
    X,
    Calendar,
    Flag,
    FolderOpen,
    Paperclip,
    GitMerge,
    Edit2,
    Save,
    Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Attachment {
    id: number;
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
    is_image: boolean;
    created_at: string;
    uploaded_by_username?: string;
}

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onUpdate?: (task: Task) => void;
    onDelete?: (id: number) => void;
}

const PRIORITY_CONFIG = {
    3: { label: 'High', color: '#FF6B6B', bg: 'bg-red-50' },
    2: { label: 'Medium', color: '#FFA500', bg: 'bg-orange-50' },
    1: { label: 'Low', color: '#4ECDC4', bg: 'bg-teal-50' },
    0: { label: 'None', color: '#95A5A6', bg: 'bg-gray-50' },
};

export default function TaskDetailModal({
    task,
    onClose,
    onUpdate,
    onDelete
}: TaskDetailModalProps) {
    const { updateTask } = useTaskMutations();
    const { data: lists } = useLists();
    const { data: tags } = useTags();

    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState({
        title: task.title,
        notes: task.notes || '',
        priority: task.priority,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        list: task.list || '',
        tags: task.tags || [],
    });

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch attachments
    useEffect(() => {
        const fetchAttachments = async () => {
            try {
                const response = await taskAttachmentsApi.getForTask(task.id);
                setAttachments(response.data || []);
            } catch (error) {
                console.error('Failed to fetch attachments:', error);
            } finally {
                setIsLoadingAttachments(false);
            }
        };
        fetchAttachments();
    }, [task.id]);

    const handleSave = async () => {
        try {
            await updateTask.mutateAsync({
                id: task.id,
                title: editedTask.title,
                notes: editedTask.notes,
                priority: editedTask.priority as 0 | 1 | 2 | 3,
                due_date: editedTask.due_date || null,
                list: editedTask.list ? Number(editedTask.list) : null,
                tag_ids: editedTask.tags.map(t => t.id),
            });
            toast.success('Task updated');
            setIsEditing(false);
            onUpdate?.({ ...task, ...editedTask });
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const response = await taskAttachmentsApi.upload(task.id, file);
            setAttachments(prev => [...prev, response.data]);
            toast.success('File uploaded');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!confirm('Delete this attachment?')) return;

        try {
            await taskAttachmentsApi.delete(attachmentId);
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
            toast.success('Attachment deleted');
        } catch (error) {
            toast.error('Failed to delete attachment');
        }
    };

    const currentList = lists?.find((l: List) => l.id === task.list);
    const priorityInfo = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white border-3 border-ink-black shadow-neo w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-4 border-b-3 border-ink-black"
                    style={{ borderLeftWidth: '6px', borderLeftColor: priorityInfo.color }}
                >
                    <div className="flex items-center gap-3">
                        <span
                            className="px-2 py-1 text-xs font-black text-white"
                            style={{ backgroundColor: priorityInfo.color }}
                        >
                            {priorityInfo.label.toUpperCase()}
                        </span>
                        {task.status === 'COMPLETED' && (
                            <span className="px-2 py-1 text-xs font-bold bg-green-500 text-white">
                                ✓ COMPLETED
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-2 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                                <NeoButton onClick={handleSave} size="sm">
                                    <Save size={16} className="mr-1" />
                                    Save
                                </NeoButton>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 hover:bg-gray-100 transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(task.id)}
                                        className="p-2 hover:bg-red-50 text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Title */}
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedTask.title}
                            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                            className="w-full text-2xl font-black border-2 border-ink-black px-3 py-2 focus:outline-none focus:border-focus-yellow"
                            placeholder="Task title"
                        />
                    ) : (
                        <h2 className={`text-2xl font-black ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                        </h2>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        {/* Due Date */}
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={editedTask.due_date}
                                    onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                                    className="px-2 py-1 border-2 border-ink-black font-medium"
                                />
                            ) : (
                                <span className="font-medium">
                                    {task.due_date
                                        ? new Date(task.due_date).toLocaleDateString('en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric'
                                        })
                                        : 'No due date'
                                    }
                                </span>
                            )}
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-2">
                            <Flag size={16} className="text-gray-400" />
                            {isEditing ? (
                                <select
                                    value={editedTask.priority}
                                    onChange={(e) => setEditedTask({ ...editedTask, priority: Number(e.target.value) })}
                                    className="px-2 py-1 border-2 border-ink-black font-medium"
                                >
                                    <option value={3}>High</option>
                                    <option value={2}>Medium</option>
                                    <option value={1}>Low</option>
                                    <option value={0}>None</option>
                                </select>
                            ) : (
                                <span
                                    className="font-medium px-2 py-0.5"
                                    style={{ backgroundColor: priorityInfo.color + '20', color: priorityInfo.color }}
                                >
                                    {priorityInfo.label} Priority
                                </span>
                            )}
                        </div>

                        {/* List */}
                        <div className="flex items-center gap-2">
                            <FolderOpen size={16} className="text-gray-400" />
                            {isEditing ? (
                                <select
                                    value={editedTask.list}
                                    onChange={(e) => setEditedTask({ ...editedTask, list: e.target.value })}
                                    className="px-2 py-1 border-2 border-ink-black font-medium"
                                >
                                    <option value="">No List</option>
                                    {lists?.map((list: List) => (
                                        <option key={list.id} value={list.id}>
                                            {list.icon} {list.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="font-medium" style={{ color: currentList?.color }}>
                                    {currentList?.icon} {currentList?.name || 'No List'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <h4 className="font-bold text-sm text-gray-500 mb-2 uppercase">Tags</h4>
                        {isEditing ? (
                            <TagPicker
                                selectedTags={editedTask.tags}
                                onTagsChange={(tags) => setEditedTask({ ...editedTask, tags })}
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {task.tags?.length > 0 ? (
                                    task.tags.map(tag => (
                                        <span
                                            key={tag.id}
                                            className="px-2 py-1 text-sm font-bold border-2 border-ink-black"
                                            style={{ backgroundColor: tag.color, color: 'white' }}
                                        >
                                            #{tag.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400">No tags</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <h4 className="font-bold text-sm text-gray-500 mb-2 uppercase">Notes</h4>
                        {isEditing ? (
                            <textarea
                                value={editedTask.notes}
                                onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-ink-black font-medium min-h-[100px] focus:outline-none focus:border-focus-yellow"
                                placeholder="Add notes..."
                            />
                        ) : (
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {task.notes || 'No notes'}
                            </p>
                        )}
                    </div>

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div>
                            <h4 className="font-bold text-sm text-gray-500 mb-2 uppercase flex items-center gap-2">
                                <GitMerge size={14} />
                                Subtasks ({task.subtasks.length})
                            </h4>
                            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                {task.subtasks.map(subtask => (
                                    <div
                                        key={subtask.id}
                                        className={`flex items-center gap-2 p-2 bg-gray-50 ${subtask.status === 'COMPLETED' ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <span className={`font-medium ${subtask.status === 'COMPLETED' ? 'line-through' : ''}`}>
                                            {subtask.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    <div>
                        <h4 className="font-bold text-sm text-gray-500 mb-2 uppercase flex items-center gap-2">
                            <Paperclip size={14} />
                            Attachments ({attachments.length})
                        </h4>

                        {isLoadingAttachments ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-12 bg-gray-100" />
                                <div className="h-12 bg-gray-100" />
                            </div>
                        ) : (
                            <>
                                <AttachmentList
                                    attachments={attachments}
                                    onDelete={handleDeleteAttachment}
                                    className="mb-4"
                                />

                                <FileUpload
                                    onUpload={handleUpload}
                                    label="Upload attachment"
                                    maxSize={10 * 1024 * 1024}
                                    disabled={isUploading}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t-2 border-gray-200 bg-gray-50 text-xs text-gray-500">
                    Created {new Date(task.created_at).toLocaleDateString()} •
                    Updated {new Date(task.updated_at).toLocaleDateString()}
                </div>
            </motion.div>
        </div>
    );
}
