'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard } from '@/components/ui/neo-card';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { authApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for OAuth errors in URL params
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(`Google sign-in failed: ${errorParam}`);
        }
    }, [searchParams]);

    // Redirect if already authenticated
    useEffect(() => {
        if (authApi.isAuthenticated()) {
            router.push('/');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authApi.login(username, password);

            // Store JWT tokens
            authApi.setTokens(response.data.access, response.data.refresh);

            // Redirect to dashboard
            router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = (errorMessage: string) => {
        setError(errorMessage);
    };

    return (
        <NeoCard className="w-full max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black mb-2">TICKTICK<span className="text-focus-yellow">CLONE</span></h1>
                <p className="text-lg font-bold opacity-70">Anti-Procrastination Tool</p>
            </div>

            {/* Google Sign-in */}
            <div className="mb-6">
                <GoogleSignInButton onError={handleGoogleError} />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">OR</span>
                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block font-bold mb-2">USERNAME</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow text-lg font-medium"
                        placeholder="demo"
                        required
                    />
                </div>

                <div>
                    <label className="block font-bold mb-2">PASSWORD</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 neo-border bg-white focus:outline-none focus:border-focus-yellow text-lg font-medium"
                        placeholder="••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="p-4 border-3 border-accent-pink bg-pink-50 text-accent-pink font-bold">
                        {error}
                    </div>
                )}

                <NeoButton
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                >
                    {loading ? 'LOGGING IN...' : 'LOGIN'}
                </NeoButton>

                <div className="text-center text-sm font-medium opacity-60">
                    Demo: <span className="font-bold">demo</span> / <span className="font-bold">demo123</span>
                </div>

                <div className="text-center">
                    <Link href="/register" className="font-bold hover:text-focus-yellow underline decoration-2 underline-offset-4">
                        NEED AN ACCOUNT? SIGN UP
                    </Link>
                </div>
            </form>
        </NeoCard>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-dot-grid flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-center font-bold">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
