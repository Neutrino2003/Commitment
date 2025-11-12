"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI, contractsAPI, profileAPI } from "@/lib/api";
import { Commitment, ContractStatistics, User } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [contracts, setContracts] = useState<Commitment[]>([]);
  const [stats, setStats] = useState<ContractStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "failed" | "overdue"
  >("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, contractsRes, statsRes] = await Promise.all([
        profileAPI.get(),
        contractsAPI.list(),
        contractsAPI.statistics(),
      ]);

      setUser(profileRes.data);
      setContracts(contractsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const getFilteredContracts = () => {
    if (filter === "all") return contracts;
    if (filter === "overdue") return contracts.filter((c) => c.is_overdue);
    return contracts.filter((c) => c.status === filter);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      paused: "bg-yellow-100 text-yellow-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Commitment
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              Hello, <span className="font-semibold">{user?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:text-red-800 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-gray-500 text-sm mb-1">Total Contracts</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.total_contracts}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-gray-500 text-sm mb-1">Active</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.active_contracts}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-gray-500 text-sm mb-1">Completed</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.completed_contracts}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-gray-500 text-sm mb-1">Total Stake</div>
              <div className="text-3xl font-bold text-indigo-600">
                ₹{stats.total_stake}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Commitments</h2>
          <Link
            href="/contracts/create"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            + New Commitment
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {["all", "active", "overdue", "completed", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {getFilteredContracts().length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">No commitments found</p>
              <Link
                href="/contracts/create"
                className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Create Your First Commitment
              </Link>
            </div>
          ) : (
            getFilteredContracts().map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {contract.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        {contract.status.toUpperCase()}
                      </span>
                      {contract.is_overdue && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{contract.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-semibold">Stake:</span>{" "}
                        {contract.currency} {contract.stake_amount}
                      </div>
                      <div>
                        <span className="font-semibold">Frequency:</span>{" "}
                        {contract.frequency}
                      </div>
                      <div>
                        <span className="font-semibold">Deadline:</span>{" "}
                        {format(
                          new Date(contract.end_time),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
