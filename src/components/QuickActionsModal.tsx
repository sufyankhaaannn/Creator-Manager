import React from 'react';
import {
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Plus,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { exportToExcelWorkbook, generatePdfReport } from '../lib/export';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'add_material',
      title: 'Create Content Material',
      desc: 'Automatic MAT-ID sequence, continuous video script, platform captions, 5-6 cues',
      icon: FolderKanban,
      color: 'text-[var(--accent-light)]',
      borderColor: 'border-[var(--accent)]/30',
      action: () => {
        onSelectAction('add_material');
        onClose();
      },
    },
    {
      id: 'account_analytics',
      title: 'Log Daily Account Snapshot',
      desc: 'Enter today’s views, follower snapshot, likes, comments, and shares per platform',
      icon: TrendingUp,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      action: () => {
        onSelectAction('account_analytics');
        onClose();
      },
    },
    {
      id: 'video_insights',
      title: 'Log Video Checkpoint (24h / 48h / 7d)',
      desc: 'Record cumulative metrics for automated incremental gain calculations',
      icon: Clock,
      color: 'text-indigo-200',
      borderColor: 'border-indigo-400/30',
      action: () => {
        onSelectAction('video_insights');
        onClose();
      },
    },
    {
      id: 'schedule_video',
      title: 'Schedule Platform Upload',
      desc: 'Assign YouTube, TikTok, IG, or FB upload dates with local timezone reminders',
      icon: Calendar,
      color: 'text-cyan-300',
      borderColor: 'border-cyan-400/30',
      action: () => {
        onSelectAction('schedule_video');
        onClose();
      },
    },
    {
      id: 'export_pdf',
      title: 'Generate Executive PDF Report',
      desc: 'Branded intelligence document with metrics, platform breakdown, and observations',
      icon: FileText,
      color: 'text-rose-400',
      borderColor: 'border-rose-400/30',
      action: () => {
        generatePdfReport('Executive Intelligence Report');
        onClose();
      },
    },
    {
      id: 'export_excel',
      title: 'Export Multi-Sheet Excel (.xlsx)',
      desc: 'Comprehensive workbook with analytics, checkpoints, materials, and schedules',
      icon: FileSpreadsheet,
      color: 'text-emerald-300',
      borderColor: 'border-emerald-400/30',
      action: () => {
        exportToExcelWorkbook();
        onClose();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--accent)]/20 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[var(--accent-light)]" />
            <h2 className="text-base font-bold text-slate-100">Operational Quick Actions</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-slate-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={act.action}
                className={`p-3.5 rounded-xl bg-[var(--elevated)] border ${act.borderColor} hover:bg-[var(--elevated-hover)] hover:border-[var(--accent)] transition-all text-left flex items-start space-x-3.5 group`}
              >
                <div className={`p-2 rounded-lg bg-[var(--bg-main)] ${act.color} mt-0.5 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-100 group-hover:text-[var(--accent-light)] transition-colors">
                    {act.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-normal">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
