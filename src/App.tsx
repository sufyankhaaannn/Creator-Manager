import React, { useEffect, useState } from 'react';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { MaterialHubView } from './components/MaterialHubView';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { GoalsView } from './components/GoalsView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { QuickActionsModal } from './components/QuickActionsModal';
import { SetupWizardModal } from './components/SetupWizardModal';
import { StorageService } from './lib/storage';
import {
  AccountAnalyticsEntry,
  AppNotification,
  Goal,
  Material,
  ProductivityTask,
  PublishingSchedule,
  SavedReport,
  UserPreferences,
  UserProfile,
  VideoAnalyticsCheckpoint,
} from './types/index';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Core Data State loaded from StorageService
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Material[]>([]);
  const [accountEntries, setAccountEntries] = useState<AccountAnalyticsEntry[]>([]);
  const [checkpoints, setCheckpoints] = useState<VideoAnalyticsCheckpoint[]>([]);
  const [schedules, setSchedules] = useState<PublishingSchedule[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tasks, setTasks] = useState<ProductivityTask[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(StorageService.getPreferences());
  const [user, setUser] = useState<UserProfile>(StorageService.getUser());

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // Reload all records from Storage
  const reloadData = () => {
    setMaterials(StorageService.getMaterials());
    setRecentlyDeleted(StorageService.getRecentlyDeletedMaterials());
    setAccountEntries(StorageService.getAccountAnalytics());
    setCheckpoints(StorageService.getVideoCheckpoints());
    setSchedules(StorageService.getSchedules());
    setGoals(StorageService.getGoals());
    setNotifications(StorageService.getNotifications());
    setTasks(StorageService.getTasks());
    setSavedReports(StorageService.getSavedReports());
    setPreferences(StorageService.getPreferences());
    setUser(StorageService.getUser());
  };

  // Helper to sync html element classes
  const syncDocumentTheme = (prefs: UserPreferences) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (prefs.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    // Remove any previously set accent classes
    root.classList.remove('theme-indigo', 'theme-violet', 'theme-emerald', 'theme-sky');
    if (prefs.accentTheme) {
      root.classList.add(`theme-${prefs.accentTheme}`);
    } else {
      root.classList.add('theme-indigo');
    }
  };

  useEffect(() => {
    reloadData();
    const prefs = StorageService.getPreferences();
    syncDocumentTheme(prefs);

    // Keyboard shortcut Cmd/Ctrl + K for global search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update Preferences Handler
  const handleUpdatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = StorageService.updatePreferences(newPrefs);
    setPreferences(updated);
    syncDocumentTheme(updated);
  };

  // Update User Handler
  const handleUpdateUser = (newUser: Partial<UserProfile>) => {
    const updated = StorageService.updateUser(newUser);
    setUser(updated);
  };

  // Material Handlers
  const handleSaveMaterial = (
    mat: Omit<Material, 'id' | 'numericId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const saved = StorageService.saveMaterial(mat);
    reloadData();
    return saved;
  };

  const handleDuplicateMaterial = (id: string) => {
    StorageService.duplicateMaterial(id);
    reloadData();
  };

  const handleSoftDeleteMaterial = (id: string) => {
    StorageService.softDeleteMaterial(id);
    reloadData();
  };

  const handleRestoreMaterial = (id: string) => {
    StorageService.restoreMaterial(id);
    reloadData();
  };

  const handlePermanentlyDeleteMaterial = (id: string) => {
    StorageService.permanentlyDeleteMaterial(id);
    reloadData();
  };

  // Analytics Handlers
  const handleSaveAccountEntry = (
    entry: Omit<AccountAnalyticsEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const res = StorageService.saveAccountAnalytics(entry);
    if (res.success) {
      reloadData();
    }
    return res;
  };

  const handleDeleteAccountEntry = (id: string) => {
    StorageService.deleteAccountAnalytics(id);
    reloadData();
  };

  const handleSaveCheckpoint = (
    cp: Omit<VideoAnalyticsCheckpoint, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const res = StorageService.saveVideoCheckpoint(cp);
    if (res.success) {
      reloadData();
    }
    return res;
  };

  const handleDeleteCheckpoint = (id: string) => {
    StorageService.deleteVideoCheckpoint(id);
    reloadData();
  };

  // Schedule Handlers
  const handleSaveSchedule = (
    sch: Omit<PublishingSchedule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const saved = StorageService.saveSchedule(sch);
    reloadData();
    return saved;
  };

  const handleDeleteSchedule = (id: string) => {
    StorageService.deleteSchedule(id);
    reloadData();
  };

  // Goal Handlers
  const handleSaveGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const saved = StorageService.saveGoal(goal);
    reloadData();
    return saved;
  };

  const handleDeleteGoal = (id: string) => {
    StorageService.deleteGoal(id);
    reloadData();
  };

  // Task Handlers
  const handleToggleTask = (taskId: string) => {
    StorageService.toggleTask(taskId);
    reloadData();
  };

  const handleSaveTask = (task: Omit<ProductivityTask, 'id'> & { id?: string }) => {
    StorageService.saveTask(task);
    reloadData();
  };

  const handleDeleteTask = (id: string) => {
    StorageService.deleteTask(id);
    reloadData();
  };

  // Notification Handlers
  const handleMarkNotificationRead = (id: string) => {
    StorageService.markNotificationRead(id);
    reloadData();
  };

  const handleMarkAllNotificationsRead = () => {
    StorageService.markAllNotificationsRead();
    reloadData();
  };

  // Report Handlers
  const handleSaveReport = (report: SavedReport) => {
    StorageService.saveReport(report);
    reloadData();
  };

  const handleDeleteReport = (id: string) => {
    StorageService.deleteSavedReport(id);
    reloadData();
  };

  // Navigation redirect with optional context
  const handleNavigate = (tab: string, context?: any) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Quick Action Selection
  const handleSelectQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'add_material':
        setCurrentTab('materials');
        break;
      case 'all_time_analytics':
        setCurrentTab('analytics');
        break;
      case 'account_analytics':
        setCurrentTab('analytics');
        break;
      case 'video_insights':
        setCurrentTab('analytics');
        break;
      case 'schedule_video':
        setCurrentTab('calendar');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200">
      {/* Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        user={user}
        notifications={notifications}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        className={`flex-1 transition-all duration-300 pt-6 px-4 lg:px-8 pb-16 md:pb-8 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              materials={materials}
              accountEntries={accountEntries}
              checkpoints={checkpoints}
              schedules={schedules}
              tasks={tasks}
              preferences={preferences}
              onNavigate={handleNavigate}
              onOpenQuickAction={(action) => {
                if (action) handleSelectQuickAction(action);
                else setIsQuickActionOpen(true);
              }}
              onToggleTask={handleToggleTask}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              materials={materials}
              accountEntries={accountEntries}
              checkpoints={checkpoints}
              schedules={schedules}
              onSaveAccountEntry={handleSaveAccountEntry}
              onDeleteAccountEntry={handleDeleteAccountEntry}
              onSaveCheckpoint={handleSaveCheckpoint}
              onDeleteCheckpoint={handleDeleteCheckpoint}
            />
          )}

          {currentTab === 'materials' && (
            <MaterialHubView
              materials={materials}
              recentlyDeleted={recentlyDeleted}
              onSaveMaterial={handleSaveMaterial}
              onDuplicateMaterial={handleDuplicateMaterial}
              onSoftDeleteMaterial={handleSoftDeleteMaterial}
              onRestoreMaterial={handleRestoreMaterial}
              onPermanentlyDeleteMaterial={handlePermanentlyDeleteMaterial}
              onScheduleMaterial={(matId) => {
                setCurrentTab('calendar');
              }}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              materials={materials}
              schedules={schedules}
              preferences={preferences}
              onSaveSchedule={handleSaveSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onNavigateToMaterial={(matId) => {
                setCurrentTab('materials');
              }}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              materials={materials}
              accountEntries={accountEntries}
              checkpoints={checkpoints}
              schedules={schedules}
              savedReports={savedReports}
              onSaveReport={handleSaveReport}
              onDeleteReport={handleDeleteReport}
              onNavigateToMaterial={(matId) => {
                setCurrentTab('materials');
              }}
            />
          )}

          {currentTab === 'goals' && (
            <GoalsView
              goals={goals}
              tasks={tasks}
              schedules={schedules}
              onSaveGoal={handleSaveGoal}
              onDeleteGoal={handleDeleteGoal}
              onToggleTask={handleToggleTask}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              preferences={preferences}
              onUpdateUser={handleUpdateUser}
              onUpdatePreferences={handleUpdatePreferences}
              onReloadAllData={reloadData}
            />
          )}
        </div>
      </main>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        materials={materials}
        schedules={schedules}
        savedReports={savedReports}
        onNavigate={handleNavigate}
      />

      {/* Quick Action Modal */}
      <QuickActionsModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleSelectQuickAction}
      />

      {/* Initialization & Setup Wizard Modal */}
      <SetupWizardModal
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        user={user}
        preferences={preferences}
        onSavePreferences={handleUpdatePreferences}
        onSaveUser={handleUpdateUser}
      />
    </div>
  );
}
