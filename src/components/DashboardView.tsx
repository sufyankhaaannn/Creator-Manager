import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Flame,
  Info,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';
import {
  AccountAnalyticsEntry,
  Material,
  Platform,
  PLATFORM_CONFIG,
  ProductivityTask,
  PublishingSchedule,
  UserPreferences,
  VideoAnalyticsCheckpoint,
} from '../types/index';
import {
  calculateAccountViews,
  calculateCombinedFollowerTotal,
  calculateFollowerGrowth,
  calculateWeightedEngagementRate,
  calculatePublishingConsistency,
  formatPlatformName,
} from '../lib/calculations';

interface DashboardViewProps {
  materials: Material[];
  accountEntries: AccountAnalyticsEntry[];
  checkpoints: VideoAnalyticsCheckpoint[];
  schedules: PublishingSchedule[];
  tasks: ProductivityTask[];
  preferences: UserPreferences;
  onNavigate: (tab: string, context?: any) => void;
  onOpenQuickAction: (actionType?: string) => void;
  onToggleTask: (taskId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  materials,
  accountEntries,
  checkpoints,
  schedules,
  tasks,
  preferences,
  onNavigate,
  onOpenQuickAction,
  onToggleTask,
}) => {
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<'all' | Platform>('all');
  const [chartMetric, setChartMetric] = useState<'views' | 'engagement'>('views');

  // Filter date boundary
  const getFilterStartDate = () => {
    if (selectedRange === 'all') return undefined;
    const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const filterStartDate = getFilterStartDate();
  const selectedPlatformsList: Platform[] =
    selectedPlatformFilter === 'all'
      ? ['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels']
      : [selectedPlatformFilter];

  // Calculations adhering strictly to Section 5 & 20
  const followersData = calculateCombinedFollowerTotal(accountEntries, selectedPlatformsList);
  const followerGrowth = calculateFollowerGrowth(accountEntries, selectedPlatformsList, filterStartDate);
  const viewsData = calculateAccountViews(accountEntries, filterStartDate, undefined, selectedPlatformsList);
  const avgEngagement = calculateWeightedEngagementRate(
    viewsData.totalLikes,
    viewsData.totalComments,
    viewsData.totalShares,
    viewsData.totalViews
  );

  // Unique Materials Published vs Total Platform Uploads
  const uniqueMaterialsPublished = materials.filter((m) => {
    const statuses = Object.values(m.platformStatuses || {});
    return statuses.some((s) => s === 'published');
  }).length;
  const platformUploadsCompleted = schedules.filter((s) => s.status === 'published').length;

  // Upcoming uploads (next 3-5)
  const nowIso = new Date().toISOString();
  const upcomingUploads = schedules
    .filter((s) => s.status === 'scheduled')
    .sort((a, b) => a.plannedPublishAt.localeCompare(b.plannedPublishAt))
    .slice(0, 4);

  // Overdue uploads
  const overdueUploads = schedules.filter(
    (s) => s.status === 'overdue' || (s.status === 'scheduled' && s.plannedPublishAt < nowIso)
  );

  // Pending checkpoints: videos published > 24 hours ago that have no 24h or 48h checkpoint
  const publishedSchedules = schedules.filter((s) => s.status === 'published');
  const missingCheckpointsCount = publishedSchedules.filter((s) => {
    const hasCp = checkpoints.some(
      (c) => c.materialId === s.materialId && c.platform === s.platform
    );
    return !hasCp;
  }).length;

  const consistency = calculatePublishingConsistency(schedules, nowIso);

  // Helper to format date in user timezone
  const formatDateLocal = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: preferences.timezone || 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: preferences.timeFormat === '12h',
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 16);
    }
  };

  // Build chart points from account entries
  const chartDates = Array.from(
    new Set(
      accountEntries
        .filter((e) => !filterStartDate || e.reportingDate >= filterStartDate)
        .filter((e) => selectedPlatformFilter === 'all' || e.platform === selectedPlatformFilter)
        .map((e) => e.reportingDate)
    )
  ).sort();

  const maxViewsValue = Math.max(
    ...chartDates.map((date) => {
      const dayEntries = accountEntries.filter(
        (e) =>
          e.reportingDate === date &&
          (selectedPlatformFilter === 'all' || e.platform === selectedPlatformFilter)
      );
      return dayEntries.reduce((acc, curr) => acc + curr.dailyViews, 0);
    }),
    1000
  );

  const isCompletelyEmpty = materials.length === 0 && accountEntries.length === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 5.1 Welcome & Operational Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl command-card border border-[var(--panel-border)]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Welcome back, Commander
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              COMMAND ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-light)]" />
            <span>Timezone: <strong className="text-[var(--text-primary)] font-mono">{preferences.timezone}</strong></span>
            <span>•</span>
            <span>Reporting Period: <strong className="text-[var(--text-primary)]">{selectedRange.toUpperCase()}</strong></span>
          </p>
        </div>

        {/* Global Range & Platform Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range selector */}
          <div className="flex items-center bg-[var(--elevated)] p-1 rounded-lg border border-[var(--panel-border)]">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                  selectedRange === r
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Platform filter */}
          <select
            value={selectedPlatformFilter}
            onChange={(e) => setSelectedPlatformFilter(e.target.value as any)}
            className="bg-[var(--elevated)] border border-[var(--panel-border)] text-xs font-medium text-[var(--text-primary)] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[var(--accent)]"
            aria-label="Filter overview by platform"
          >
            <option value="all">All 4 Platforms</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram_reels">Instagram Reels</option>
            <option value="facebook_reels">Facebook Reels</option>
          </select>
        </div>
      </div>

      {/* Zero-Data Initial Onboarding Banner */}
      {isCompletelyEmpty && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-950/40 via-[var(--panel-bg)] to-purple-950/30 border border-[var(--accent)]/30 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-light)] font-bold">
                Workspace Ready & Clean
              </span>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Start by adding your own short-form content
              </h2>
              <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                No sample data has been pre-injected. The command center is waiting for your real scripts, descriptions, and manual platform analytics from YouTube Shorts, TikTok, Instagram Reels, and Facebook Reels.
              </p>
            </div>
            <Sparkles className="w-6 h-6 text-[var(--accent-light)] shrink-0 hidden sm:block" />
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => onOpenQuickAction('add_material')}
              className="command-btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Material (MAT-001)</span>
            </button>
            <button
              onClick={() => onNavigate('analytics')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--elevated)] border border-[var(--panel-border)] text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-all flex items-center gap-1.5"
            >
              <BarChart2 className="w-4 h-4 text-[var(--accent-light)]" />
              <span>Enter All-Time Stats or Daily Insights</span>
            </button>
          </div>
        </div>
      )}

      {/* Overdue Alert Banner if applicable */}
      {overdueUploads.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold">{overdueUploads.length} scheduled upload(s) are overdue!</span>
              <p className="text-amber-200/80 text-xs">
                Scheduled publish times have passed. Update actual publication timestamps or reschedule.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('calendar')}
            className="px-3 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-300 transition-colors shrink-0"
          >
            Resolve in Calendar
          </button>
        </div>
      )}

      {/* 5.2 Four Primary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Combined Account Views */}
        <div className="p-5 rounded-xl command-card hover:border-[var(--accent)]/40 transition-all space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-semibold tracking-wide uppercase text-[11px]">
              {viewsData.isAllTime ? 'Combined All-Time Views' : 'Combined Views'}
            </span>
            <Eye className="w-4 h-4 text-[var(--accent-light)]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
            {viewsData.totalViews.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[var(--text-muted)]">
              {viewsData.isAllTime ? 'Lifetime Channel Stats' : `Period (${selectedRange.toUpperCase()}) Activity`}
            </span>
            <span className="text-emerald-400 font-mono font-medium">
              {viewsData.entriesCount} entries
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] border-t border-[var(--panel-border)] pt-1.5 leading-tight">
            {viewsData.isAllTime
              ? 'Lifetime views from all-time channel stats and daily aggregates across platforms.'
              : 'Account views recorded for the selected window. Separated from video checkpoint views.'}
          </p>
        </div>

        {/* Card 2: Combined Audience Total */}
        <div className="p-5 rounded-xl command-card hover:border-[var(--accent)]/40 transition-all space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-semibold tracking-wide uppercase text-[11px]">Combined Audience</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--accent-light)]">
            {followersData.total.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[var(--text-muted)]">Period Growth</span>
            <span
              className={`font-mono font-bold ${
                followerGrowth.netGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {followerGrowth.netGrowth >= 0 ? `+${followerGrowth.netGrowth.toLocaleString()}` : followerGrowth.netGrowth}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] border-t border-[var(--panel-border)] pt-1.5 leading-tight">
            Sum of latest follower snapshots. Combined platform reach, not unique individuals.
          </p>
        </div>

        {/* Card 3: Published Videos vs Platform Uploads */}
        <div className="p-5 rounded-xl command-card hover:border-[var(--accent)]/40 transition-all space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-semibold tracking-wide uppercase text-[11px]">Content Production</span>
            <Video className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
            {uniqueMaterialsPublished}{' '}
            <span className="text-sm font-normal text-[var(--text-muted)]">unique</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[var(--text-muted)]">Platform Uploads</span>
            <span className="text-[var(--accent-light)] font-mono font-bold">
              {platformUploadsCompleted} uploads
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] border-t border-[var(--panel-border)] pt-1.5 leading-tight">
            1 video across 4 platforms = 1 unique video and 4 platform uploads.
          </p>
        </div>

        {/* Card 4: Weighted Engagement Rate */}
        <div className="p-5 rounded-xl command-card hover:border-[var(--accent)]/40 transition-all space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-semibold tracking-wide uppercase text-[11px]">Avg Engagement</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            {avgEngagement}%
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[var(--text-muted)]">Formula</span>
            <span className="text-[11px] font-mono text-[var(--accent-light)]">((L+C+S)/V)*100</span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] border-t border-[var(--panel-border)] pt-1.5 leading-tight">
            Weighted interaction rate across comparable views. Never averages raw percentages.
          </p>
        </div>
      </div>

      {/* 5.3 Performance Chart & 5.6 Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl arctic-glass space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--accent)]/15 pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[var(--accent-light)]" />
                Daily Account Performance Trend
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Chronological daily metrics from manual account insights
              </p>
            </div>
            <div className="flex items-center space-x-1 bg-[var(--elevated)] p-1 rounded-lg border border-[var(--panel-border)]">
              <button
                onClick={() => setChartMetric('views')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  chartMetric === 'views' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)]'
                }`}
              >
                Views
              </button>
              <button
                onClick={() => setChartMetric('engagement')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  chartMetric === 'engagement' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)]'
                }`}
              >
                Interactions
              </button>
            </div>
          </div>

          {/* SVG / Bar Chart Representation */}
          {chartDates.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No account analytics recorded for this date range. Click "Quick Action" to log today's metrics.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-52 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-[var(--panel-border)]">
                {chartDates.map((date) => {
                  const dayEntries = accountEntries.filter(
                    (e) =>
                      e.reportingDate === date &&
                      (selectedPlatformFilter === 'all' || e.platform === selectedPlatformFilter)
                  );
                  const dayViews = dayEntries.reduce((acc, curr) => acc + curr.dailyViews, 0);
                  const dayInteractions = dayEntries.reduce(
                    (acc, curr) => acc + curr.dailyLikes + curr.dailyComments + curr.dailyShares,
                    0
                  );
                  const val = chartMetric === 'views' ? dayViews : dayInteractions;
                  const heightPercent = Math.min(100, Math.max(8, (val / maxViewsValue) * 100));

                  return (
                    <div
                      key={date}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--panel-bg)] border border-[var(--accent)]/40 text-[var(--text-primary)] px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap z-20 pointer-events-none shadow-lg">
                        {date}: {val.toLocaleString()} {chartMetric}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t transition-all group-hover:brightness-125 ${
                          chartMetric === 'views'
                            ? 'bg-gradient-to-t from-indigo-700 to-indigo-500'
                            : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        }`}
                      />
                      <span className="text-[9px] text-[var(--text-muted)] mt-2 font-mono truncate max-w-full">
                        {date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-2">
                <span>Earliest: {chartDates[0]}</span>
                <span>Latest: {chartDates[chartDates.length - 1]}</span>
              </div>
            </div>
          )}
        </div>

        {/* 5.6 Pending Operational Tasks */}
        <div className="p-5 rounded-xl command-card space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-light)]" />
              Pending Creator Tasks
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {tasks.filter((t) => !t.completed).length} incomplete
            </span>
          </div>

          <div className="space-y-2">
            {/* System warnings for missing analytics */}
            {missingCheckpointsCount > 0 && (
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{missingCheckpointsCount} Missing Video Checkpoints</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Log 24h/48h checkpoint metrics to avoid permanent gaps.
                  </p>
                </div>
              </div>
            )}

            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center space-x-2.5 ${
                  task.completed
                    ? 'bg-[var(--elevated)]/40 border-[var(--panel-border)] text-[var(--text-muted)] line-through'
                    : 'bg-[var(--elevated)] border-[var(--panel-border)] text-[var(--text-primary)] hover:border-[var(--accent)]/50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    task.completed
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'border-[var(--panel-border)]'
                  }`}
                >
                  {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate font-medium">{task.title}</p>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Due: {task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('goals')}
            className="w-full py-1.5 text-center text-xs text-[var(--accent-light)] hover:text-white font-medium border-t border-[var(--panel-border)] pt-2 flex items-center justify-center gap-1"
          >
            <span>View All Productivity & Goals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5.4 Platform Overview Panels */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent-light)]" />
            Platform Operational Status & Data Freshness
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            Independent metrics per platform definition
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'] as Platform[]).map(
            (plat) => {
              const cfg = PLATFORM_CONFIG[plat];
              const pCount = followersData.platformCounts[plat] || 0;
              const pViews = viewsData.byPlatform[plat]?.views || 0;
              const pLikes = viewsData.byPlatform[plat]?.likes || 0;
              const pComments = viewsData.byPlatform[plat]?.comments || 0;
              const pShares = viewsData.byPlatform[plat]?.shares || 0;
              const pGrowth = followerGrowth.byPlatform[plat] || 0;
              const eng = calculateWeightedEngagementRate(pLikes, pComments, pShares, pViews);
              const latestDate = followersData.latestDates[plat];

              return (
                <div
                  key={plat}
                  onClick={() => onNavigate('analytics', { platform: plat })}
                  className="p-4 rounded-xl command-card hover:border-[var(--accent)]/50 cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{cfg.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-[var(--panel-border)]"
                      style={{ backgroundColor: cfg.brandColor }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-[var(--text-muted)]">Audience:</span>
                      <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                        {pCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-[var(--text-muted)]">Period Views:</span>
                      <span className="text-sm font-mono font-bold text-[var(--accent-light)]">
                        {pViews.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-[var(--text-muted)]">Engagement:</span>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">{eng}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--panel-border)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Freshness:</span>
                    <span className="font-mono text-[var(--text-secondary)]">
                      {latestDate ? latestDate : 'No entries'}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* 5.5 Upcoming Uploads & 5.8 Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Uploads */}
        <div className="lg:col-span-2 p-5 rounded-xl command-card space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[var(--accent-light)]" />
              Next Scheduled Platform Uploads
            </h2>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs text-[var(--accent-light)] hover:text-white font-medium flex items-center gap-1"
            >
              <span>Full Calendar</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingUploads.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No upcoming scheduled uploads. Go to the Material Hub or Calendar to schedule content.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingUploads.map((sch) => {
                const material = materials.find((m) => m.id === sch.materialId);
                const cfg = PLATFORM_CONFIG[sch.platform];
                return (
                  <div
                    key={sch.id}
                    className="p-3 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-[var(--accent-light)]">
                          {sch.materialId}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {material?.title || 'Untitled Material'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cfg.brandColor }}
                          />
                          {cfg.name}
                        </span>
                        <span>•</span>
                        <span>{formatDateLocal(sch.plannedPublishAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        SCHEDULED
                      </span>
                      <button
                        onClick={() => onNavigate('calendar')}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-light)]"
                        title="View in Calendar"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5.8 Operational Quick Actions */}
        <div className="p-5 rounded-xl command-card space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--panel-border)] pb-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-light)]" />
            Operational Quick Actions
          </h2>

          <div className="space-y-2">
            <button
              onClick={() => onOpenQuickAction('add_material')}
              className="w-full p-2.5 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all text-left flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]"
            >
              <span>+ Create New Material</span>
              <span className="text-[10px] font-mono text-[var(--accent-light)]">Auto MAT-ID</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('account_analytics')}
              className="w-full p-2.5 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all text-left flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]"
            >
              <span>Enter Daily Account Insights</span>
              <span className="text-[10px] font-mono text-emerald-400">Snapshot</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('video_insights')}
              className="w-full p-2.5 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all text-left flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]"
            >
              <span>Enter Video Checkpoint (24h/48h)</span>
              <span className="text-[10px] font-mono text-[var(--accent-light)]">Cumulative</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('schedule_video')}
              className="w-full p-2.5 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all text-left flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]"
            >
              <span>Schedule Platform Upload</span>
              <span className="text-[10px] font-mono text-indigo-300">Reminders</span>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="w-full p-2.5 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all text-left flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]"
            >
              <span>Generate Executive Report</span>
              <span className="text-[10px] font-mono text-amber-300">PDF / XLSX</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
