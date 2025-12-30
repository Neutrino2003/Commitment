"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CommitmentForm } from "@/components/commitments/CommitmentForm";
import { commitmentsApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function NewCommitmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("task_id");

  const [taskDetails, setTaskDetails] = React.useState<any>(null);

  React.useEffect(() => {
    if (taskId) {
      const fetchTask = async () => {
        try {
          const { default: api } = await import("@/lib/api");
          const response = await api.get(`/tasks/${taskId}/`);
          setTaskDetails(response.data);
        } catch (error) {
          console.error("Failed to fetch task details:", error);
          toast.error("Failed to load task details");
        }
      };
      fetchTask();
    }
  }, [taskId]);

  const handleSubmit = async (data: any) => {
    try {
      let payload;

      const commitmentData: any = {
        stake_type: data.stake_type,
        evidence_type: data.evidence_type,
        leniency: data.leniency,
      };

      if (data.stake_type === "money") {
        commitmentData.stake_amount = parseFloat(data.stake_amount) || 0;
        commitmentData.currency = data.currency;
      }

      if (taskId) {
        payload = {
          task_id: parseInt(taskId),
          ...commitmentData,
        };
      } else {
        const dueDate = new Date(data.due_date).toISOString();

        payload = {
          task_data: {
            title: data.title,
            due_date: dueDate,
          },
          ...commitmentData,
        };
      }

      console.log("Sending payload:", JSON.stringify(payload, null, 2));
      await commitmentsApi.create(payload);
      toast.success("Commitment Created!");
      router.push("/commitments");
    } catch (error: any) {
      console.error("Failed to create commitment:", error);
      let errorMessage = "Failed to create commitment";

      if (error?.response?.data) {
        const data = error.response.data;
        if (typeof data === "string") {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.task_data) {
          errorMessage = `Task data error: ${JSON.stringify(data.task_data)}`;
        } else if (data.non_field_errors) {
          errorMessage = data.non_field_errors[0] || errorMessage;
        } else {
          errorMessage = JSON.stringify(data);
        }
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Link
        href="/commitments"
        className="inline-flex items-center text-gray-500 hover:text-black mb-6 font-bold"
      >
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

export default function NewCommitmentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <NewCommitmentContent />
    </Suspense>
  );
}
