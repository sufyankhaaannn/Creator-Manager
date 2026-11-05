import React, { useEffect, useState } from 'react';
import {
  Calendar,
  FileText,
  FolderKanban,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { Material, PublishingSchedule, SavedReport } from '../types/index';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  schedules: PublishingSchedule[];
  savedReports: SavedReport[];
  onNavigate: (tab: string, context?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  materials,
  schedules,
  savedReports,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedMaterials = q
    ? materials.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.videoText.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      )
    : [];

  const matchedReports = q
    ? savedReports.filter(
        (r) => r.title.toLowerCase().includes(q) || r.reportType.toLowerCase().includes(q)
      )
    : [];

  const matchedSchedules = q
    ? schedules.filter(
        (s) => s.materialId.toLowerCase().includes(q) || s.platform.toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--accent)]/20 bg-[var(--elevated)]">
          <Search className="w-5 h-5 text-[var(--accent-light)] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search Material IDs (MAT-001), topics, video scripts, tags, reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-[var(--text-muted)] focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-[var(--text-muted)] hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-[var(--elevated-hover)] text-indigo-200 px-2 py-0.5 rounded border border-[var(--accent)]/30 ml-2">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          {!q ? (
            <div className="py-10 text-center text-[var(--text-muted)] space-y-1">
              <p className="font-semibold text-slate-300">Global Command Center Search</p>
              <p className="text-[11px]">Type keywords, tags, or IDs like "MAT-001" or "hydrothermal"</p>
            </div>
          ) : matchedMaterials.length === 0 && matchedReports.length === 0 && matchedSchedules.length === 0 ? (
            <div className="py-10 text-center text-[var(--text-muted)]">
              No results found matching "{query}".
            </div>
          ) : (
            <>
              {/* Materials Matches */}
              {matchedMaterials.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[var(--accent-light)] uppercase tracking-wider flex items-center gap-1.5 px-2">
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Materials ({matchedMaterials.length})</span>
                  </div>
                  {matchedMaterials.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        onNavigate('materials', { materialId: m.id });
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-[var(--elevated)] border border-[var(--panel-border)] hover:border-[var(--accent)]/50 hover:bg-[var(--elevated-hover)]/60 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-[var(--accent-light)]">{m.id}</span>
                          <span className="font-semibold text-slate-100">{m.title}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 italic">
                          "{m.videoText}"
                        </p>
                      </div>
                      <span className="text-[10px] text-indigo-200 font-mono shrink-0 ml-2">
                        {m.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Schedules Matches */}
              {matchedSchedules.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 px-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedules & Uploads ({matchedSchedules.length})</span>
                  </div>
                  {matchedSchedules.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onNavigate('calendar');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-[var(--elevated)] border border-[var(--panel-border)] hover:border-[var(--accent)]/50 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[var(--accent-light)]">{s.materialId}</span>
                        <span className="text-slate-200">{s.platform}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {s.plannedPublishAt.slice(0, 10)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reports Matches */}
              {matchedReports.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 px-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Saved Reports ({matchedReports.length})</span>
                  </div>
                  {matchedReports.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        onNavigate('reports');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-[var(--elevated)] border border-[var(--panel-border)] hover:border-emerald-400/50 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-100">{r.title}</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{r.reportType}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
