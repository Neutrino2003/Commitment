"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">Commitment</div>
          <div className="space-x-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Achieve Your Goals with
            <span className="text-indigo-600"> Financial Commitment</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create commitment contracts with real financial stakes. Stay
            accountable, track your progress, and achieve your personal goals.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg"
          >
            Get Started Free
          </button>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Financial Stakes</h3>
            <p className="text-gray-600">
              Put money on the line to stay motivated. Real consequences drive
              real results.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Monitor your commitments with detailed statistics and evidence
              submission.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-bold mb-2">Recurring Habits</h3>
            <p className="text-gray-600">
              Create daily, weekly, or monthly commitments to build lasting
              habits.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-bold mb-2">Create Commitment</h4>
              <p className="text-gray-600 text-sm">
                Define your goal and set a financial stake
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-bold mb-2">Set Deadline</h4>
              <p className="text-gray-600 text-sm">
                Choose your timeframe and frequency
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-bold mb-2">Submit Evidence</h4>
              <p className="text-gray-600 text-sm">
                Provide proof of completion before deadline
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-bold mb-2">Win or Lose</h4>
              <p className="text-gray-600 text-sm">
                Complete on time or lose your stake
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-20 py-8 border-t">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>© 2025 Commitment App. Stay accountable, achieve more.</p>
        </div>
      </footer>
    </div>
  );
}
