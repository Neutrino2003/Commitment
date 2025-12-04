import React from 'react';
import { NeoCard } from '@/components/ui/neo-card';
import { Calendar as CalendarIcon, List as ListIcon, MoreVertical, Edit2, Trash2, GitMerge, Shield } from 'lucide-react';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
    task: Task;
    onComplete: (id: number) => void;
    onEdit?: (task: Task) => void;
    onDelete?: (id: number) => void;
    onAddSubtask?: (task: Task) => void;
    onBoost?: (task: Task) => void;
    listName?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onEdit, onDelete, onAddSubtask, onBoost, listName }) => {
    const priorityColors = {
        3: '#FF6B6B', // High
        2: '#FFA500', // Medium
        1: '#4ECDC4', // Low
        0: '#95A5A6', // None
    };

    const priorityLabels = {
        3: 'HIGH',
        2: 'MEDIUM',
        1: 'LOW',
        0: 'NONE',
    };

    return (
        <NeoCard
            className={cn(
                "group transition-all hover:translate-x-1 hover:-translate-y-1 relative overflow-hidden",
                task.status === 'COMPLETED' && "opacity-60 grayscale"
            )}
            style={{ borderLeft: `6px solid ${priorityColors[task.priority as keyof typeof priorityColors]}` }}
        >
            <div className="flex items-start gap-4">
                {/* ... existing checkbox ... */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onComplete(task.id);
                    }}
                    className={cn(
                        "mt-1 w-6 h-6 border-2 border-ink-black flex items-center justify-center transition-colors rounded-md",
                        task.status === 'COMPLETED' ? "bg-ink-black" : "hover:bg-gray-100"
                    )}
                >
                    {task.status === 'COMPLETED' && <span className="text-white font-black text-xs">✓</span>}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={cn(
                            "text-lg font-black truncate",
                            task.status === 'COMPLETED' && "line-through"
                        )}>
                            {task.title}
                        </h3>
                        {/* ... existing badges ... */}
                        {task.is_recurring && (
                            <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded font-bold border border-black">
                                🔄 RECURRING
                            </span>
                        )}
                        {task.tags.map(tag => (
                            <span
                                key={tag.id}
                                className="text-[10px] font-bold px-1.5 py-0.5 border border-ink-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                style={{ backgroundColor: tag.color, color: 'white' }}
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>

                    {/* ... existing notes ... */}
                    {task.notes && (
                        <p className="text-sm opacity-70 line-clamp-2 mb-2 font-medium">
                            {task.notes}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-bold opacity-60">
                        {/* ... existing meta ... */}
                        {task.due_date && (
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border border-black/10">
                                <CalendarIcon size={12} />
                                {new Date(task.due_date).toLocaleDateString()}
                            </span>
                        )}
                        {listName && (
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border border-black/10">
                                <ListIcon size={12} />
                                {listName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions / Priority */}
                <div className="flex flex-col items-end gap-2">
                    <div
                        className="px-2 py-1 border-2 border-ink-black text-[10px] font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        style={{ backgroundColor: priorityColors[task.priority as keyof typeof priorityColors] }}
                    >
                        {priorityLabels[task.priority as keyof typeof priorityLabels]}
                    </div>

                    {/* Edit/Delete/Subtask buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onBoost && (
                            <button
                                onClick={() => onBoost(task)}
                                className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-black transition-all"
                                title="Boost Task"
                            >
                                <Shield size={14} />
                            </button>
                        )}
                        {onAddSubtask && (
                            <button
                                onClick={() => onAddSubtask(task)}
                                className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-black transition-all"
                                title="Add Subtask"
                            >
                                <GitMerge size={14} />
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={() => onEdit(task)}
                                className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-black transition-all"
                                title="Edit"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(task.id)}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-500 transition-all"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </NeoCard>
    );
};
