'use client';

import React from 'react';
import { HeroTask } from '@/components/dashboard/hero-task';
import { TaskQueue } from '@/components/dashboard/task-queue';
import { HabitStack } from '@/components/dashboard/habit-stack';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useCommitments } from '@/hooks/useCommitments';
import Layout from '@/components/layout/layout';
import AuthCheck from '@/components/layout/auth-check';
import { CommitmentWidget } from '@/components/dashboard/commitment-widget';

export default function Dashboard() {
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: commitments, isLoading: commitmentsLoading } = useCommitments();

  if (tasksLoading || habitsLoading) {
    return <div className="flex items-center justify-center h-screen font-black text-2xl animate-pulse">LOADING...</div>;
  }

  if (tasksError) {
    return <div className="text-accent-pink font-bold text-center p-8">ERROR LOADING TASKS</div>;
  }

  // Sort tasks: Priority desc, then ID
  const sortedTasks = tasks?.sort((a, b) => b.priority - a.priority) || [];

  // First task is Hero, rest are Queue
  const activeTask = sortedTasks.find(t => t.status !== 'COMPLETED');
  const queueTasks = sortedTasks.filter(t => t.id !== activeTask?.id && t.status !== 'COMPLETED');

  // Transform habits to show today's completion status
  const today = new Date().toISOString().split('T')[0];
  const habitsWithToday = habits?.map(habit => ({
    ...habit,
    completed_today: habit.recent_logs.some(log => log.date === today && log.completed)
  })) || [];

  return (
    <AuthCheck>
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-8">
            <HeroTask task={activeTask} />
            <TaskQueue tasks={queueTasks} />
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-4">
            <CommitmentWidget commitments={commitments || []} />
            <HabitStack habits={habitsWithToday.slice(0, 5)} />

            {/* Anti-Procrastination Quote */}
            <div className="mt-8 p-6 border-3 border-ink-black bg-accent-pink text-white font-black text-2xl leading-none shadow-neo rotate-1">
              "ONE DAY OR DAY ONE. YOU DECIDE."
            </div>
          </div>
        </div>
      </Layout>
    </AuthCheck>
  );
}
