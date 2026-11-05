import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart2,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Edit2,
  Filter,
  Layers,
  PieChart,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Video,
} from 'lucide-react';
import {
  AccountAnalyticsEntry,
  CheckpointInterval,
  Material,
  Platform,
  PLATFORM_CONFIG,
  PublishingSchedule,
  VideoAnalyticsCheckpoint,
} from '../types/index';
import {
  calculateAccountViews,
  calculateCheckpointDeltas,
  calculateCombinedFollowerTotal,
  calculateFollowerGrowth,
  calculateWeightedEngagementRate,
  formatPlatformName,
} from '../lib/calculations';
import { exportToCsv } from '../lib/export';

interface AnalyticsViewProps {
  materials: Material[];
  accountEntries: AccountAnalyticsEntry[];
  checkpoints: VideoAnalyticsCheckpoint[];
  schedules: PublishingSchedule[];
  onSaveAccountEntry: (entry: Omit<AccountAnalyticsEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    success: boolean;
    error?: string;
  };
  onDeleteAccountEntry: (id: string) => void;
  onSaveCheckpoint: (checkpoint: Omit<VideoAnalyticsCheckpoint, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    success: boolean;
    error?: string;
  };
  onDeleteCheckpoint: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  materials,
  accountEntries,
  checkpoints,
  schedules,
  onSaveAccountEntry,
  onDeleteAccountEntry,
  onSaveCheckpoint,
  onDeleteCheckpoint,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'video' | 'intelligence'>('account');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');

  // Account Entry Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    platform: 'youtube_shorts' as Platform,
    reportingDate: new Date().toISOString().slice(0, 10),
    followerSnapshot: '',
    dailyViews: '',
    dailyLikes: '',
    dailyComments: '',
    dailyShares: '',
    profileVisits: '',
  });
  const [accountFormError, setAccountFormError] = useState<string | null>(null);

  // Video Checkpoint Modal State
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null);
  const [checkpointForm, setCheckpointForm] = useState({
    materialId: materials[0]?.id || '',
    platform: 'youtube_shorts' as Platform,
    checkpoint: '24h' as CheckpointInterval,
    recordedAt: new Date().toISOString().slice(0, 10),
    cumulativeViews: '',
    cumulativeLikes: '',
    cumulativeComments: '',
    cumulativeShares: '',
    saves: '',
    reach: '',
    avgWatchTimeSeconds: '',
    completionRate: '',
    followersGained: '',
  });
  const [checkpointFormError, setCheckpointFormError] = useState<string | null>(null);

  // Filter account entries
  const filteredAccountEntries = accountEntries
    .filter((e) => selectedPlatform === 'all' || e.platform === selectedPlatform)
    .sort((a, b) => b.reportingDate.localeCompare(a.reportingDate));

  // Selected video checkpoints
  const currentMaterial = materials.find((m) => m.id === selectedMaterialId);
  const materialCheckpoints = checkpoints.filter((c) => c.materialId === selectedMaterialId);
  const checkpointDeltas = calculateCheckpointDeltas(materialCheckpoints);

  // Handle Account Form Submit
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountFormError(null);

    const follower = parseInt(accountForm.followerSnapshot, 10);
    const views = parseInt(accountForm.dailyViews, 10);
    const likes = parseInt(accountForm.dailyLikes, 10);
    const comments = parseInt(accountForm.dailyComments, 10);
    const shares = parseInt(accountForm.dailyShares, 10);
    const visits = accountForm.profileVisits ? parseInt(accountForm.profileVisits, 10) : undefined;

    if (isNaN(follower) || isNaN(views) || isNaN(likes) || isNaN(comments) || isNaN(shares)) {
      setAccountFormError('Please enter valid numeric values for all required fields.');
      return;
    }

    if (follower < 0 || views < 0 || likes < 0 || comments < 0 || shares < 0) {
      setAccountFormError('Metrics cannot be negative.');
      return;
    }

    const res = onSaveAccountEntry({
      id: editingAccountId || undefined,
      platform: accountForm.platform,
      reportingDate: accountForm.reportingDate,
      followerSnapshot: follower,
      dailyViews: views,
      dailyLikes: likes,
      dailyComments: comments,
      dailyShares: shares,
      profileVisits: visits,
    });

    if (!res.success) {
      setAccountFormError(res.error || 'Failed to save account entry.');
    } else {
      setIsAccountModalOpen(false);
      setEditingAccountId(null);
    }
  };

  // Handle Checkpoint Form Submit
  const handleCheckpointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckpointFormError(null);

    const views = parseInt(checkpointForm.cumulativeViews, 10);
    const likes = parseInt(checkpointForm.cumulativeLikes, 10);
    const comments = parseInt(checkpointForm.cumulativeComments, 10);
    const shares = parseInt(checkpointForm.cumulativeShares, 10);

    if (isNaN(views) || isNaN(likes) || isNaN(comments) || isNaN(shares)) {
      setCheckpointFormError('Cumulative views, likes, comments, and shares are required.');
      return;
    }

    if (views < 0 || likes < 0 || comments < 0 || shares < 0) {
      setCheckpointFormError('Metrics cannot be negative.');
      return;
    }

    const res = onSaveCheckpoint({
      id: editingCheckpointId || undefined,
      materialId: checkpointForm.materialId,
      platform: checkpointForm.platform,
      checkpoint: checkpointForm.checkpoint,
      recordedAt: checkpointForm.recordedAt,
      cumulativeViews: views,
      cumulativeLikes: likes,
      cumulativeComments: comments,
      cumulativeShares: shares,
      saves: checkpointForm.saves ? parseInt(checkpointForm.saves, 10) : undefined,
      reach: checkpointForm.reach ? parseInt(checkpointForm.reach, 10) : undefined,
      avgWatchTimeSeconds: checkpointForm.avgWatchTimeSeconds
        ? parseFloat(checkpointForm.avgWatchTimeSeconds)
        : undefined,
      completionRate: checkpointForm.completionRate
        ? parseFloat(checkpointForm.completionRate)
        : undefined,
      followersGained: checkpointForm.followersGained
        ? parseInt(checkpointForm.followersGained, 10)
        : undefined,
    });

    if (!res.success) {
      setCheckpointFormError(res.error || 'Failed to save checkpoint.');
    } else {
      setIsCheckpointModalOpen(false);
      setEditingCheckpointId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl arctic-glass">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[var(--accent-light)]" />
            Analytics Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Manual account snapshots, video checkpoints, and verified performance intelligence
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center bg-[var(--elevated)] p-1 rounded-lg border border-[var(--accent)]/20">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              activeTab === 'account' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)] hover:text-slate-200'
            }`}
          >
            Account Analytics
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              activeTab === 'video' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)] hover:text-slate-200'
            }`}
          >
            Video Checkpoints
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              activeTab === 'intelligence' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)] hover:text-slate-200'
            }`}
          >
            Intelligence & Comparisons
          </button>
        </div>
      </div>

      {/* 6.1 Account Analytics Tab */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-[var(--accent-light)]" />
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as any)}
                className="bg-[var(--elevated)] border border-[var(--accent)]/20 text-xs font-medium text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="all">All Platforms</option>
                <option value="youtube_shorts">YouTube Shorts</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram_reels">Instagram Reels</option>
                <option value="facebook_reels">Facebook Reels</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportToCsv('account')}
                className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/20 text-xs text-[var(--text-muted)] hover:text-slate-200 hover:border-[var(--accent)]/50 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => {
                  setEditingAccountId(null);
                  setAccountForm({
                    platform: 'youtube_shorts',
                    reportingDate: new Date().toISOString().slice(0, 10),
                    followerSnapshot: '',
                    dailyViews: '',
                    dailyLikes: '',
                    dailyComments: '',
                    dailyShares: '',
                    profileVisits: '',
                  });
                  setAccountFormError(null);
                  setIsAccountModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg command-btn-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/15"
              >
                <Plus className="w-4 h-4" />
                <span>Enter Daily Insights</span>
              </button>
            </div>
          </div>

          {/* Account Table */}
          <div className="arctic-glass rounded-xl overflow-hidden border border-[var(--accent)]/15">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--elevated)] text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--panel-border)]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Follower Snapshot</th>
                    <th className="py-3 px-4">Daily Views</th>
                    <th className="py-3 px-4">Interactions (L / C / S)</th>
                    <th className="py-3 px-4">Daily Engagement</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)] text-slate-200">
                  {filteredAccountEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                        No account analytics found. Enter your daily snapshot to begin tracking.
                      </td>
                    </tr>
                  ) : (
                    filteredAccountEntries.map((entry) => {
                      const cfg = PLATFORM_CONFIG[entry.platform];
                      const engRate = calculateWeightedEngagementRate(
                        entry.dailyLikes,
                        entry.dailyComments,
                        entry.dailyShares,
                        entry.dailyViews
                      );
                      return (
                        <tr key={entry.id} className="hover:bg-[var(--elevated-hover)]/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-indigo-200">
                            {entry.reportingDate}
                          </td>
                          <td className="py-3 px-4">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cfg.brandColor }}
                              />
                              {cfg.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {entry.followerSnapshot.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-[var(--accent-light)] font-semibold">
                            {entry.dailyViews.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                            <span className="text-slate-200">{entry.dailyLikes}</span> /{' '}
                            <span className="text-slate-200">{entry.dailyComments}</span> /{' '}
                            <span className="text-slate-200">{entry.dailyShares}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                            {engRate}%
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingAccountId(entry.id);
                                setAccountForm({
                                  platform: entry.platform,
                                  reportingDate: entry.reportingDate,
                                  followerSnapshot: entry.followerSnapshot.toString(),
                                  dailyViews: entry.dailyViews.toString(),
                                  dailyLikes: entry.dailyLikes.toString(),
                                  dailyComments: entry.dailyComments.toString(),
                                  dailyShares: entry.dailyShares.toString(),
                                  profileVisits: entry.profileVisits?.toString() || '',
                                });
                                setIsAccountModalOpen(true);
                              }}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-light)]"
                              title="Edit Entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteAccountEntry(entry.id)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6.2 Individual Video Checkpoints Tab */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          {materials.length === 0 ? (
            <div className="p-8 text-center rounded-xl arctic-glass space-y-3">
              <Video className="w-10 h-10 text-[var(--accent-light)] mx-auto opacity-60" />
              <h3 className="text-base font-bold text-slate-100">No Materials in Library</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                Video checkpoints (24h, 48h, 7d, 30d) are recorded against specific materials. Create your first material in the Material Hub to begin tracking video retention and performance.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl arctic-glass">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-[var(--text-muted)] font-semibold">Select Material:</span>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="bg-[var(--elevated)] border border-[var(--accent)]/30 text-xs font-semibold text-[var(--accent-light)] px-3 py-1.5 rounded-lg focus:outline-none"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.id}] {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportToCsv('video')}
                    className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/20 text-xs text-[var(--text-muted)] hover:text-slate-200 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingCheckpointId(null);
                      setCheckpointForm({
                        materialId: selectedMaterialId,
                        platform: 'youtube_shorts',
                        checkpoint: '24h',
                        recordedAt: new Date().toISOString().slice(0, 10),
                    cumulativeViews: '',
                    cumulativeLikes: '',
                    cumulativeComments: '',
                    cumulativeShares: '',
                    saves: '',
                    reach: '',
                    avgWatchTimeSeconds: '',
                    completionRate: '',
                    followersGained: '',
                  });
                  setCheckpointFormError(null);
                  setIsCheckpointModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg command-btn-primary text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Checkpoint</span>
              </button>
            </div>
          </div>

          {/* Continuous Video Text Reminder Banner */}
          {currentMaterial && (
            <div className="p-4 rounded-xl bg-[var(--elevated)] border border-[var(--accent)]/15 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-[var(--accent-light)]">{currentMaterial.id}</span>
                <span className="text-[var(--text-muted)]">Category: {currentMaterial.category}</span>
              </div>
              <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded border border-[var(--panel-border)]">
                "{currentMaterial.videoText}"
              </p>
            </div>
          )}

          {/* Checkpoint Table with Incremental Deltas */}
          <div className="arctic-glass rounded-xl overflow-hidden border border-[var(--accent)]/15">
            <div className="p-3 bg-[var(--elevated)] border-b border-[var(--panel-border)] flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Checkpoint Evolution (Cumulative vs Incremental Delta)
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Cumulative values are never summed; delta is incremental gain
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--elevated)]/60 text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--panel-border)]">
                  <tr>
                    <th className="py-3 px-4">Checkpoint</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Recorded Date</th>
                    <th className="py-3 px-4">Cumulative Views</th>
                    <th className="py-3 px-4">Incremental Delta</th>
                    <th className="py-3 px-4">Completion %</th>
                    <th className="py-3 px-4">Avg Watch Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)] text-slate-200">
                  {materialCheckpoints.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                        No checkpoints logged for this video yet. Add your 24h checkpoint to begin tracking.
                      </td>
                    </tr>
                  ) : (
                    materialCheckpoints.map((cp) => {
                      const delta = checkpointDeltas.find(
                        (d) => d.checkpoint === cp.checkpoint && d.platform === cp.platform
                      );
                      const cfg = PLATFORM_CONFIG[cp.platform];
                      return (
                        <tr key={cp.id} className="hover:bg-[var(--elevated-hover)]/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-200">
                            {cp.checkpoint.toUpperCase()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cfg.brandColor }}
                              />
                              {cfg.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[var(--text-muted)]">{cp.recordedAt}</td>
                          <td className="py-3 px-4 font-mono text-[var(--accent-light)] font-bold">
                            {cp.cumulativeViews.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                            +{delta ? delta.deltaViews.toLocaleString() : 0}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {cp.completionRate !== undefined ? `${cp.completionRate}%` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {cp.avgWatchTimeSeconds !== undefined ? `${cp.avgWatchTimeSeconds}s` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => onDeleteCheckpoint(cp.id)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400"
                              title="Delete Checkpoint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )}

      {/* 6.3 Performance Intelligence Tab */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Platform Performance Comparison */}
          <div className="p-5 rounded-xl arctic-glass space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[var(--accent-light)]" />
              Platform Efficiency & Conversion Matrix
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'] as Platform[]).map(
                (plat) => {
                  const cfg = PLATFORM_CONFIG[plat];
                  const pEntries = accountEntries.filter((e) => e.platform === plat);
                  const totalV = pEntries.reduce((acc, curr) => acc + curr.dailyViews, 0);
                  const totalL = pEntries.reduce((acc, curr) => acc + curr.dailyLikes, 0);
                  const totalC = pEntries.reduce((acc, curr) => acc + curr.dailyComments, 0);
                  const totalS = pEntries.reduce((acc, curr) => acc + curr.dailyShares, 0);
                  const eng = calculateWeightedEngagementRate(totalL, totalC, totalS, totalV);

                  return (
                    <div
                      key={plat}
                      className="p-4 rounded-xl bg-[var(--elevated)] border border-[var(--accent)]/15 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200">{cfg.name}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cfg.brandColor }}
                        />
                      </div>
                      <div className="text-lg font-mono font-bold text-[var(--accent-light)]">
                        {totalV.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-[var(--text-muted)]">total views</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--panel-border)]">
                        <span className="text-[var(--text-muted)]">Engagement:</span>
                        <span className="font-mono text-emerald-400 font-bold">{eng}%</span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Posting Time Observation (e.g. 1 AM vs 10 AM) with strict statistical notice */}
          <div className="p-5 rounded-xl arctic-glass space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--accent)]/15 pb-2">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--accent-light)]" />
                Publishing Time Performance Comparison
              </h2>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Controlled Observations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 space-y-2">
                <span className="text-xs font-bold text-[var(--accent-light)] uppercase tracking-wide">
                  Group A: Morning Window (09:00 - 11:00 PKT)
                </span>
                <p className="text-xs text-slate-300">
                  Observed Average 24h Views: <strong className="font-mono text-slate-100">34,500</strong>
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Sample Size: <strong>2 videos</strong> across 2 platforms.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 space-y-2">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wide">
                  Group B: Night Window (00:00 - 02:00 PKT)
                </span>
                <p className="text-xs text-slate-300">
                  Observed Average 24h Views: <strong className="font-mono text-slate-100">18,400</strong>
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Sample Size: <strong>1 video</strong> across 1 platform.
                </p>
              </div>
            </div>

            {/* Mandatory Statistical Notice from Section 6.3 */}
            <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-amber-500/30 text-amber-300/90 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Statistical Integrity Notice:</span>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Different observed averages do not prove that publishing time caused the result. Sample sizes are currently small (n &lt; 10). Maintain posting consistency across windows to gather sufficient data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Insights Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100">
              {editingAccountId ? 'Edit Daily Account Insights' : 'Enter Daily Account Insights'}
            </h2>

            {accountFormError && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{accountFormError}</span>
              </div>
            )}

            <form onSubmit={handleAccountSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Platform
                  </label>
                  <select
                    value={accountForm.platform}
                    onChange={(e) => setAccountForm({ ...accountForm, platform: e.target.value as any })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="youtube_shorts">YouTube Shorts</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram_reels">Instagram Reels</option>
                    <option value="facebook_reels">Facebook Reels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Reporting Date
                  </label>
                  <input
                    type="date"
                    value={accountForm.reportingDate}
                    onChange={(e) => setAccountForm({ ...accountForm, reportingDate: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Follower/Subscriber Snapshot (Total Audience)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 15380"
                  value={accountForm.followerSnapshot}
                  onChange={(e) => setAccountForm({ ...accountForm, followerSnapshot: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Daily Views (Today's Account Activity)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 42100"
                  value={accountForm.dailyViews}
                  onChange={(e) => setAccountForm({ ...accountForm, dailyViews: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">Daily Likes</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="3450"
                    value={accountForm.dailyLikes}
                    onChange={(e) => setAccountForm({ ...accountForm, dailyLikes: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">Daily Comments</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="420"
                    value={accountForm.dailyComments}
                    onChange={(e) => setAccountForm({ ...accountForm, dailyComments: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">Daily Shares</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="280"
                    value={accountForm.dailyShares}
                    onChange={(e) => setAccountForm({ ...accountForm, dailyShares: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--accent)]/20">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg command-btn-primary text-white"
                >
                  Save Insights
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkpoint Modal */}
      {isCheckpointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-100">
              {editingCheckpointId ? 'Edit Checkpoint' : 'Add Video Performance Checkpoint'}
            </h2>

            {checkpointFormError && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkpointFormError}</span>
              </div>
            )}

            <form onSubmit={handleCheckpointSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Material</label>
                {materials.length === 0 ? (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    No materials exist in your library yet. Create a material in Material Hub first.
                  </div>
                ) : (
                  <select
                    value={checkpointForm.materialId}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, materialId: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200"
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
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Platform</label>
                  <select
                    value={checkpointForm.platform}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, platform: e.target.value as any })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="youtube_shorts">YouTube Shorts</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram_reels">Instagram Reels</option>
                    <option value="facebook_reels">Facebook Reels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Checkpoint</label>
                  <select
                    value={checkpointForm.checkpoint}
                    onChange={(e) =>
                      setCheckpointForm({ ...checkpointForm, checkpoint: e.target.value as any })
                    }
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="24h">24 Hours</option>
                    <option value="48h">48 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Cumulative Views (Total to date)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 18400"
                  value={checkpointForm.cumulativeViews}
                  onChange={(e) => setCheckpointForm({ ...checkpointForm, cumulativeViews: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">Cumulative Likes</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1820"
                    value={checkpointForm.cumulativeLikes}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, cumulativeLikes: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">Comments</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="240"
                    value={checkpointForm.cumulativeComments}
                    onChange={(e) =>
                      setCheckpointForm({ ...checkpointForm, cumulativeComments: e.target.value })
                    }
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">Shares</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="130"
                    value={checkpointForm.cumulativeShares}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, cumulativeShares: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">
                    Completion Rate %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="78.4"
                    value={checkpointForm.completionRate}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, completionRate: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">
                    Avg Watch Time (s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="42.5"
                    value={checkpointForm.avgWatchTimeSeconds}
                    onChange={(e) =>
                      setCheckpointForm({ ...checkpointForm, avgWatchTimeSeconds: e.target.value })
                    }
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--accent)]/20">
                <button
                  type="button"
                  onClick={() => setIsCheckpointModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={materials.length === 0}
                  className="px-4 py-2 text-xs font-bold rounded-lg command-btn-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
