'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CommitmentForm } from '@/components/commitments/CommitmentForm';
import { commitmentsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCommitmentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskId = searchParams.get('task_id');

    const [taskDetails, setTaskDetails] = React.useState<any>(null);

    React.useEffect(() => {
        if (taskId) {
            // Fetch task details
            // We can use the tasksApi from lib/api if available, or just fetch directly
            // Assuming tasksApi.get(id) exists or similar
            const fetchTask = async () => {
                try {
                    // Import dynamically to avoid circular deps if any, or just use api instance
                    const { default: api } = await import('@/lib/api');
                    const response = await api.get(`/tasks/${taskId}/`);
                    setTaskDetails(response.data);
                } catch (error) {
                    console.error('Failed to fetch task details:', error);
                    toast.error('Failed to load task details');
                }
            };
            fetchTask();
        }
    }, [taskId]);

    const handleSubmit = async (data: any) => {
        try {
            let payload;

            if (taskId) {
                // Boosting existing task
                payload = {
                    task_id: parseInt(taskId),
                    stake_type: data.stake_type,
                    stake_amount: data.stake_amount,
                    currency: data.currency,
                    evidence_type: data.evidence_type,
                    leniency: data.leniency
                };
            } else {
                // Direct creation
                payload = {
                    task_data: {
                        title: data.title,
                        due_date: data.due_date,
                        notes: `Commitment: ${data.stake_type} stake`
                    },
                    stake_type: data.stake_type,
                    stake_amount: data.stake_amount,
                    currency: data.currency,
                    evidence_type: data.evidence_type,
                    leniency: data.leniency
                };
            }

            await commitmentsApi.create(payload);
            toast.success('Commitment Created!');
            router.push('/commitments');
        } catch (error) {
            console.error('Failed to create commitment:', error);
            toast.error('Failed to create commitment');
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <Link href="/commitments" className="inline-flex items-center text-gray-500 hover:text-black mb-6 font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>

            <CommitmentForm
                onSubmit={handleSubmit}
                isBoost={!!taskId}
                taskTitle={taskDetails?.title}
                taskDueDate={taskDetails?.due_date}
            />
        </div>
    );
}
