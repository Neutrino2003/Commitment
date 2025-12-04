import React from 'react';
import { Commitment } from '@/lib/types';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoButton } from '@/components/ui/neo-button';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, DollarSign, Shield, Upload, Edit2, Trash2 } from 'lucide-react';

interface CommitmentCardProps {
    commitment: Commitment;
    onActivate?: (id: number) => void;
    onSubmitEvidence?: (id: number) => void;
    onComplete?: (id: number) => void;
    onFail?: (id: number) => void;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
}

export const CommitmentCard: React.FC<CommitmentCardProps> = ({
    commitment,
    onActivate,
    onSubmitEvidence,
    onComplete,
    onFail,
    onEdit,
    onDelete
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-500';
            case 'failed': return 'text-red-500';
            case 'completed': return 'text-blue-500';
            case 'under_review': return 'text-yellow-500';
            default: return 'text-gray-500';
        }
    };

    const getStakeIcon = (type: string) => {
        switch (type) {
            case 'money': return <DollarSign className="w-4 h-4" />;
            case 'social': return <Shield className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <NeoCard className="p-4 mb-4 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{commitment.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                            {commitment.due_date
                                ? format(new Date(commitment.due_date), 'PPP p')
                                : 'No deadline'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(commitment.status)} border-current`}>
                        {commitment.status.toUpperCase().replace('_', ' ')}
                    </div>
                    {onEdit && (
                        <button
                            onClick={() => onEdit(commitment.id)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit Commitment"
                        >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(commitment.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Commitment"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 my-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    {getStakeIcon(commitment.stake_type)}
                    <span className="capitalize">{commitment.stake_type} Stake</span>
                </div>
                {commitment.stake_amount && (
                    <div className="text-sm font-bold text-red-500">
                        {commitment.currency} {commitment.stake_amount}
                    </div>
                )}
            </div>

            {commitment.evidence_required && (
                <div className="text-xs text-gray-500 mb-4">
                    Evidence: <span className="font-medium text-gray-700">{commitment.evidence_type.replace('_', ' ')}</span>
                    {commitment.evidence_submitted && <span className="text-green-500 ml-2">(Submitted)</span>}
                </div>
            )}

            <div className="flex gap-2 mt-2">
                {commitment.status === 'draft' && onActivate && (
                    <NeoButton size="sm" variant="primary" onClick={() => onActivate(commitment.id)}>
                        Activate Contract
                    </NeoButton>
                )}

                {commitment.status === 'active' && !commitment.evidence_submitted && onSubmitEvidence && (
                    <NeoButton size="sm" variant="secondary" onClick={() => onSubmitEvidence(commitment.id)}>
                        <Upload className="w-3 h-3 mr-1" /> Submit Evidence
                    </NeoButton>
                )}

                {commitment.status === 'active' && commitment.evidence_type === 'self_verification' && onComplete && (
                    <NeoButton size="sm" variant="primary" onClick={() => onComplete(commitment.id)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Complete
                    </NeoButton>
                )}
            </div>
        </NeoCard>
    );
};
