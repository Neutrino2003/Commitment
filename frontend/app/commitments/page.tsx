'use client';

import React, { useEffect, useState } from 'react';
import { commitmentsApi } from '@/lib/api';
import { Commitment, CommitmentDashboardStats } from '@/lib/types';
import { CommitmentCard } from '@/components/commitments/CommitmentCard';
import { CommitmentStats } from '@/components/commitments/CommitmentStats';
import { NeoButton } from '@/components/ui/neo-button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { useCommitments, useCommitmentMutations } from '@/hooks/useCommitments';

import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';

export default function CommitmentsPage() {
    const router = useRouter();
    const { data: commitmentsData, isLoading: isLoadingCommitments } = useCommitments();
    const { deleteCommitment } = useCommitmentMutations();

    // We still need stats, maybe fetch them separately or add a hook. 
    // For now, let's keep the manual fetch for stats but use the hook for commitments.
    const [stats, setStats] = useState<CommitmentDashboardStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [filter, setFilter] = useState<'active' | 'completed' | 'failed'>('active');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await commitmentsApi.getDashboard();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setIsLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const handleActivate = async (id: number) => {
        try {
            await commitmentsApi.activate(id);
            toast.success('Contract Activated!');
            // Invalidate queries would be better, but we can just let the hook handle refetch if we invalidate
            // We need to invalidate 'commitments' query.
            // useCommitmentMutations should expose queryClient or we can use useQueryClient here.
            // Actually, handleActivate is not using mutation hook yet. 
            // Let's just reload the page or use queryClient.invalidateQueries if we import it.
            // For now, let's just rely on the fact that if we used mutations it would be auto.
            // But handleActivate is manual api call.
            // We should probably add activate/complete to mutations too.
            window.location.reload(); // Quick fix for now or convert to mutations
        } catch (error) {
            toast.error('Failed to activate contract');
        }
    };

    const handleComplete = async (id: number) => {
        try {
            await commitmentsApi.complete(id);
            toast.success('Contract Completed! Well done!');
            window.location.reload();
        } catch (error) {
            toast.error('Failed to complete contract');
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this commitment?')) {
            deleteCommitment.mutate(id, {
                onSuccess: () => toast.success('Commitment deleted'),
                onError: () => toast.error('Failed to delete commitment'),
            });
        }
    };

    const commitments = commitmentsData || [];
    const isLoading = isLoadingCommitments || isLoadingStats;

    const filteredCommitments = commitments.filter((c: Commitment) => {
        if (filter === 'active') return ['active', 'draft', 'under_review', 'appealed'].includes(c.status);
        return c.status === filter;
    });

    return (
        <AuthCheck>
            <Layout>
                <div className="container mx-auto p-6 max-w-5xl space-y-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-black mb-2">Commitments</h1>
                            <p className="text-gray-600">Put your money where your mouth is.</p>
                        </div>
                        <Link href="/commitments/new">
                            <NeoButton size="lg">
                                <Plus className="w-5 h-5 mr-2" /> New Contract
                            </NeoButton>
                        </Link>
                    </div>

                    <CommitmentStats stats={stats} isLoading={isLoading} />

                    <div className="flex gap-4 mb-6 border-b-2 border-gray-100 pb-1">
                        {['active', 'completed', 'failed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab as any)}
                                className={`pb-3 px-2 font-bold capitalize transition-all ${filter === tab
                                    ? 'text-black border-b-4 border-focus-yellow'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredCommitments.length > 0 ? (
                        <div className="space-y-4">
                            {filteredCommitments.map((commitment: Commitment) => (
                                <CommitmentCard
                                    key={commitment.id}
                                    commitment={commitment}
                                    onActivate={handleActivate}
                                    onComplete={handleComplete}
                                    onSubmitEvidence={() => toast('Evidence submission modal coming soon!')}
                                    onEdit={(id) => router.push(`/commitments/edit/${id}`)}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 font-medium">No {filter} commitments found.</p>
                        </div>
                    )}
                </div>
            </Layout>
        </AuthCheck>
    );
}
