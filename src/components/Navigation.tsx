import React from 'react';
import {
  BarChart3,
  Calendar as CalendarIcon,
  Compass,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sun,
  Target,
  Waves,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { AppNotification, UserPreferences, UserProfile } from '../types/index';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  user: UserProfile;
  notifications: AppNotification[];
  onOpenQuickAction: () => void;
  onOpenSearch: () => void;
  onOpenSetupWizard: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  preferences,
  onUpdatePreferences,
  user,
  notifications,
  onOpenQuickAction,
  onOpenSearch,
  onOpenSetupWizard,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'materials', label: 'Material Hub', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar & Schedules', icon: CalendarIcon },
    { id: 'reports', label: 'Reports & Intelligence', icon: FileText },
    { id: 'goals', label: 'Goals & Productivity', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Settings & Security', icon: SettingsIcon },
  ];

  const toggleTheme = () => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    onUpdatePreferences({ theme: newTheme });
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  };

  return (
    <>
      {/* Top Command Bar */}
      <header className="sticky top-0 z-40 w-full bg-[var(--panel-bg)] backdrop-blur-md border-b border-[var(--panel-border)] px-4 lg:px-6 h-16 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleCollapse}
            aria-label="Toggle Navigation Sidebar"
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:bg-[var(--elevated)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Waves className="w-6 h-6 text-[var(--accent)]" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold tracking-tight text-lg text-[var(--text-primary)] flex items-center gap-1.5">
              <span>ABYSSAL</span>
              <span className="text-[var(--accent-light)]">FACTS</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold border border-[var(--panel-border)] px-2 py-0.5 rounded bg-[var(--elevated)]">
              Command Center
            </span>
          </div>
        </div>

        {/* Global Search & Action Bar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition-all text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Search Materials, IDs, and Analytics"
          >
            <Search className="w-4 h-4 text-[var(--accent-light)]" />
            <span className="hidden md:inline">Search MAT-ID, title, tags...</span>
            <kbd className="hidden md:inline-block text-[10px] bg-[var(--bg-main)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded border border-[var(--panel-border)]">
              ⌘K
            </kbd>
          </button>

          {/* Quick Action Button */}
          <button
            onClick={onOpenQuickAction}
            className="command-btn-primary flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-light)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {/* Setup Guide */}
          <button
            onClick={onOpenSetupWizard}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:bg-[var(--elevated)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            title="Open Setup Wizard"
            aria-label="Open Setup Wizard"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:bg-[var(--elevated)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            title={`Switch to ${preferences.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Color Theme"
          >
            {preferences.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>

          {/* Notifications Shortcut */}
          <button
            onClick={() => onSelectTab('notifications')}
            className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:bg-[var(--elevated)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] ring-2 ring-[var(--panel-bg)] animate-pulse" />
            )}
          </button>

          {/* User Profile Chip */}
          <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-[var(--panel-border)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xs text-white shadow-sm ring-1 ring-[var(--accent)]/30">
              AF
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{user.displayName || 'Admin'}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono leading-tight">{preferences.timezone}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 z-30 transition-all duration-300 hidden md:flex flex-col justify-between bg-[var(--panel-bg)] backdrop-blur-md border-r border-[var(--panel-border)] ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center rounded-lg transition-all text-sm font-medium ${
                  collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3'
                } ${
                  isActive
                    ? 'bg-[var(--accent-bg)] text-[var(--accent-light)] border border-[var(--accent)]/30 shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--elevated)]'
                }`}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[var(--accent-light)]' : 'text-[var(--text-muted)]'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto text-[10px] font-mono font-bold bg-[var(--accent-bg)] text-[var(--accent-light)] px-1.5 py-0.5 rounded border border-[var(--accent)]/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        {!collapsed && (
          <div className="p-4 border-t border-[var(--panel-border)] bg-[var(--elevated)]/40">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Creator Command</span>
              <span className="font-mono text-[var(--accent-light)] font-semibold">v2.0</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-2 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Storage Encrypted</span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--panel-bg)] backdrop-blur-md border-t border-[var(--panel-border)] px-2 py-2 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-lg text-xs ${
                isActive ? 'text-[var(--accent-light)] font-semibold' : 'text-[var(--text-muted)]'
              }`}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center p-1 rounded-lg text-xs ${
            currentTab === 'settings' ? 'text-[var(--accent-light)] font-semibold' : 'text-[var(--text-muted)]'
          }`}
          aria-label="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>
      </nav>
    </>
  );
};
