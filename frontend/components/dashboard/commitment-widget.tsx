'use client';

import React from 'react';
import { NeoCard } from '../ui/neo-card';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommitmentWidgetProps {
    commitments: any[];
}

export function CommitmentWidget({ commitments }: CommitmentWidgetProps) {
    const router = useRouter();
    const activeCommitments = commitments?.filter(c => c.status === 'active') || [];

    return (
        <NeoCard className="p-6 bg-white border-3 border-ink-black shadow-neo mb-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xl flex items-center gap-2">
                    <Shield className="w-6 h-6 text-focus-yellow" fill="currentColor" />
                    ACTIVE STAKES
                </h3>
                <button
                    onClick={() => router.push('/commitments')}
                    className="text-sm font-bold hover:underline"
                >
                    VIEW ALL
                </button>
            </div>

            {activeCommitments.length === 0 ? (
                <div className="text-center py-6 opacity-50">
                    <p className="font-bold">NO ACTIVE COMMITMENTS</p>
                    <p className="text-sm">Boost a task to get started!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeCommitments.slice(0, 3).map(commitment => (
                        <div
                            key={commitment.id}
                            onClick={() => router.push(`/commitments/${commitment.id}`)}
                            className="p-3 border-2 border-ink-black rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:translate-x-1"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold line-clamp-1">{commitment.title}</h4>
                                <span className={`text-xs font-black px-2 py-0.5 rounded border border-black ${commitment.stake_type === 'money' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {commitment.stake_type === 'money' ? `${commitment.currency} ${commitment.stake_amount}` : 'SOCIAL'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold opacity-60">
                                <AlertCircle size={12} />
                                <span>Due: {new Date(commitment.task.due_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </NeoCard>
    );
}
