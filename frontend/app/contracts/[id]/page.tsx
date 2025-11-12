"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { contractsAPI } from "@/lib/api";
import { Commitment } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function ContractDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [contract, setContract] = useState<Commitment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [evidenceText, setEvidenceText] = useState("");
  const [failureReason, setFailureReason] = useState("");

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  const loadContract = async () => {
    try {
      const response = await contractsAPI.get(Number(id));
      setContract(response.data);
    } catch (error) {
      toast.error("Failed to load contract");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!contract) return;

    setActionLoading(true);
    try {
      switch (action) {
        case "activate":
          await contractsAPI.activate(contract.id);
          toast.success("Contract activated!");
          break;
        case "pause":
          await contractsAPI.pause(contract.id);
          toast.success("Contract paused");
          break;
        case "resume":
          await contractsAPI.resume(contract.id);
          toast.success("Contract resumed");
          break;
        case "cancel":
          if (confirm("Are you sure you want to cancel this contract?")) {
            await contractsAPI.cancel(contract.id);
            toast.success("Contract cancelled");
          }
          break;
      }
      loadContract();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!contract) return;

    setActionLoading(true);
    try {
      await contractsAPI.markCompleted(contract.id, {
        evidence_type: contract.evidence_type,
        evidence_data: evidenceText,
      });
      toast.success("Contract marked as completed!");
      setShowCompleteModal(false);
      loadContract();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to mark as completed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkFailed = async () => {
    if (!contract) return;

    setActionLoading(true);
    try {
      await contractsAPI.markFailed(contract.id, { reason: failureReason });
      toast.success("Contract marked as failed");
      setShowFailModal(false);
      loadContract();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to mark as failed");
    } finally {
      setActionLoading(false);
    }
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

  if (!contract) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-indigo-600"
          >
            Commitment
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {contract.title}
              </h1>
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
            <p className="text-gray-600">{contract.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-gray-500">
                  Stake Amount
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {contract.currency} {contract.stake_amount}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-500">
                  Frequency
                </div>
                <div className="text-lg font-medium">{contract.frequency}</div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-500">
                  Evidence Type
                </div>
                <div className="text-lg font-medium">
                  {contract.evidence_type.replace("_", " ")}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-500">
                  Leniency
                </div>
                <div className="text-lg font-medium capitalize">
                  {contract.leniency}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-gray-500">
                  Start Time
                </div>
                <div className="text-lg font-medium">
                  {format(new Date(contract.start_time), "MMM dd, yyyy HH:mm")}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-500">
                  End Time
                </div>
                <div className="text-lg font-medium">
                  {format(new Date(contract.end_time), "MMM dd, yyyy HH:mm")}
                </div>
              </div>

              {contract.completed_at && (
                <div>
                  <div className="text-sm font-semibold text-gray-500">
                    Completed At
                  </div>
                  <div className="text-lg font-medium">
                    {format(
                      new Date(contract.completed_at),
                      "MMM dd, yyyy HH:mm"
                    )}
                  </div>
                </div>
              )}

              {contract.is_completed_on_time !== null && (
                <div>
                  <div className="text-sm font-semibold text-gray-500">
                    Completed On Time
                  </div>
                  <div
                    className={`text-lg font-medium ${
                      contract.is_completed_on_time
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {contract.is_completed_on_time ? "Yes ✓" : "No ✗"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Section */}
          {contract.evidence_submitted && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold mb-2">Evidence Submitted</h3>
              {contract.evidence_text && (
                <p className="text-gray-700">{contract.evidence_text}</p>
              )}
              {contract.evidence_submitted_at && (
                <p className="text-sm text-gray-500 mt-2">
                  Submitted:{" "}
                  {format(
                    new Date(contract.evidence_submitted_at),
                    "MMM dd, yyyy HH:mm"
                  )}
                </p>
              )}
            </div>
          )}

          {/* Complaint Section */}
          {contract.complaints_flagged && contract.complaint && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">
                Complaint Filed
              </h3>
              <p className="text-gray-700">{contract.complaint}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {contract.status === "draft" && (
              <button
                onClick={() => handleAction("activate")}
                disabled={actionLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                Activate
              </button>
            )}

            {contract.status === "active" && (
              <>
                <button
                  onClick={() => setShowCompleteModal(true)}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => setShowFailModal(true)}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  Mark Failed
                </button>
                <button
                  onClick={() => handleAction("pause")}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:bg-gray-400"
                >
                  Pause
                </button>
              </>
            )}

            {contract.status === "paused" && (
              <button
                onClick={() => handleAction("resume")}
                disabled={actionLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                Resume
              </button>
            )}

            {!["completed", "failed", "cancelled"].includes(
              contract.status
            ) && (
              <button
                onClick={() => handleAction("cancel")}
                disabled={actionLoading}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400"
              >
                Cancel Contract
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Mark as Completed</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evidence / Notes
              </label>
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                rows={4}
                placeholder="Provide evidence or notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleMarkCompleted}
                disabled={actionLoading}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {actionLoading ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failed Modal */}
      {showFailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Mark as Failed</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Failure
              </label>
              <textarea
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                rows={4}
                placeholder="Why did you fail this commitment?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleMarkFailed}
                disabled={actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
              >
                {actionLoading ? "Submitting..." : "Mark Failed"}
              </button>
              <button
                onClick={() => setShowFailModal(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
