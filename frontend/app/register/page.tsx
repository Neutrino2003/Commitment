'use client';

import React, { useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard } from '@/components/ui/neo-card';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // 1. Register
            await authApi.register({
                username,
                email,
                password,
                password2: confirmPassword
            });

            // 2. Auto-login
            const loginResponse = await authApi.login(username, password);

            // Store tokens
            authApi.setTokens(loginResponse.data.access, loginResponse.data.refresh);

            // Redirect
            router.push('/');
        } catch (err: any) {
            console.error(err);
            const errorData = err.response?.data;
            if (typeof errorData === 'object') {
                // Extract first error message
                const firstError = Object.values(errorData)[0];
                setError(Array.isArray(firstError) ? firstError[0] : 'Registration failed');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dot-grid flex items-center justify-center p-4">
            <NeoCard className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black mb-2">JOIN <span className="text-focus-yellow">NOW</span></h1>
                    <p className="text-lg font-bold opacity-70">Start Crushing Tasks</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block font-bold mb-1">USERNAME</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                            placeholder="johndoe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-bold mb-1">EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-bold mb-1">PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                            placeholder="••••••"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-bold mb-1">CONFIRM PASSWORD</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow font-medium"
                            placeholder="••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 border-3 border-accent-pink bg-pink-50 text-accent-pink font-bold text-sm">
                            {error}
                        </div>
                    )}

                    <NeoButton
                        type="submit"
                        className="w-full mt-4"
                        size="lg"
                        disabled={loading}
                    >
                        {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                    </NeoButton>

                    <div className="text-center mt-4">
                        <Link href="/login" className="font-bold hover:text-focus-yellow underline decoration-2 underline-offset-4">
                            ALREADY HAVE AN ACCOUNT? LOGIN
                        </Link>
                    </div>
                </form>
            </NeoCard>
        </div>
    );
}
