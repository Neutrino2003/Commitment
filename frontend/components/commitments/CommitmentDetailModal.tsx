'use client';

import { useState, useEffect } from 'react';
import { Commitment } from '@/lib/types';
import { commitmentAttachmentsApi } from '@/lib/api';
import { NeoButton } from '@/components/ui/neo-button';
import CommitmentTimeline from './CommitmentTimeline';
import EvidenceUpload from './EvidenceUpload';
import {
    X,
    Calendar,
    DollarSign,
    Shield,
    Clock,
    FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Attachment {
    id: number;
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
    is_image: boolean;
    is_video?: boolean;
    attachment_type: 'evidence' | 'document' | 'other';
    description?: string;
    created_at: string;
    uploaded_by_username?: string;
}

interface CommitmentDetailModalProps {
    commitment: Commitment;
    onClose: () => void;
    onActivate?: (id: number) => void;
    onComplete?: (id: number) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-gray-200', text: 'text-gray-700' },
    active: { bg: 'bg-blue-500', text: 'text-white' },
    under_review: { bg: 'bg-yellow-500', text: 'text-white' },
    completed: { bg: 'bg-green-500', text: 'text-white' },
    failed: { bg: 'bg-red-500', text: 'text-white' },
    cancelled: { bg: 'bg-gray-500', text: 'text-white' },
    appealed: { bg: 'bg-orange-500', text: 'text-white' },
    paused: { bg: 'bg-purple-500', text: 'text-white' },
};

export default function CommitmentDetailModal({
    commitment,
    onClose,
    onActivate,
    onComplete
}: CommitmentDetailModalProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'evidence' | 'timeline'>('details');

    // Fetch attachments
    useEffect(() => {
        const fetchAttachments = async () => {
            try {
                const response = await commitmentAttachmentsApi.getForCommitment(commitment.id);
                setAttachments(response.data || []);
            } catch (error) {
                console.error('Failed to fetch attachments:', error);
            } finally {
                setIsLoadingAttachments(false);
            }
        };
        fetchAttachments();
    }, [commitment.id]);

    const handleAttachmentAdded = (attachment: Attachment) => {
        setAttachments(prev => [...prev, attachment]);
    };

    const handleAttachmentDeleted = (id: number) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const statusColors = STATUS_COLORS[commitment.status] || STATUS_COLORS.draft;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white border-3 border-ink-black shadow-neo w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-3 border-ink-black bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Shield size={24} />
                        <span className={`px-3 py-1 text-sm font-bold uppercase ${statusColors.bg} ${statusColors.text}`}>
                            {commitment.status}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-2 border-gray-200">
                    {['details', 'evidence', 'timeline'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                            className={`flex-1 py-3 font-bold capitalize transition-all ${activeTab === tab
                                    ? 'border-b-3 border-focus-yellow bg-focus-yellow/10'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Title */}
                            <h2 className="text-2xl font-black">{commitment.title}</h2>

                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Due Date */}
                                <div className="p-4 bg-gray-50 border-2 border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Calendar size={16} />
                                        <span className="text-sm font-medium">Due Date</span>
                                    </div>
                                    <div className="font-bold">
                                        {commitment.due_date
                                            ? new Date(commitment.due_date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })
                                            : 'No deadline'
                                        }
                                    </div>
                                    {commitment.is_overdue && (
                                        <span className="text-xs text-red-500 font-bold">OVERDUE</span>
                                    )}
                                </div>

                                {/* Stake */}
                                <div className="p-4 bg-gray-50 border-2 border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <DollarSign size={16} />
                                        <span className="text-sm font-medium">Stake</span>
                                    </div>
                                    <div className="font-bold">
                                        {commitment.stake_amount
                                            ? `${commitment.currency} ${commitment.stake_amount}`
                                            : 'No stake'
                                        }
                                    </div>
                                    <span className="text-xs text-gray-500 capitalize">{commitment.stake_type}</span>
                                </div>

                                {/* Leniency */}
                                <div className="p-4 bg-gray-50 border-2 border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Clock size={16} />
                                        <span className="text-sm font-medium">Leniency</span>
                                    </div>
                                    <div className="font-bold capitalize">{commitment.leniency}</div>
                                </div>

                                {/* Evidence Type */}
                                <div className="p-4 bg-gray-50 border-2 border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <FileText size={16} />
                                        <span className="text-sm font-medium">Evidence Required</span>
                                    </div>
                                    <div className="font-bold">
                                        {commitment.evidence_required
                                            ? commitment.evidence_type?.replace('_', ' ')
                                            : 'Not required'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Task Link */}
                            {commitment.task && (
                                <div className="p-4 bg-blue-50 border-2 border-blue-200">
                                    <div className="text-sm font-medium text-blue-600 mb-1">Linked Task</div>
                                    <div className="font-bold">{commitment.task.title}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'evidence' && (
                        <EvidenceUpload
                            commitmentId={commitment.id}
                            attachments={attachments}
                            onAttachmentAdded={handleAttachmentAdded}
                            onAttachmentDeleted={handleAttachmentDeleted}
                        />
                    )}

                    {activeTab === 'timeline' && (
                        <CommitmentTimeline commitment={commitment} />
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t-2 border-gray-200 bg-gray-50 flex gap-3 justify-end">
                    {commitment.status === 'draft' && onActivate && (
                        <NeoButton onClick={() => onActivate(commitment.id)}>
                            Activate Contract
                        </NeoButton>
                    )}
                    {commitment.status === 'active' && onComplete && (
                        <NeoButton onClick={() => onComplete(commitment.id)}>
                            Mark Complete
                        </NeoButton>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 font-bold border-2 border-ink-black hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
