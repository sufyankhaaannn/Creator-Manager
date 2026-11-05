import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Video,
} from 'lucide-react';
import {
  Goal,
  GoalCategory,
  GoalPeriod,
  GoalTargetType,
  Platform,
  PLATFORM_CONFIG,
  ProductivityTask,
  PublishingSchedule,
} from '../types/index';
import { calculatePublishingConsistency } from '../lib/calculations';

interface GoalsViewProps {
  goals: Goal[];
  tasks: ProductivityTask[];
  schedules: PublishingSchedule[];
  onSaveGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Goal;
  onDeleteGoal: (id: string) => void;
  onToggleTask: (taskId: string) => void;
  onSaveTask: (task: Omit<ProductivityTask, 'id'> & { id?: string }) => void;
  onDeleteTask: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  tasks,
  schedules,
  onSaveGoal,
  onDeleteGoal,
  onToggleTask,
  onSaveTask,
  onDeleteTask,
}) => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [goalForm, setGoalForm] = useState({
    title: '',
    category: 'content_production' as GoalCategory,
    targetType: 'weekly_uploads' as GoalTargetType,
    period: 'weekly' as GoalPeriod,
    targetValue: '',
    currentValue: '0',
    platformScope: 'all' as 'all' | Platform,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: '',
  });

  const consistency = calculatePublishingConsistency(schedules);

  const handleOpenNewGoal = () => {
    setEditingGoalId(null);
    setGoalForm({
      title: '',
      category: 'content_production',
      targetType: 'weekly_uploads',
      period: 'weekly',
      targetValue: '5',
      currentValue: '0',
      platformScope: 'all',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      notes: '',
    });
    setIsGoalModalOpen(true);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(goalForm.targetValue);
    const currentVal = parseFloat(goalForm.currentValue);

    if (isNaN(targetVal) || targetVal <= 0) return;

    onSaveGoal({
      id: editingGoalId || undefined,
      title: goalForm.title,
      category: goalForm.category,
      targetType: goalForm.targetType,
      period: goalForm.period,
      targetValue: targetVal,
      currentValue: isNaN(currentVal) ? 0 : currentVal,
      platformScope: goalForm.platformScope,
      startDate: goalForm.startDate,
      endDate: goalForm.endDate,
      status: currentVal >= targetVal ? 'completed' : 'active',
      notes: goalForm.notes,
    });

    setIsGoalModalOpen(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onSaveTask({
      title: newTaskTitle.trim(),
      category: 'verification',
      completed: false,
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setNewTaskTitle('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl arctic-glass">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-[var(--accent-light)]" />
            Goals & Creator Productivity
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Publishing volume targets, verified streaks, audience milestones, and daily tasks
          </p>
        </div>

        <button
          onClick={handleOpenNewGoal}
          className="px-3.5 py-1.5 rounded-lg command-btn-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/15"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Target Goal</span>
        </button>
      </div>

      {/* 10.4 Consistency Tracker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl arctic-glass space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-amber-400">{consistency.currentStreakDays} Days</p>
          <p className="text-[10px] text-[var(--text-muted)]">Longest recorded: {consistency.longestStreakDays} days</p>
        </div>

        <div className="p-4 rounded-xl arctic-glass space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Schedule Adherence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400">{consistency.onTimePercentage}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">On-time completion of planned uploads</p>
        </div>

        <div className="p-4 rounded-xl arctic-glass space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Completed Uploads</span>
            <Video className="w-4 h-4 text-[var(--accent-light)]" />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-100">{consistency.completedCount}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Out of {consistency.plannedCount} planned uploads</p>
        </div>

        <div className="p-4 rounded-xl arctic-glass space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Active Goals</span>
            <Award className="w-4 h-4 text-indigo-200" />
          </div>
          <p className="text-2xl font-mono font-bold text-indigo-200">
            {goals.filter((g) => g.status === 'active').length}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {goals.filter((g) => g.status === 'completed').length} completed
          </p>
        </div>
      </div>

      {/* 10.3 Goals List & Progress */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-[var(--accent-light)]" />
          Operational Goals & Targets
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            const isFinished = pct >= 100;
            return (
              <div
                key={g.id}
                className="p-5 rounded-xl arctic-glass hover:border-[var(--accent)]/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[var(--elevated)] text-[var(--accent-light)] border border-[var(--accent)]/20">
                      {g.category.replace('_', ' ')} • {g.period}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 mt-1.5">{g.title}</h3>
                  </div>
                  <button
                    onClick={() => onDeleteGoal(g.id)}
                    className="text-[var(--text-muted)] hover:text-rose-400 p-1"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-muted)]">Progress: {g.currentValue.toLocaleString()} / {g.targetValue.toLocaleString()}</span>
                    <span className={`font-bold ${isFinished ? 'text-emerald-400' : 'text-[var(--accent-light)]'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--elevated)] overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--panel-border)]">
                  <span>Window: {g.startDate} to {g.endDate}</span>
                  <span className="font-semibold text-slate-200">
                    {g.platformScope === 'all' ? 'All Platforms' : PLATFORM_CONFIG[g.platformScope].name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 10.5 Lightweight Daily Productivity Tasks */}
      <div className="p-5 rounded-xl arctic-glass space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--accent)]/15 pb-2">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[var(--accent-light)]" />
            Daily Creator Operations Checklist
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            Connected directly to daily creator workflows
          </span>
        </div>

        {/* Add new task input */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            placeholder="Add quick creator task (e.g. Export 9:16 vertical render for MAT-003)..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 bg-[var(--elevated)] border border-[var(--accent)]/20 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--elevated-hover)] text-[var(--accent-light)] text-xs font-bold rounded-lg hover:bg-[var(--accent)] hover:text-[#080D14] transition-all"
          >
            Add Task
          </button>
        </form>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-all ${
                task.completed
                  ? 'bg-[var(--elevated)]/40 border-[var(--panel-border)] text-[var(--text-muted)]'
                  : 'bg-[var(--elevated-hover)]/50 border-[var(--accent)]/20 text-slate-200'
              }`}
            >
              <div
                onClick={() => onToggleTask(task.id)}
                className="flex items-center space-x-3 cursor-pointer flex-1"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    task.completed
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'border-[var(--panel-border)]'
                  }`}
                >
                  {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className={task.completed ? 'line-through' : 'font-medium'}>{task.title}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Due: {task.dueDate}</span>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-rose-400"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Set Operational Target Goal</h2>

            <form onSubmit={handleGoalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Upload 5 Short-Form Videos This Week"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value as any })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200"
                  >
                    <option value="content_production">Content Production</option>
                    <option value="views">Views Target</option>
                    <option value="audience_growth">Audience Growth</option>
                    <option value="engagement">Engagement Target</option>
                    <option value="data_management">Daily Data Logging</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Period</label>
                  <select
                    value={goalForm.period}
                    onChange={(e) => setGoalForm({ ...goalForm, period: e.target.value as any })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Target Number</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={goalForm.targetValue}
                    onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Current Progress</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={goalForm.currentValue}
                    onChange={(e) => setGoalForm({ ...goalForm, currentValue: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={goalForm.startDate}
                    onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">End Date</label>
                  <input
                    type="date"
                    value={goalForm.endDate}
                    onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--accent)]/20">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[var(--text-muted)] hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg command-btn-primary text-white font-bold"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
