export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  bio?: string;
  profile_image?: string;
  leniency: "lenient" | "normal" | "hard";
  success_rate: number;
  profile_complete: boolean;
}

export interface UserStatistics {
  total_stakes: string;
  total_contracts: number;
  successful_contracts: number;
  failed_contracts: number;
  total_loss: string;
  complaints_applied: number;
  complaints_approved: number;
  complaints_rejected: number;
  last_updated: string;
}

export interface Commitment {
  id: number;
  user: number;
  user_name: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  frequency: "daily" | "weekly" | "monthly" | "one_time" | "custom";
  custom_days?: string;
  stake_amount: string;
  currency: string;
  leniency: "lenient" | "normal" | "hard";
  status:
    | "draft"
    | "active"
    | "completed"
    | "failed"
    | "cancelled"
    | "paused"
    | "appealed"
    | "under_review";
  evidence_required: boolean;
  evidence_type: "photo" | "timelapse_video" | "self_verification" | "manual";
  evidence_file?: string;
  evidence_text?: string;
  evidence_submitted: boolean;
  evidence_submitted_at?: string;
  complaints_flagged: boolean;
  complaint?: string;
  time_remaining: string | null;
  is_overdue: boolean;
  is_completed_on_time: boolean | null;
  created_at: string;
  updated_at: string;
  activated_at?: string;
  completed_at?: string;
}

export interface ContractStatistics {
  total_contracts: number;
  active_contracts: number;
  completed_contracts: number;
  completed_on_time: number;
  failed_contracts: number;
  appealed_contracts: number;
  under_review_contracts: number;
  paused_contracts: number;
  cancelled_contracts: number;
  overdue_contracts: number;
  total_stake: string;
}
