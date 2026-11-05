import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  PieChart,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  AccountAnalyticsEntry,
  Material,
  Platform,
  PLATFORM_CONFIG,
  PublishingSchedule,
  SavedReport,
  VideoAnalyticsCheckpoint,
} from '../types/index';
import {
  calculateAccountViews,
  calculateCombinedFollowerTotal,
  calculateFollowerGrowth,
  calculatePublishingConsistency,
  calculateWeightedEngagementRate,
  formatPlatformName,
  generateAutomatedInsights,
} from '../lib/calculations';
import { exportToCsv, exportToExcelWorkbook, exportToJson, generatePdfReport } from '../lib/export';

interface ReportsViewProps {
  materials: Material[];
  accountEntries: AccountAnalyticsEntry[];
  checkpoints: VideoAnalyticsCheckpoint[];
  schedules: PublishingSchedule[];
  savedReports: SavedReport[];
  onSaveReport: (report: SavedReport) => void;
  onDeleteReport: (id: string) => void;
  onNavigateToMaterial: (materialId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  materials,
  accountEntries,
  checkpoints,
  schedules,
  savedReports,
  onSaveReport,
  onDeleteReport,
  onNavigateToMaterial,
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Generate date range
  const now = new Date();
  const getPeriodDates = () => {
    if (reportType === 'weekly') {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
    }
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
  };

  const period = getPeriodDates();

  // Metrics for current report
  const followersData = calculateCombinedFollowerTotal(accountEntries);
  const viewsData = calculateAccountViews(accountEntries, period.start, period.end);
  const followerGrowth = calculateFollowerGrowth(accountEntries, undefined, period.start, period.end);
  const consistency = calculatePublishingConsistency(schedules);
  const insights = generateAutomatedInsights({
    accountEntries,
    checkpoints,
    schedules,
    materialsCount: materials.length,
  });

  const avgEngagementRate = calculateWeightedEngagementRate(
    viewsData.totalLikes,
    viewsData.totalComments,
    viewsData.totalShares,
    viewsData.totalViews
  );

  // Best video from checkpoints
  const bestVideoCheckpoint = [...checkpoints].sort((a, b) => b.cumulativeViews - a.cumulativeViews)[0];
  const bestMaterial = bestVideoCheckpoint
    ? materials.find((m) => m.id === bestVideoCheckpoint.materialId)
    : null;

  const handleSaveCurrentReport = () => {
    const report: SavedReport = {
      id: `rep_${Date.now()}`,
      title: `${reportType.toUpperCase()} Intelligence Report (${period.start} to ${period.end})`,
      reportType,
      dateRange: period,
      platform: selectedPlatform === 'all' ? undefined : selectedPlatform,
      generatedAt: new Date().toISOString(),
      metricsSummary: {
        accountViews: viewsData.totalViews,
        followerGrowth: followerGrowth.netGrowth,
        publishedVideos: materials.length,
        avgEngagementRate,
      },
      observations: insights.keyFindings,
      sourceRecordsCount: accountEntries.length + checkpoints.length + schedules.length,
      lastSourceUpdated: new Date().toISOString(),
    };
    onSaveReport(report);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl arctic-glass">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[var(--accent-light)]" />
            Reports & Performance Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Audited creator performance summaries, rule-based intelligence, and export studio
          </p>
        </div>

        {/* Report Period Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[var(--elevated)] p-1 rounded-lg border border-[var(--accent)]/20">
            <button
              onClick={() => setReportType('weekly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded ${
                reportType === 'weekly' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
              }`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded ${
                reportType === 'monthly' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
              }`}
            >
              Monthly Report
            </button>
          </div>

          <button
            onClick={handleSaveCurrentReport}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--elevated-hover)] border border-[var(--accent)]/30 text-[var(--accent-light)] text-xs font-semibold hover:bg-[var(--accent)] hover:text-[#080D14] transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save Snapshot</span>
          </button>
        </div>
      </div>

      {/* 9.7 Export & Download Center Banner */}
      <div className="p-5 rounded-xl arctic-glass border border-[var(--accent)]/30 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--accent-light)]" />
            Export & Download Center
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            Download verified operational datasets in multiple formats
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* PDF Report */}
          <button
            onClick={() => generatePdfReport(`${reportType.toUpperCase()} Creator Report`)}
            className="p-3 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <FileText className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-200">PDF Report</span>
            <span className="text-[10px] text-[var(--text-muted)]">Executive summary</span>
          </button>

          {/* Excel Workbook */}
          <button
            onClick={() => exportToExcelWorkbook()}
            className="p-3 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-200">Excel (.xlsx)</span>
            <span className="text-[10px] text-[var(--text-muted)]">Multi-sheet workbook</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={() => exportToCsv('account')}
            className="p-3 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <Download className="w-5 h-5 text-[var(--accent-light)] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-200">CSV Export</span>
            <span className="text-[10px] text-[var(--text-muted)]">Raw account logs</span>
          </button>

          {/* JSON Full Backup */}
          <button
            onClick={() => exportToJson()}
            className="p-3 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 hover:border-[var(--accent)] hover:bg-[var(--elevated-hover)] transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <Sparkles className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-200">JSON Data</span>
            <span className="text-[10px] text-[var(--text-muted)]">Complete export</span>
          </button>
        </div>
      </div>

      {/* 9.2 Weekly / Monthly Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl arctic-glass space-y-1">
          <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Account Views ({period.start} to {period.end})</span>
          <p className="text-2xl font-mono font-bold text-slate-100">{viewsData.totalViews.toLocaleString()}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Daily account totals summed</p>
        </div>

        <div className="p-4 rounded-xl arctic-glass space-y-1">
          <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Follower Growth</span>
          <p className="text-2xl font-mono font-bold text-emerald-400">
            {followerGrowth.netGrowth >= 0 ? `+${followerGrowth.netGrowth.toLocaleString()}` : followerGrowth.netGrowth}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Snapshot delta over period</p>
        </div>

        <div className="p-4 rounded-xl arctic-glass space-y-1">
          <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Weighted Engagement</span>
          <p className="text-2xl font-mono font-bold text-[var(--accent-light)]">{avgEngagementRate}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">Formula: ((L+C+S)/V)*100</p>
        </div>

        <div className="p-4 rounded-xl arctic-glass space-y-1">
          <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Schedule Consistency</span>
          <p className="text-2xl font-mono font-bold text-indigo-200">{consistency.onTimePercentage}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">Current streak: {consistency.currentStreakDays} days</p>
        </div>
      </div>

      {/* 9.4 Platform Comparison & 9.5 Best Video Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Ranking Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-xl arctic-glass space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--accent)]/15 pb-2">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent-light)]" />
              Platform Objective Comparison
            </h2>
            <span className="text-[11px] text-[var(--text-muted)]">
              No single "winner" declared based purely on views
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--panel-border)]">
                <tr>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Audience Snapshot</th>
                  <th className="py-2.5 px-3">Views Logged</th>
                  <th className="py-2.5 px-3">Growth</th>
                  <th className="py-2.5 px-3">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)] text-slate-200">
                {(['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'] as Platform[]).map(
                  (plat) => {
                    const cfg = PLATFORM_CONFIG[plat];
                    const aud = followersData.platformCounts[plat] || 0;
                    const pViews = viewsData.byPlatform[plat]?.views || 0;
                    const pGrowth = followerGrowth.byPlatform[plat] || 0;
                    const pLikes = viewsData.byPlatform[plat]?.likes || 0;
                    const pComments = viewsData.byPlatform[plat]?.comments || 0;
                    const pShares = viewsData.byPlatform[plat]?.shares || 0;
                    const eng = calculateWeightedEngagementRate(pLikes, pComments, pShares, pViews);

                    return (
                      <tr key={plat} className="hover:bg-[var(--elevated-hover)]/40">
                        <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cfg.brandColor }}
                          />
                          {cfg.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{aud.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent-light)]">
                          {pViews.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">
                          {pGrowth >= 0 ? `+${pGrowth}` : pGrowth}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300 font-semibold">{eng}%</td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 9.5 Best Performing Video Highlight */}
        <div className="p-5 rounded-xl arctic-glass space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--accent)]/15 pb-2">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Video by Views
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Cumulative</span>
          </div>

          {bestMaterial && bestVideoCheckpoint ? (
            <div className="space-y-3">
              <div>
                <span className="font-mono text-xs font-bold text-[var(--accent-light)] px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent)]/30">
                  {bestMaterial.id}
                </span>
                <h3 className="text-sm font-bold text-slate-100 mt-1.5">{bestMaterial.title}</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Category: {bestMaterial.category}</p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Top Checkpoint:</span>
                  <span className="font-mono text-slate-200 uppercase">{bestVideoCheckpoint.checkpoint}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Cumulative Views:</span>
                  <span className="font-mono font-bold text-[var(--accent-light)]">
                    {bestVideoCheckpoint.cumulativeViews.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Completion Rate:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {bestVideoCheckpoint.completionRate ? `${bestVideoCheckpoint.completionRate}%` : '—'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateToMaterial(bestMaterial.id)}
                className="w-full py-1.5 rounded-lg bg-[var(--elevated-hover)] text-xs font-semibold text-[var(--accent-light)] hover:text-indigo-200 border border-[var(--accent)]/30"
              >
                Inspect in Material Hub
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No video checkpoints recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* 9.6 Automated Rule-Based Insights */}
      <div className="p-5 rounded-xl arctic-glass space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--accent)]/15 pb-2">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-light)]" />
            Automated Intelligence Findings
          </h2>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Verified Rule Logic (No AI Hallucinations)
          </span>
        </div>

        <div className="space-y-2">
          {insights.keyFindings.map((finding, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 text-xs text-slate-200 flex items-start gap-2.5"
            >
              <CheckCircle className="w-4 h-4 text-[var(--accent-light)] shrink-0 mt-0.5" />
              <span>{finding}</span>
            </div>
          ))}

          {insights.recommendations.map((rec, idx) => (
            <div
              key={`rec-${idx}`}
              className="p-3 rounded-lg bg-[var(--elevated)] border border-cyan-500/20 text-xs text-indigo-200 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Recommended Next Step: {rec}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--panel-border)] italic">
          {insights.dataCoverageNote}
        </p>
      </div>

      {/* Saved Reports History */}
      {savedReports.length > 0 && (
        <div className="arctic-glass rounded-xl overflow-hidden border border-[var(--accent)]/15">
          <div className="p-3.5 bg-[var(--elevated)] border-b border-[var(--panel-border)] font-semibold text-xs text-slate-200 flex items-center justify-between">
            <span>Saved Executive Reports Archive</span>
            <span className="text-[11px] text-[var(--text-muted)]">{savedReports.length} snapshots saved</span>
          </div>
          <div className="divide-y divide-[var(--panel-border)] text-xs">
            {savedReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--elevated-hover)]/30"
              >
                <div>
                  <h4 className="font-bold text-slate-100">{rep.title}</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Generated {new Date(rep.generatedAt).toLocaleString()} • {rep.sourceRecordsCount} underlying source records
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => generatePdfReport(rep.title)}
                    className="px-2.5 py-1 rounded bg-[var(--elevated)] border border-[var(--accent)]/30 text-xs text-[var(--accent-light)] hover:bg-[var(--accent)] hover:text-[#080D14]"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => onDeleteReport(rep.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-400"
                    title="Delete Saved Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
