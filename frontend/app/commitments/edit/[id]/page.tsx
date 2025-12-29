'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';
import { CommitmentForm } from '@/components/commitments/CommitmentForm';
import { useCommitmentMutations } from '@/hooks/useCommitments';
import { commitmentsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { NeoCard } from '@/components/ui/neo-card';

export default function EditCommitmentPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { updateCommitment } = useCommitmentMutations();
    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCommitment = async () => {
            try {
                const { data } = await commitmentsApi.get(Number(params.id));
                // Transform data if necessary to match form structure
                // For now, assuming API response matches form expectations
                setInitialData({
                    ...data,
                    // Ensure date is in correct format for datetime-local input if needed
                    // But CommitmentForm might handle string dates. 
                    // Let's check if we need to format it.
                    due_date: data.due_date ? data.due_date.slice(0, 16) : '',
                });
            } catch (error) {
                console.error('Failed to fetch commitment:', error);
                toast.error('Failed to load commitment details');
                router.push('/commitments');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchCommitment();
        }
    }, [params.id, router]);

    const handleSubmit = (data: any) => {
        updateCommitment.mutate({ id: Number(params.id), ...data }, {
            onSuccess: () => {
                toast.success('Commitment updated successfully!');
                router.push('/commitments');
            },
            onError: (error: any) => {
                console.error('Failed to update commitment:', error);
                toast.error('Failed to update commitment');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-black text-2xl animate-pulse">
                LOADING COMMITMENT...
            </div>
        );
    }

    return (
        <AuthCheck>
            <Layout>
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-4xl font-black mb-8">EDIT <span className="text-focus-yellow">COMMITMENT</span></h1>

                    <NeoCard>
                        <CommitmentForm
                            onSubmit={handleSubmit}
                            initialData={initialData}
                        />
                    </NeoCard>
                </div>
            </Layout>
        </AuthCheck>
    );
}
