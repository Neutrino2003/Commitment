export interface Task {
    id: number;
    title: string;
    notes: string;
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 0 | 1 | 2 | 3;
    due_date: string | null;
    kanban_order: number;
    list: number | null;
    tags: Tag[];
    is_recurring: boolean;
    subtasks?: Task[];
    parent_id?: number | null;
    parent?: number | null;
    depth?: number;
    children_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Tag {
    id: number;
    name: string;
    color: string;
}

export interface List {
    id: number;
    name: string;
    color: string;
    icon: string;
}

export interface Habit {
    id: number;
    name: string;
    description: string;
    color: string;
    icon: string;
    frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM';
    target_days: number;
    recurrence: any; // RFC 5545 RRULE
    sort_order: number;
    is_active: boolean;
    streak: number;
    completion_rate: number;
    recent_logs: HabitLog[];
    created_at: string;
    updated_at: string;
}

export interface HabitLog {
    id: number;
    habit: number;
    date: string;
    completed: boolean;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface Commitment {
    id: number;
    task: Task;
    title: string;
    due_date: string | null;
    is_overdue: boolean;
    status: 'draft' | 'active' | 'completed' | 'failed' | 'cancelled' | 'paused' | 'appealed' | 'under_review';
    stake_type: 'social' | 'points' | 'money';
    stake_amount: string | null;
    currency: 'INR' | 'USD' | 'EUR' | 'GBP';
    leniency: 'lenient' | 'normal' | 'hard';
    is_paid: boolean;
    evidence_required: boolean;
    evidence_type: 'photo' | 'timelapse_video' | 'self_verification' | 'manual';
    evidence_file: string | null;
    evidence_text: string;
    evidence_submitted: boolean;
    evidence_submitted_at: string | null;
    complaints_flagged: boolean;
    complaint: string | null;
    created_at: string;
    updated_at: string;
    activated_at: string | null;
    completed_at: string | null;
}

export interface CommitmentDashboardStats {
    active_count: number;
    completed_count: number;
    failed_count: number;
    total_stakes_at_risk: number;
    pending_evidence_count: number;
    success_rate: number;
}

export interface Complaint {
    id: number;
    commitment: number;
    commitment_title: string;
    reason_category: string;
    description: string;
    evidence_file: string | null;
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    review_notes: string;
    reviewed_at: string | null;
    refund_amount: string | null;
    refund_processed: boolean;
    refund_processed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface EvidenceVerification {
    id: number;
    commitment: number;
    commitment_title: string;
    status: 'pending' | 'approved' | 'rejected' | 'needs_more_info';
    notes: string;
    verified_by: number | null;
    verified_at: string | null;
    created_at: string;
}
