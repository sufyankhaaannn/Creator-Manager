import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { AppNotification, PLATFORM_CONFIG } from '../types/index';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pushStatus, setPushStatus] = useState<string>('idle');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setPushStatus('enabled');
        } else {
          setPushStatus('denied');
        }
      } catch {
        setPushStatus('denied');
      }
    } else {
      setPushStatus('unsupported');
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-[var(--accent-light)]" />;
      case 'goal':
        return <Target className="w-5 h-5 text-amber-400" />;
      case 'checkpoint':
        return <Sparkles className="w-5 h-5 text-indigo-200" />;
      default:
        return <Bell className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl arctic-glass">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Bell className="w-6 h-6 text-[var(--accent-light)]" />
              Notifications & Reminders
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-mono font-bold text-[#080D14] bg-[var(--accent)] px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Publishing schedules, missed upload alerts, 24h/48h checkpoint triggers, and goal milestones
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onMarkAllRead}
            className="px-3 py-1.5 rounded-lg bg-[var(--elevated)] border border-[var(--accent)]/20 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-light)] flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Browser Web Push Banner */}
      <div className="p-4 rounded-xl arctic-glass border border-[var(--accent)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-[var(--accent-light)]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100">
              Browser Web Push Service Worker
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Receive alerts 30m, 15m, and 5m before scheduled uploads even if this tab is closed.
            </p>
          </div>
        </div>

        <div>
          {pushStatus === 'enabled' ? (
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Push Active</span>
            </span>
          ) : pushStatus === 'denied' ? (
            <span className="text-xs text-rose-400 font-medium">Permission denied in browser</span>
          ) : (
            <button
              onClick={handleRequestPush}
              className="px-3.5 py-1.5 rounded-lg command-btn-primary text-white font-bold text-xs shadow-md shadow-indigo-500/15"
            >
              Enable Browser Push
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-[var(--panel-border)] pb-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 font-semibold rounded ${
            filter === 'all' ? 'text-[var(--accent-light)] bg-[var(--elevated-hover)]' : 'text-[var(--text-muted)]'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 font-semibold rounded ${
            filter === 'unread' ? 'text-[var(--accent-light)] bg-[var(--elevated-hover)]' : 'text-[var(--text-muted)]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] rounded-xl arctic-glass">
            No notifications to display.
          </div>
        ) : (
          filtered.map((n) => {
            const cfg = n.platform ? PLATFORM_CONFIG[n.platform] : null;
            return (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  n.read
                    ? 'arctic-glass border-[var(--panel-border)] opacity-70'
                    : 'bg-[var(--elevated)] border-[var(--accent)]/30 shadow-md shadow-indigo-500/5'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-100">{n.title}</span>
                      {cfg && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.2 rounded"
                          style={{
                            color: cfg.brandColor,
                            backgroundColor: `${cfg.brandColor}15`,
                          }}
                        >
                          {cfg.name}
                        </span>
                      )}
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent)] ring-2 ring-[#080D14]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300">{n.message}</p>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {n.actionUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkRead(n.id);
                      onNavigate(n.actionUrl?.replace('/', '') || 'dashboard');
                    }}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-light)] rounded"
                    title="Jump to module"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
