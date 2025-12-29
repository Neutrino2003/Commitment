'use client';

import { Commitment } from '@/lib/types';
import {
    FileText,
    Play,
    Upload,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    PauseCircle
} from 'lucide-react';

interface CommitmentTimelineProps {
    commitment: Commitment;
    className?: string;
}

interface TimelineEvent {
    id: string;
    label: string;
    date: string | null;
    status: 'completed' | 'current' | 'pending' | 'failed';
    icon: React.ReactNode;
    description?: string;
}

const STATUS_ICON_MAP: Record<string, React.ReactNode> = {
    draft: <FileText size={16} />,
    active: <Play size={16} />,
    under_review: <Clock size={16} />,
    appealed: <AlertCircle size={16} />,
    paused: <PauseCircle size={16} />,
    completed: <CheckCircle size={16} />,
    failed: <XCircle size={16} />,
    cancelled: <XCircle size={16} />,
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    completed: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-600' },
    current: { bg: 'bg-focus-yellow', border: 'border-focus-yellow', text: 'text-yellow-600' },
    pending: { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-400' },
    failed: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600' },
};

function formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function CommitmentTimeline({ commitment, className = '' }: CommitmentTimelineProps) {
    // Build timeline events based on commitment data
    const buildTimeline = (): TimelineEvent[] => {
        const events: TimelineEvent[] = [];
        const status = commitment.status;

        // 1. Created/Draft
        events.push({
            id: 'created',
            label: 'Created',
            date: commitment.created_at,
            status: 'completed',
            icon: <FileText size={16} />,
            description: 'Commitment drafted'
        });

        // 2. Activated
        const isActivated = ['active', 'completed', 'failed', 'under_review', 'appealed', 'paused'].includes(status);
        events.push({
            id: 'activated',
            label: 'Activated',
            date: commitment.activated_at,
            status: isActivated ? 'completed' : (status === 'draft' ? 'current' : 'pending'),
            icon: <Play size={16} />,
            description: commitment.stake_amount ? `Stake: ${commitment.currency} ${commitment.stake_amount}` : 'No stake'
        });

        // 3. Evidence Submitted (if required)
        if (commitment.evidence_required) {
            events.push({
                id: 'evidence',
                label: 'Evidence Submitted',
                date: commitment.evidence_submitted_at,
                status: commitment.evidence_submitted ? 'completed' : (status === 'active' ? 'current' : 'pending'),
                icon: <Upload size={16} />,
                description: commitment.evidence_submitted ? 'Proof uploaded' : 'Awaiting evidence'
            });
        }

        // 4. Review (if applicable)
        if (['under_review', 'completed', 'failed', 'appealed'].includes(status)) {
            events.push({
                id: 'review',
                label: 'Under Review',
                date: null, // Would need review timestamp
                status: status === 'under_review' ? 'current' : 'completed',
                icon: <Clock size={16} />,
                description: 'Evidence being verified'
            });
        }

        // 5. Final status
        if (status === 'completed') {
            events.push({
                id: 'completed',
                label: 'Completed',
                date: commitment.completed_at,
                status: 'completed',
                icon: <CheckCircle size={16} />,
                description: 'Successfully completed! 🎉'
            });
        } else if (status === 'failed') {
            events.push({
                id: 'failed',
                label: 'Failed',
                date: commitment.completed_at,
                status: 'failed',
                icon: <XCircle size={16} />,
                description: 'Commitment not fulfilled'
            });
        } else if (status === 'cancelled') {
            events.push({
                id: 'cancelled',
                label: 'Cancelled',
                date: commitment.updated_at,
                status: 'failed',
                icon: <XCircle size={16} />,
                description: 'Cancelled by user'
            });
        }

        return events;
    };

    const timeline = buildTimeline();

    return (
        <div className={`${className}`}>
            <h4 className="font-bold text-sm text-gray-500 mb-4 uppercase">Timeline</h4>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Events */}
                <div className="space-y-6">
                    {timeline.map((event, index) => {
                        const colors = STATUS_COLORS[event.status];
                        const isLast = index === timeline.length - 1;

                        return (
                            <div key={event.id} className="relative flex items-start gap-4 pl-8">
                                {/* Icon Circle */}
                                <div
                                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${colors.bg} ${colors.border} text-white z-10`}
                                >
                                    {event.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center justify-between">
                                        <h5 className={`font-bold ${event.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                                            {event.label}
                                        </h5>
                                        <span className={`text-xs ${colors.text}`}>
                                            {formatDate(event.date)}
                                        </span>
                                    </div>
                                    {event.description && (
                                        <p className={`text-sm ${event.status === 'pending' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
