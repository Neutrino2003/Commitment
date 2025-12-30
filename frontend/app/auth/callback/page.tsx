'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const handleCallback = async () => {
            // Get tokens from query params
            const accessToken = searchParams.get('access');
            const refreshToken = searchParams.get('refresh');
            const errorParam = searchParams.get('error');
            const errorMessage = searchParams.get('message');

            if (errorParam) {
                setStatus('error');
                setError(errorMessage || errorParam || 'Authentication failed');
                return;
            }

            if (accessToken && refreshToken) {
                // Store tokens
                authApi.setTokens(accessToken, refreshToken);
                setStatus('success');

                // Redirect to dashboard after a brief delay
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            } else {
                setStatus('error');
                setError('No authentication tokens received');
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            {status === 'loading' && (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Completing sign in...
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Please wait while we finish setting up your account.
                    </p>
                </div>
            )}

            {status === 'success' && (
                <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-6 h-6 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Successfully signed in!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Redirecting to your dashboard...
                    </p>
                </div>
            )}

            {status === 'error' && (
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-6 h-6 text-red-600 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Sign in failed
                    </h2>
                    <p className="text-red-600 dark:text-red-400 mt-2">
                        {error}
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Suspense fallback={
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            }>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}
