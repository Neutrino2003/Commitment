"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { contractsAPI } from "@/lib/api";
import toast from "react-hot-toast";

export default function CreateContract() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    frequency: "one_time",
    custom_days: "",
    stake_amount: "",
    currency: "Rupees",
    leniency: "normal",
    evidence_required: true,
    evidence_type: "self_verification",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await contractsAPI.create(formData);
      toast.success("Commitment created successfully!");

      // Activate the contract immediately
      if (response.data.id) {
        await contractsAPI.activate(response.data.id);
        toast.success("Commitment activated!");
      }

      router.push("/dashboard");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail || "Failed to create commitment";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Create New Commitment
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Daily Morning Workout"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe your commitment in detail..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="one_time">One Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Custom Days (if frequency is custom) */}
            {formData.frequency === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Days (comma-separated: MON,TUE,WED...)
                </label>
                <input
                  type="text"
                  name="custom_days"
                  value={formData.custom_days}
                  onChange={handleChange}
                  placeholder="e.g., MON,WED,FRI"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
            )}

            {/* Stake Amount */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stake Amount *
                </label>
                <input
                  type="number"
                  name="stake_amount"
                  value={formData.stake_amount}
                  onChange={handleChange}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="100.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="Rupees">Rupees</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Leniency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leniency Level
              </label>
              <select
                name="leniency"
                value={formData.leniency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="lenient">
                  Lenient - Easy appeal requirements
                </option>
                <option value="normal">
                  Normal - Standard appeal requirements
                </option>
                <option value="hard">Hard - Strict appeal requirements</option>
              </select>
            </div>

            {/* Evidence Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evidence Type
              </label>
              <select
                name="evidence_type"
                value={formData.evidence_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="self_verification">Self Verification</option>
                <option value="photo">Photo Upload</option>
                <option value="timelapse_video">Timelapse Video</option>
                <option value="manual">Manual Verification</option>
              </select>
            </div>

            {/* Evidence Required Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="evidence_required"
                checked={formData.evidence_required}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600"
              />
              <label className="ml-2 text-sm text-gray-700">
                Evidence Required
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                {loading ? "Creating..." : "Create & Activate Commitment"}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
