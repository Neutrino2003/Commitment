import React from 'react';
import { CommitmentDashboardStats } from '@/lib/types';
import { NeoCard } from '@/components/ui/neo-card';
import { TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface CommitmentStatsProps {
    stats: CommitmentDashboardStats | null;
    isLoading: boolean;
}

export const CommitmentStats: React.FC<CommitmentStatsProps> = ({ stats, isLoading }) => {
    if (isLoading || !stats) {
        return <div className="animate-pulse h-24 bg-gray-200 rounded-xl mb-6"></div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <NeoCard className="p-4 flex flex-col items-center justify-center bg-blue-50 border-blue-100">
                <div className="text-blue-500 mb-1"><TrendingUp className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-gray-800">{stats.active_count}</div>
                <div className="text-xs text-gray-500 font-medium">Active Commitments</div>
            </NeoCard>

            <NeoCard className="p-4 flex flex-col items-center justify-center bg-red-50 border-red-100">
                <div className="text-red-500 mb-1"><DollarSign className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-gray-800">${stats.total_stakes_at_risk}</div>
                <div className="text-xs text-gray-500 font-medium">Money at Risk</div>
            </NeoCard>

            <NeoCard className="p-4 flex flex-col items-center justify-center bg-green-50 border-green-100">
                <div className="text-green-500 mb-1"><CheckCircle className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-gray-800">{stats.success_rate}%</div>
                <div className="text-xs text-gray-500 font-medium">Success Rate</div>
            </NeoCard>

            <NeoCard className="p-4 flex flex-col items-center justify-center bg-yellow-50 border-yellow-100">
                <div className="text-yellow-500 mb-1"><AlertTriangle className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-gray-800">{stats.pending_evidence_count}</div>
                <div className="text-xs text-gray-500 font-medium">Pending Evidence</div>
            </NeoCard>
        </div>
    );
};
