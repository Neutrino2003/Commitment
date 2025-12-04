import React, { useState } from 'react';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoButton } from '@/components/ui/neo-button';
import { Shield, DollarSign, AlertCircle, Upload } from 'lucide-react';

interface CommitmentFormProps {
    onSubmit: (data: any) => void;
    initialData?: any;
    isBoost?: boolean;
    taskTitle?: string;
    taskDueDate?: string;
}

export const CommitmentForm: React.FC<CommitmentFormProps> = ({ onSubmit, initialData, isBoost = false, taskTitle, taskDueDate }) => {
    // Default to tomorrow at 9 AM
    const getDefaultDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        // Format for datetime-local: YYYY-MM-DDThh:mm
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        const hh = String(tomorrow.getHours()).padStart(2, '0');
        const min = String(tomorrow.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };

    const [formData, setFormData] = useState({
        title: '',
        due_date: getDefaultDate(),
        stake_type: 'social',
        stake_amount: '',
        currency: 'INR',
        evidence_type: 'self_verification',
        leniency: 'normal',
        ...initialData
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <NeoCard className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-focus-yellow" />
                {isBoost ? 'Boost Task with Commitment' : 'Create New Commitment'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {isBoost ? (
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-sm font-bold text-gray-500 uppercase mb-1">BOOSTING TASK</p>
                        <h3 className="text-xl font-black mb-2">{taskTitle || 'Loading task...'}</h3>
                        {taskDueDate && (
                            <p className="font-bold opacity-70">Due: {new Date(taskDueDate).toLocaleString()}</p>
                        )}
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-bold mb-2">I commit to...</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all"
                                placeholder="e.g. Run 5km every morning"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">By when?</label>
                            <input
                                type="datetime-local"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all"
                                required
                            />
                        </div>
                    </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Stakes</label>
                        <div className="flex gap-2 mb-2">
                            {['social', 'money'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData((prev: any) => ({ ...prev, stake_type: type }))}
                                    className={`flex-1 p-2 rounded-lg border-2 border-black font-bold text-sm transition-all ${formData.stake_type === type
                                        ? 'bg-black text-white'
                                        : 'bg-white hover:bg-gray-100'
                                        }`}
                                >
                                    {type === 'social' ? 'Social' : 'Money'}
                                </button>
                            ))}
                        </div>

                        {formData.stake_type === 'money' && (
                            <div className="flex gap-2">
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    className="p-2 border-2 border-black rounded-lg font-bold"
                                >
                                    <option value="INR">₹</option>
                                    <option value="USD">$</option>
                                    <option value="EUR">€</option>
                                </select>
                                <input
                                    type="number"
                                    name="stake_amount"
                                    value={formData.stake_amount}
                                    onChange={handleChange}
                                    className="flex-1 p-2 border-2 border-black rounded-lg"
                                    placeholder="Amount"
                                    min="1"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Verification</label>
                        <select
                            name="evidence_type"
                            value={formData.evidence_type}
                            onChange={handleChange}
                            className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A]"
                        >
                            <option value="self_verification">Self Verification (Honor System)</option>
                            <option value="photo">Photo Upload</option>
                            <option value="timelapse_video">Timelapse Video</option>
                            <option value="manual">Manual Review</option>
                        </select>
                    </div>
                </div>

                <NeoButton type="submit" size="lg" className="w-full">
                    {isBoost ? 'Boost Task' : 'Create Commitment'}
                </NeoButton>
            </form>
        </NeoCard>
    );
};
