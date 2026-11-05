import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Flame,
  ListFilter,
  MoreVertical,
  Plus,
  RefreshCw,
  Video,
  X,
} from 'lucide-react';
import {
  Material,
  Platform,
  PLATFORM_CONFIG,
  PublishingSchedule,
  UserPreferences,
} from '../types/index';
import { calculatePublishingConsistency, formatPlatformName } from '../lib/calculations';

interface CalendarViewProps {
  materials: Material[];
  schedules: PublishingSchedule[];
  preferences: UserPreferences;
  onSaveSchedule: (schedule: Omit<PublishingSchedule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => PublishingSchedule;
  onDeleteSchedule: (id: string) => void;
  onNavigateToMaterial: (materialId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  materials,
  schedules,
  preferences,
  onSaveSchedule,
  onDeleteSchedule,
  onNavigateToMaterial,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<'all' | Platform>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Schedule modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [selectedScheduleForChecklist, setSelectedScheduleForChecklist] = useState<PublishingSchedule | null>(null);

  const [formState, setFormState] = useState({
    materialId: materials[0]?.id || '',
    platform: 'youtube_shorts' as Platform,
    plannedDate: new Date().toISOString().slice(0, 10),
    plannedTime: '18:00',
    actualDate: '',
    actualTime: '',
    status: 'scheduled' as PublishingSchedule['status'],
    reminders: ['30m', '5m'] as PublishingSchedule['reminders'],
    publishedUrl: '',
    checklist: {
      videoExported: false,
      captionSelected: false,
      thumbnailReady: false,
      videoUploaded: false,
      publicationConfirmed: false,
    },
  });

  // Consistency & Streak Metrics
  const consistency = calculatePublishingConsistency(schedules);

  // Timezone formatting helper
  const formatTimeLocal = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: preferences.timezone || 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: preferences.timeFormat === '12h',
      }).format(new Date(iso));
    } catch {
      return iso.slice(11, 16);
    }
  };

  const formatDateLocal = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: preferences.timezone || 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  // Filtered schedules
  const nowIso = new Date().toISOString();
  const filteredSchedules = schedules.filter((s) => {
    if (selectedPlatformFilter !== 'all' && s.platform !== selectedPlatformFilter) return false;
    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'overdue') {
        const isOverdue = s.status === 'overdue' || (s.status === 'scheduled' && s.plannedPublishAt < nowIso);
        if (!isOverdue) return false;
      } else if (s.status !== selectedStatusFilter) {
        return false;
      }
    }
    return true;
  });

  // Overdue schedules
  const overdueList = schedules.filter(
    (s) => s.status === 'overdue' || (s.status === 'scheduled' && s.plannedPublishAt < nowIso)
  );

  // Month grid generator
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  };

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentDate);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const gotoToday = () => setCurrentDate(new Date());

  const handleOpenNewModal = (dateStr?: string) => {
    setEditingScheduleId(null);
    setFormState({
      materialId: materials[0]?.id || '',
      platform: 'youtube_shorts',
      plannedDate: dateStr || new Date().toISOString().slice(0, 10),
      plannedTime: '18:00',
      actualDate: '',
      actualTime: '',
      status: 'scheduled',
      reminders: ['30m', '5m'],
      publishedUrl: '',
      checklist: {
        videoExported: false,
        captionSelected: false,
        thumbnailReady: false,
        videoUploaded: false,
        publicationConfirmed: false,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sch: PublishingSchedule) => {
    setEditingScheduleId(sch.id);
    const plannedDt = new Date(sch.plannedPublishAt);
    const plannedDateStr = plannedDt.toISOString().slice(0, 10);
    const plannedTimeStr = plannedDt.toISOString().slice(11, 16);

    let actualDateStr = '';
    let actualTimeStr = '';
    if (sch.actualPublishAt) {
      const actDt = new Date(sch.actualPublishAt);
      actualDateStr = actDt.toISOString().slice(0, 10);
      actualTimeStr = actDt.toISOString().slice(11, 16);
    }

    setFormState({
      materialId: sch.materialId,
      platform: sch.platform,
      plannedDate: plannedDateStr,
      plannedTime: plannedTimeStr,
      actualDate: actualDateStr,
      actualTime: actualTimeStr,
      status: sch.status,
      reminders: sch.reminders,
      publishedUrl: sch.publishedUrl || '',
      checklist: sch.checklist,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plannedIso = new Date(`${formState.plannedDate}T${formState.plannedTime}:00Z`).toISOString();
    let actualIso: string | undefined = undefined;
    if (formState.actualDate && formState.actualTime) {
      actualIso = new Date(`${formState.actualDate}T${formState.actualTime}:00Z`).toISOString();
    }

    onSaveSchedule({
      id: editingScheduleId || undefined,
      materialId: formState.materialId,
      platform: formState.platform,
      plannedPublishAt: plannedIso,
      actualPublishAt: actualIso,
      status: formState.status,
      reminders: formState.reminders,
      publishedUrl: formState.publishedUrl,
      checklist: formState.checklist,
    });

    setIsModalOpen(false);
  };

  const handleQuickMarkPublished = (sch: PublishingSchedule) => {
    const nowUtc = new Date().toISOString();
    onSaveSchedule({
      ...sch,
      status: 'published',
      actualPublishAt: nowUtc,
      checklist: {
        ...sch.checklist,
        videoUploaded: true,
        publicationConfirmed: true,
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl arctic-glass">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-[var(--accent-light)]" />
              Publishing Calendar & Schedules
            </h1>
            <span className="text-xs font-mono font-bold text-[var(--accent-light)] bg-[var(--accent-bg)] border border-[var(--accent)]/30 px-2 py-0.5 rounded">
              {preferences.timezone}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Platform-specific upload times, automated overdue detection, and verification checklists
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-[var(--elevated)] p-1 rounded-lg border border-[var(--accent)]/20">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                viewMode === 'month' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                viewMode === 'agenda' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
              }`}
            >
              Agenda
            </button>
          </div>

          <button
            onClick={() => handleOpenNewModal()}
            className="px-3.5 py-1.5 rounded-lg command-btn-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Upload</span>
          </button>
        </div>
      </div>

      {/* Consistency Streak Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl arctic-glass">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Publishing Streak</p>
            <p className="text-lg font-mono font-bold text-amber-400">{consistency.currentStreakDays} Days</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">On-Time Fidelity</p>
            <p className="text-lg font-mono font-bold text-emerald-400">{consistency.onTimePercentage}%</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-[var(--accent)]/30 text-[var(--accent-light)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Completed / Planned</p>
            <p className="text-lg font-mono font-bold text-slate-100">
              {consistency.completedCount} / {consistency.plannedCount}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Overdue Alerts</p>
            <p className="text-lg font-mono font-bold text-rose-400">{overdueList.length}</p>
          </div>
        </div>
      </div>

      {/* Overdue Action Banner if overdue items exist */}
      {overdueList.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-amber-300">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              {overdueList.length} Upload(s) are Overdue and Require Confirmation
            </span>
            <span className="text-[11px] font-normal text-amber-200/80">
              Scheduled time passed without recorded upload
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {overdueList.map((sch) => {
              const mat = materials.find((m) => m.id === sch.materialId);
              const cfg = PLATFORM_CONFIG[sch.platform];
              return (
                <div
                  key={sch.id}
                  className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[var(--accent-light)] font-bold">{sch.materialId}</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                        {mat?.title || 'Untitled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {cfg.name} • Planned: {formatDateLocal(sch.plannedPublishAt)} {formatTimeLocal(sch.plannedPublishAt)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleQuickMarkPublished(sch)}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold hover:bg-emerald-500 hover:text-slate-950"
                    >
                      Confirm Published
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(sch)}
                      className="px-2.5 py-1 rounded bg-[var(--elevated-hover)] text-[var(--accent-light)] text-[11px] font-medium"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month Navigation & Platform Filtering */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl arctic-glass">
        <div className="flex items-center space-x-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:bg-[var(--elevated-hover)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-slate-100 font-mono">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:bg-[var(--elevated-hover)]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={gotoToday}
            className="px-2.5 py-1 rounded text-xs font-semibold text-[var(--accent-light)] bg-[var(--elevated)] border border-[var(--accent)]/20 hover:border-[var(--accent)]/50"
          >
            Today
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedPlatformFilter}
            onChange={(e) => setSelectedPlatformFilter(e.target.value as any)}
            className="bg-[var(--elevated)] border border-[var(--accent)]/20 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Platforms</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram_reels">Instagram Reels</option>
            <option value="facebook_reels">Facebook Reels</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-[var(--elevated)] border border-[var(--accent)]/20 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' ? (
        <div className="arctic-glass rounded-xl overflow-hidden border border-[var(--accent)]/20">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 bg-[var(--elevated)] border-b border-[var(--panel-border)] text-center text-[11px] font-bold text-[var(--text-muted)] py-2">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[var(--panel-border)]">
            {/* Empty padding days */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[105px] bg-slate-950/40 p-2" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const daySchedules = filteredSchedules.filter((s) => s.plannedPublishAt.slice(0, 10) === dateStr);
              const isToday = new Date().toISOString().slice(0, 10) === dateStr;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleOpenNewModal(dateStr)}
                  className={`min-h-[105px] p-2 transition-colors cursor-pointer group flex flex-col justify-between ${
                    isToday ? 'bg-[var(--elevated-hover)]/40 ring-1 ring-[var(--accent)]/50' : 'hover:bg-[var(--elevated)]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-[var(--accent)] text-[#080D14] flex items-center justify-center'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {daySchedules.length} uploads
                      </span>
                    )}
                  </div>

                  {/* Scheduled Items Pill List */}
                  <div className="space-y-1 mt-1">
                    {daySchedules.map((sch) => {
                      const cfg = PLATFORM_CONFIG[sch.platform];
                      const isOverdue =
                        sch.status === 'overdue' || (sch.status === 'scheduled' && sch.plannedPublishAt < nowIso);
                      return (
                        <div
                          key={sch.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(sch);
                          }}
                          className={`p-1 rounded text-[10px] font-medium flex items-center justify-between transition-all ${
                            sch.status === 'published'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                              : isOverdue
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                              : 'bg-[var(--elevated)] border border-[var(--accent)]/20 text-indigo-200'
                          }`}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: cfg.brandColor }}
                            />
                            <span className="font-mono font-bold">{sch.materialId}</span>
                          </span>
                          <span className="font-mono text-[9px] shrink-0 text-[var(--text-muted)]">
                            {formatTimeLocal(sch.plannedPublishAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="arctic-glass rounded-xl overflow-hidden border border-[var(--accent)]/15">
          <div className="p-3 bg-[var(--elevated)] border-b border-[var(--panel-border)] font-semibold text-xs text-slate-200">
            Chronological Publishing Agenda
          </div>
          <div className="divide-y divide-[var(--panel-border)]">
            {filteredSchedules.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                No scheduled uploads match the selected filters.
              </div>
            ) : (
              filteredSchedules
                .sort((a, b) => a.plannedPublishAt.localeCompare(b.plannedPublishAt))
                .map((sch) => {
                  const mat = materials.find((m) => m.id === sch.materialId);
                  const cfg = PLATFORM_CONFIG[sch.platform];
                  const isOverdue =
                    sch.status === 'overdue' || (sch.status === 'scheduled' && sch.plannedPublishAt < nowIso);
                  return (
                    <div
                      key={sch.id}
                      className="p-4 hover:bg-[var(--elevated-hover)]/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-[var(--accent-light)] px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent)]/20">
                            {sch.materialId}
                          </span>
                          <span className="text-xs font-bold text-slate-100">{mat?.title || 'Untitled'}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1 font-medium">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cfg.brandColor }}
                            />
                            {cfg.name}
                          </span>
                          <span>•</span>
                          <span>Planned: {formatDateLocal(sch.plannedPublishAt)} at {formatTimeLocal(sch.plannedPublishAt)}</span>
                          {sch.actualPublishAt && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400">
                                Published: {formatTimeLocal(sch.actualPublishAt)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {sch.status === 'published' ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            PUBLISHED
                          </span>
                        ) : isOverdue ? (
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                            OVERDUE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                            SCHEDULED
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedScheduleForChecklist(sch)}
                          className="px-2.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-light)] border border-[var(--panel-border)] rounded"
                        >
                          Checklist
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(sch)}
                          className="px-2.5 py-1 text-xs text-[var(--accent-light)] bg-[var(--elevated-hover)] rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteSchedule(sch.id)}
                          className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Checklist Side Drawer Modal */}
      {selectedScheduleForChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--accent)]/20 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent-light)]" />
                Publishing Verification Checklist
              </h2>
              <button
                onClick={() => setSelectedScheduleForChecklist(null)}
                className="text-[var(--text-muted)] hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-200">
              {[
                { key: 'videoExported', label: '1. Video Rendered & Exported (9:16 vertical)' },
                { key: 'captionSelected', label: '2. Platform Caption & Hashtags Selected' },
                { key: 'thumbnailReady', label: '3. Thumbnail Prompt Executed & Ready' },
                { key: 'videoUploaded', label: '4. Video Uploaded to Social Platform' },
                { key: 'publicationConfirmed', label: '5. Public Availability Confirmed' },
              ].map((item) => {
                const isChecked =
                  (selectedScheduleForChecklist.checklist as any)[item.key] || false;
                return (
                  <label
                    key={item.key}
                    className="flex items-center space-x-2.5 p-2 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] cursor-pointer hover:border-[var(--accent)]/40"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updated = {
                          ...selectedScheduleForChecklist,
                          checklist: {
                            ...selectedScheduleForChecklist.checklist,
                            [item.key]: e.target.checked,
                          },
                        };
                        setSelectedScheduleForChecklist(updated);
                        onSaveSchedule(updated);
                      }}
                      className="rounded border-[var(--panel-border)] text-[var(--accent-light)] focus:ring-0"
                    />
                    <span className={isChecked ? 'line-through text-[var(--text-muted)]' : 'font-medium'}>
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedScheduleForChecklist(null)}
              className="w-full py-2 bg-[var(--elevated-hover)] text-slate-200 font-semibold text-xs rounded-lg hover:text-[var(--accent-light)]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Schedule Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-100">
              {editingScheduleId ? 'Edit Publishing Schedule' : 'Schedule Platform Upload'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">Select Material</label>
                {materials.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                    <p>No video materials found in your library yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        onNavigateToMaterial('');
                      }}
                      className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded text-xs hover:bg-amber-300 transition-colors"
                    >
                      Go to Material Hub to create your first video
                    </button>
                  </div>
                ) : (
                  <select
                    value={formState.materialId}
                    onChange={(e) => setFormState({ ...formState, materialId: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200"
                    required
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.id}] {m.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Target Platform</label>
                  <select
                    value={formState.platform}
                    onChange={(e) => setFormState({ ...formState, platform: e.target.value as any })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200"
                  >
                    <option value="youtube_shorts">YouTube Shorts</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram_reels">Instagram Reels</option>
                    <option value="facebook_reels">Facebook Reels</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Status</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Planned Date ({preferences.timezone})
                  </label>
                  <input
                    type="date"
                    value={formState.plannedDate}
                    onChange={(e) => setFormState({ ...formState, plannedDate: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Planned Time</label>
                  <input
                    type="time"
                    value={formState.plannedTime}
                    onChange={(e) => setFormState({ ...formState, plannedTime: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Reminders selection */}
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1.5">
                  Notification Reminders
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['30m', '15m', '5m', 'at_time'] as const).map((rem) => {
                    const isSelected = formState.reminders.includes(rem);
                    return (
                      <button
                        type="button"
                        key={rem}
                        onClick={() => {
                          const next = isSelected
                            ? formState.reminders.filter((r) => r !== rem)
                            : [...formState.reminders, rem];
                          setFormState({ ...formState, reminders: next });
                        }}
                        className={`px-3 py-1 rounded text-xs font-semibold border ${
                          isSelected
                            ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)] border-[var(--accent)]/50'
                            : 'bg-[var(--elevated)] text-[var(--text-muted)] border-[var(--panel-border)]'
                        }`}
                      >
                        {rem === 'at_time' ? 'At scheduled time' : `${rem} before`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Published URL (Optional) */}
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Published URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formState.publishedUrl}
                  onChange={(e) => setFormState({ ...formState, publishedUrl: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--panel-border)] rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--accent)]/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[var(--text-muted)] hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={materials.length === 0}
                  className="px-5 py-2 rounded-lg command-btn-primary text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
