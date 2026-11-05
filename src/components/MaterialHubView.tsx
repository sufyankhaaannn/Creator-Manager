import React, { useState } from 'react';
import {
  Archive,
  Check,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  Filter,
  FolderKanban,
  Grid,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  List,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Video,
} from 'lucide-react';
import {
  Material,
  OverallStatus,
  Platform,
  PLATFORM_CONFIG,
  PlatformStatus,
} from '../types/index';
import { calculateOverallMaterialStatus, formatPlatformName } from '../lib/calculations';

interface MaterialHubViewProps {
  materials: Material[];
  recentlyDeleted: Material[];
  onSaveMaterial: (material: Omit<Material, 'id' | 'numericId' | 'createdAt' | 'updatedAt'> & { id?: string }) => Material;
  onDuplicateMaterial: (id: string) => void;
  onSoftDeleteMaterial: (id: string) => void;
  onRestoreMaterial: (id: string) => void;
  onPermanentlyDeleteMaterial: (id: string) => void;
  onScheduleMaterial: (materialId: string) => void;
}

export const MaterialHubView: React.FC<MaterialHubViewProps> = ({
  materials,
  recentlyDeleted,
  onSaveMaterial,
  onDuplicateMaterial,
  onSoftDeleteMaterial,
  onRestoreMaterial,
  onPermanentlyDeleteMaterial,
  onScheduleMaterial,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'deleted'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated' | 'title'>('newest');

  // Detail / Edit modal state
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Material Form state
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    videoText: '',
    youtubeDescription: '',
    tiktokCaption: '',
    instagramDescription: '',
    facebookDescription: '',
    imageReferences: ['', '', '', '', ''],
    thumbnailPrompt: '',
    internalNotes: '',
    category: 'Ocean Mysteries',
    tags: '',
    targetPlatforms: ['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'] as Platform[],
  });

  const handleCopy = (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopyText(text);
        });
      } else {
        fallbackCopyText(text);
      }
    } catch {
      fallbackCopyText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (err) {
      console.warn('Fallback copy failed:', err);
    }
  };

  const openEditorForNew = () => {
    setFormData({
      id: '',
      title: '',
      videoText: '',
      youtubeDescription: '',
      tiktokCaption: '',
      instagramDescription: '',
      facebookDescription: '',
      imageReferences: [
        'Cinematic overhead view of deep oceanic abyss',
        'High contrast underwater ROV spotlight illuminating organism',
        'Close-up texture and motion breakdown',
        'Diagram or scale comparison overlay',
        'Dramatic concluding silhouette with depth gauge',
      ],
      thumbnailPrompt: '',
      internalNotes: '',
      category: 'Ocean Mysteries',
      tags: 'deep sea, abyss, biology',
      targetPlatforms: ['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'],
    });
    setIsEditorOpen(true);
  };

  const openEditorForEdit = (m: Material) => {
    setFormData({
      id: m.id,
      title: m.title,
      videoText: m.videoText,
      youtubeDescription: m.youtubeDescription,
      tiktokCaption: m.tiktokCaption,
      instagramDescription: m.instagramDescription,
      facebookDescription: m.facebookDescription,
      imageReferences:
        m.imageReferences.length > 0 ? [...m.imageReferences] : ['', '', '', '', ''],
      thumbnailPrompt: m.thumbnailPrompt,
      internalNotes: m.internalNotes || '',
      category: m.category,
      tags: m.tags.join(', '),
      targetPlatforms: m.targetPlatforms,
    });
    setIsEditorOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const validImageRefs = formData.imageReferences.filter((ref) => ref.trim().length > 0);

    const saved = onSaveMaterial({
      id: formData.id || undefined,
      title: formData.title,
      videoText: formData.videoText,
      youtubeDescription: formData.youtubeDescription,
      tiktokCaption: formData.tiktokCaption,
      instagramDescription: formData.instagramDescription,
      facebookDescription: formData.facebookDescription,
      imageReferences: validImageRefs,
      thumbnailPrompt: formData.thumbnailPrompt,
      internalNotes: formData.internalNotes,
      category: formData.category,
      tags: tagsArray,
      targetPlatforms: formData.targetPlatforms,
      platformStatuses: activeMaterial?.platformStatuses || {},
    });

    setIsEditorOpen(false);
    setActiveMaterial(saved);
  };

  // Filter & sort materials
  const listToFilter = activeSubTab === 'active' ? materials : recentlyDeleted;
  const filteredMaterials = listToFilter
    .filter((m) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        m.id.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        m.videoText.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Status filter
      if (selectedStatusFilter !== 'all') {
        const overall = calculateOverallMaterialStatus(m.targetPlatforms, m.platformStatuses || {});
        if (overall !== selectedStatusFilter) return false;
      }

      // Platform filter
      if (selectedPlatformFilter !== 'all') {
        if (!m.targetPlatforms.includes(selectedPlatformFilter as Platform)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sortBy === 'updated') return b.updatedAt.localeCompare(a.updatedAt);
      return a.title.localeCompare(b.title);
    });

  const getStatusBadge = (status: OverallStatus) => {
    switch (status) {
      case 'published':
        return <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">PUBLISHED</span>;
      case 'in_progress':
        return <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">IN PROGRESS</span>;
      case 'scheduled':
        return <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">SCHEDULED</span>;
      default:
        return <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--elevated)] border border-[var(--panel-border)] px-2 py-0.5 rounded">IN WORKING</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 7.1 Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl arctic-glass">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-[var(--accent-light)]" />
              Material Hub
            </h1>
            <span className="text-xs font-mono font-bold text-[var(--accent-light)] bg-[var(--accent-bg)] border border-[var(--accent)]/30 px-2 py-0.5 rounded">
              {materials.length} Materials
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Centralized content assets, continuous video texts, multi-platform copy, and prompts
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Sub-tabs: Active vs Recently Deleted */}
          <div className="flex items-center bg-[var(--elevated)] p-1 rounded-lg border border-[var(--accent)]/20">
            <button
              onClick={() => setActiveSubTab('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                activeSubTab === 'active' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
              }`}
            >
              Library ({materials.length})
            </button>
            <button
              onClick={() => setActiveSubTab('deleted')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                activeSubTab === 'deleted' ? 'bg-[var(--elevated-hover)] text-rose-400' : 'text-[var(--text-muted)]'
              }`}
            >
              Recently Deleted ({recentlyDeleted.length})
            </button>
          </div>

          <button
            onClick={openEditorForNew}
            className="px-3.5 py-1.5 rounded-lg command-btn-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/15"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Material</span>
          </button>
        </div>
      </div>

      {/* Filter and View Mode Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl arctic-glass">
        <div className="flex flex-1 items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search MAT-ID, title, tags, or video text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--elevated)] border border-[var(--accent)]/20 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-[var(--elevated)] border border-[var(--accent)]/20 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="in_working">In Working</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="published">Published</option>
          </select>

          {/* Platform filter */}
          <select
            value={selectedPlatformFilter}
            onChange={(e) => setSelectedPlatformFilter(e.target.value)}
            className="bg-[var(--elevated)] border border-[var(--accent)]/20 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Platforms</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram_reels">Instagram Reels</option>
            <option value="facebook_reels">Facebook Reels</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[var(--elevated)] border border-[var(--accent)]/20 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>

          {/* Grid / List toggle */}
          <div className="flex items-center bg-[var(--elevated)] p-1 rounded-lg border border-[var(--accent)]/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Materials Display */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 text-center rounded-xl command-card space-y-4">
          <FolderKanban className="w-12 h-12 text-[var(--accent-light)] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              {activeSubTab === 'deleted' ? 'No items in Recently Deleted' : 'No materials in your library yet'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              {activeSubTab === 'deleted'
                ? 'Deleted materials are retained for 30 days before permanent deletion.'
                : 'Your library is pristine. Add your first short-form video material with multi-platform copy and visual cues.'}
            </p>
          </div>
          {activeSubTab === 'active' && (
            <button
              onClick={openEditorForNew}
              className="command-btn-primary px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Material (MAT-001)</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((m) => {
            const overallStatus = calculateOverallMaterialStatus(m.targetPlatforms, m.platformStatuses || {});
            return (
              <div
                key={m.id}
                className="p-5 rounded-xl arctic-glass hover:border-[var(--accent)]/40 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--accent-light)] px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent)]/20">
                      {m.id}
                    </span>
                    {getStatusBadge(overallStatus)}
                  </div>

                  <h3
                    onClick={() => setActiveMaterial(m)}
                    className="text-sm font-bold text-slate-100 hover:text-[var(--accent-light)] cursor-pointer line-clamp-2 transition-colors"
                  >
                    {m.title}
                  </h3>

                  {/* Continuous Video Text Preview */}
                  <p className="text-xs text-slate-300 italic line-clamp-3 bg-slate-950/50 p-2.5 rounded border border-[var(--panel-border)]">
                    "{m.videoText}"
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {m.targetPlatforms.map((plat) => {
                      const cfg = PLATFORM_CONFIG[plat];
                      return (
                        <span
                          key={plat}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--elevated)] text-indigo-200 border border-[var(--accent)]/15"
                        >
                          {cfg.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {m.imageReferences.length} visual cues
                  </span>

                  <div className="flex items-center space-x-1">
                    {activeSubTab === 'active' ? (
                      <>
                        <button
                          onClick={() => setActiveMaterial(m)}
                          className="px-2.5 py-1 text-xs text-[var(--accent-light)] hover:bg-[var(--elevated-hover)] rounded transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => openEditorForEdit(m)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-light)] rounded"
                          title="Edit Material"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateMaterial(m.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-indigo-200 rounded"
                          title="Duplicate Material"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSoftDeleteMaterial(m.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-rose-400 rounded"
                          title="Move to Recently Deleted"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onRestoreMaterial(m.id)}
                          className="px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded border border-emerald-500/30 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                        {deleteConfirmId === m.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                onPermanentlyDeleteMaterial(m.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 text-[10px] bg-rose-600 text-white font-bold rounded"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(m.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 rounded"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="arctic-glass rounded-xl overflow-hidden border border-[var(--accent)]/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--elevated)] text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--panel-border)]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Overall Status</th>
                  <th className="py-3 px-4">Target Platforms</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)] text-slate-200">
                {filteredMaterials.map((m) => {
                  const overallStatus = calculateOverallMaterialStatus(m.targetPlatforms, m.platformStatuses || {});
                  return (
                    <tr key={m.id} className="hover:bg-[var(--elevated-hover)]/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[var(--accent-light)]">{m.id}</td>
                      <td
                        onClick={() => setActiveMaterial(m)}
                        className="py-3 px-4 font-bold text-slate-100 hover:text-[var(--accent-light)] cursor-pointer"
                      >
                        {m.title}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{m.category}</td>
                      <td className="py-3 px-4">{getStatusBadge(overallStatus)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {m.targetPlatforms.map((p) => (
                            <span
                              key={p}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: PLATFORM_CONFIG[p].brandColor }}
                              title={PLATFORM_CONFIG[p].name}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-muted)]">{m.createdAt.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {activeSubTab === 'active' ? (
                          <>
                            <button
                              onClick={() => setActiveMaterial(m)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-light)]"
                              title="Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditorForEdit(m)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-light)]"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDuplicateMaterial(m.id)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-indigo-200"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSoftDeleteMaterial(m.id)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onRestoreMaterial(m.id)}
                            className="p-1 rounded text-emerald-400 hover:text-emerald-300"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7.3 Material Detail Modal with Convenient 1-Click Copy Buttons */}
      {activeMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-[var(--accent)]/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm font-extrabold text-[var(--accent-light)] px-2.5 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent)]/30">
                    {activeMaterial.id}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Category: <strong className="text-slate-200">{activeMaterial.category}</strong>
                  </span>
                  {getStatusBadge(
                    calculateOverallMaterialStatus(
                      activeMaterial.targetPlatforms,
                      activeMaterial.platformStatuses || {}
                    )
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-100">{activeMaterial.title}</h2>
              </div>
              <button
                onClick={() => setActiveMaterial(null)}
                className="text-[var(--text-muted)] hover:text-slate-100 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Critical VIDEO TEXT Requirement (Continuous Passage) */}
            <div className="p-4 rounded-xl bg-[var(--elevated)] border border-[var(--accent)]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--accent-light)] tracking-wide uppercase flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  Continuous Video Text (Single Continuous Passage)
                </span>
                <button
                  onClick={() => handleCopy(activeMaterial.videoText, 'videoText')}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-[var(--elevated-hover)] text-indigo-200 hover:bg-[var(--accent)] hover:text-[#080D14] transition-all flex items-center gap-1"
                >
                  {copiedKey === 'videoText' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'videoText' ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 italic bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--panel-border)] leading-relaxed select-all">
                "{activeMaterial.videoText}"
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Note: Displayed throughout the short video; not broken into sentences per image.
              </p>
            </div>

            {/* Platform Captions with 1-Click Copy */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Platform-Specific Captions & Descriptions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* YouTube */}
                <div className="p-3 rounded-xl bg-[var(--elevated)] border border-[var(--panel-border)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400">YouTube Shorts Description</span>
                    <button
                      onClick={() => handleCopy(activeMaterial.youtubeDescription, 'yt')}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-light)] flex items-center gap-1"
                    >
                      {copiedKey === 'yt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'yt' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded text-[11px] line-clamp-3">
                    {activeMaterial.youtubeDescription}
                  </p>
                </div>

                {/* TikTok */}
                <div className="p-3 rounded-xl bg-[var(--elevated)] border border-[var(--panel-border)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">TikTok Caption</span>
                    <button
                      onClick={() => handleCopy(activeMaterial.tiktokCaption, 'tt')}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-light)] flex items-center gap-1"
                    >
                      {copiedKey === 'tt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'tt' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded text-[11px] line-clamp-3">
                    {activeMaterial.tiktokCaption}
                  </p>
                </div>

                {/* Instagram */}
                <div className="p-3 rounded-xl bg-[var(--elevated)] border border-[var(--panel-border)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-400">Instagram Reels Caption</span>
                    <button
                      onClick={() => handleCopy(activeMaterial.instagramDescription, 'ig')}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-light)] flex items-center gap-1"
                    >
                      {copiedKey === 'ig' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'ig' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded text-[11px] line-clamp-3">
                    {activeMaterial.instagramDescription}
                  </p>
                </div>

                {/* Facebook */}
                <div className="p-3 rounded-xl bg-[var(--elevated)] border border-[var(--panel-border)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">Facebook Reels Description</span>
                    <button
                      onClick={() => handleCopy(activeMaterial.facebookDescription, 'fb')}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-light)] flex items-center gap-1"
                    >
                      {copiedKey === 'fb' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'fb' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded text-[11px] line-clamp-3">
                    {activeMaterial.facebookDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Image References (approx 5-6 cues) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[var(--accent-light)]" />
                Visual Image References ({activeMaterial.imageReferences.length} cues)
              </span>
              <div className="space-y-1.5">
                {activeMaterial.imageReferences.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] text-xs text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="font-mono text-[var(--accent-light)] font-bold shrink-0">#{idx + 1}</span>
                    <span className="flex-1">{ref}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail Prompt */}
            <div className="p-4 rounded-xl bg-[var(--elevated)] border border-[var(--accent)]/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[var(--accent-light)]" />
                  Thumbnail Generation Prompt
                </span>
                <button
                  onClick={() => handleCopy(activeMaterial.thumbnailPrompt, 'thumb')}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-light)] flex items-center gap-1"
                >
                  {copiedKey === 'thumb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'thumb' ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded font-mono leading-relaxed">
                {activeMaterial.thumbnailPrompt}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--accent)]/20">
              <button
                onClick={() => onScheduleMaterial(activeMaterial.id)}
                className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-[var(--accent)]/30 text-xs font-bold text-[var(--accent-light)] hover:bg-[var(--accent)] hover:text-[#080D14] transition-all"
              >
                Schedule on Calendar
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    openEditorForEdit(activeMaterial);
                    setActiveMaterial(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--elevated-hover)] text-xs font-semibold text-slate-200 hover:text-[var(--accent-light)]"
                >
                  Edit Material
                </button>
                <button
                  onClick={() => setActiveMaterial(null)}
                  className="px-4 py-2 rounded-lg bg-[var(--elevated)] text-xs font-semibold text-[var(--text-muted)] hover:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal for Create / Edit */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100">
              {formData.id ? `Edit Material [${formData.id}]` : 'Create New Content Material'}
            </h2>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">Material Title</label>
                <input
                  type="text"
                  placeholder="e.g. The Unsolved Mariana Trench 'Bloop' Frequency"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2.5 text-slate-200 font-medium"
                  required
                />
              </div>

              {/* VIDEO TEXT (Critical requirement) */}
              <div>
                <label className="block font-semibold text-[var(--accent-light)] mb-1">
                  VIDEO TEXT (One continuous passage displayed throughout video, NOT broken into sentences)
                </label>
                <textarea
                  rows={4}
                  placeholder="Write the continuous script passage displayed across the entire short video..."
                  value={formData.videoText}
                  onChange={(e) => setFormData({ ...formData, videoText: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/40 rounded-lg p-2.5 text-slate-200 leading-relaxed font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Image References (5-6 cues) */}
              <div className="space-y-2">
                <label className="block font-semibold text-[var(--text-muted)]">
                  Visual Image References (5-6 cues)
                </label>
                {formData.imageReferences.map((ref, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Visual cue #${idx + 1}...`}
                    value={ref}
                    onChange={(e) => {
                      const next = [...formData.imageReferences];
                      next[idx] = e.target.value;
                      setFormData({ ...formData, imageReferences: next });
                    }}
                    className="w-full bg-[var(--elevated)] border border-[var(--panel-border)] rounded-lg p-2 text-slate-200"
                  />
                ))}
              </div>

              {/* Thumbnail Prompt */}
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">Thumbnail Prompt</label>
                <input
                  type="text"
                  placeholder="Detailed prompt for Midjourney / Flux / Imagen..."
                  value={formData.thumbnailPrompt}
                  onChange={(e) => setFormData({ ...formData, thumbnailPrompt: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                  required
                />
              </div>

              {/* Platform Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-red-400 mb-1">YouTube Shorts Description</label>
                  <textarea
                    rows={2}
                    value={formData.youtubeDescription}
                    onChange={(e) => setFormData({ ...formData, youtubeDescription: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--panel-border)] rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-cyan-300 mb-1">TikTok Caption</label>
                  <textarea
                    rows={2}
                    value={formData.tiktokCaption}
                    onChange={(e) => setFormData({ ...formData, tiktokCaption: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--panel-border)] rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-pink-400 mb-1">Instagram Reels Caption</label>
                  <textarea
                    rows={2}
                    value={formData.instagramDescription}
                    onChange={(e) => setFormData({ ...formData, instagramDescription: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--panel-border)] rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-blue-400 mb-1">Facebook Reels Description</label>
                  <textarea
                    rows={2}
                    value={formData.facebookDescription}
                    onChange={(e) => setFormData({ ...formData, facebookDescription: e.target.value })}
                    className="w-full bg-[var(--elevated)] border border-[var(--panel-border)] rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--accent)]/20">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 font-semibold text-[var(--text-muted)] hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg command-btn-primary text-white font-bold"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
