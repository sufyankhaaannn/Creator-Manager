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
} from '../types/index';
import {
  INITIAL_PREFERENCES,
  INITIAL_USER,
  SAMPLE_ACCOUNT_ANALYTICS,
  SAMPLE_GOALS,
  SAMPLE_MATERIALS,
  SAMPLE_NOTIFICATIONS,
  SAMPLE_PRODUCTIVITY_TASKS,
  SAMPLE_SCHEDULES,
  SAMPLE_VIDEO_CHECKPOINTS,
} from './seedData';

const STORAGE_KEYS = {
  USER: 'abyssal_user_v1',
  PREFERENCES: 'abyssal_preferences_v1',
  MATERIALS: 'abyssal_materials_v1',
  NEXT_MATERIAL_ID: 'abyssal_next_mat_id_v1',
  ACCOUNT_ANALYTICS: 'abyssal_account_analytics_v1',
  VIDEO_CHECKPOINTS: 'abyssal_video_checkpoints_v1',
  SCHEDULES: 'abyssal_schedules_v1',
  GOALS: 'abyssal_goals_v1',
  NOTIFICATIONS: 'abyssal_notifications_v1',
  TASKS: 'abyssal_tasks_v1',
  SAVED_REPORTS: 'abyssal_saved_reports_v1',
  BACKUP_LOGS: 'abyssal_backup_logs_v1',
  DEMO_MODE_ACTIVE: 'abyssal_demo_mode_active_v1',
  CLEAN_USER_MODE: 'abyssal_clean_user_mode_v2',
};

// Safe JSON parser
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write ${key} to storage:`, err);
  }
}

// Clean initialization to ensure zero pre-added mock data
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(STORAGE_KEYS.CLEAN_USER_MODE) !== 'true') {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ACCOUNT_ANALYTICS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.VIDEO_CHECKPOINTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SAVED_REPORTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NEXT_MATERIAL_ID, JSON.stringify(1));
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE_ACTIVE, JSON.stringify(false));
      localStorage.setItem(STORAGE_KEYS.CLEAN_USER_MODE, 'true');
    }
  } catch (e) {
    // Ignore storage quota or access issues
  }
}

export const StorageService = {
  // Demo Mode
  isDemoModeActive(): boolean {
    return safeGet<boolean>(STORAGE_KEYS.DEMO_MODE_ACTIVE, false);
  },

  setDemoModeActive(active: boolean): void {
    safeSet(STORAGE_KEYS.DEMO_MODE_ACTIVE, active);
  },

  // User Profile
  getUser(): UserProfile {
    return safeGet<UserProfile>(STORAGE_KEYS.USER, INITIAL_USER);
  },

  updateUser(user: Partial<UserProfile>): UserProfile {
    const current = this.getUser();
    const updated = { ...current, ...user };
    safeSet(STORAGE_KEYS.USER, updated);
    return updated;
  },

  // Preferences
  getPreferences(): UserPreferences {
    return safeGet<UserPreferences>(STORAGE_KEYS.PREFERENCES, INITIAL_PREFERENCES);
  },

  updatePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = {
      ...current,
      ...prefs,
      notifications: { ...current.notifications, ...(prefs.notifications || {}) },
    };
    safeSet(STORAGE_KEYS.PREFERENCES, updated);
    return updated;
  },

  // Materials & Auto IDs
  getMaterials(includeDeleted = false): Material[] {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, []);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Auto cleanup materials deleted more than 30 days ago
    const valid = materials.filter((m) => {
      if (!m.deletedAt) return true;
      return m.deletedAt >= thirtyDaysAgo;
    });

    if (valid.length !== materials.length) {
      safeSet(STORAGE_KEYS.MATERIALS, valid);
    }

    if (includeDeleted) return valid;
    return valid.filter((m) => !m.deletedAt);
  },

  getRecentlyDeletedMaterials(): Material[] {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, []);
    return materials.filter((m) => !!m.deletedAt);
  },

  getNextMaterialId(): { id: string; numericId: number } {
    const storedNext = safeGet<number>(STORAGE_KEYS.NEXT_MATERIAL_ID, 1);
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, []);
    const maxExisting = materials.reduce((max, m) => Math.max(max, m.numericId || 0), 0);
    const nextNumeric = Math.max(storedNext, maxExisting + 1);

    const formatted = `MAT-${String(nextNumeric).padStart(3, '0')}`;
    return { id: formatted, numericId: nextNumeric };
  },

  saveMaterial(
    material: Omit<Material, 'id' | 'numericId' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      numericId?: number;
    }
  ): Material {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, SAMPLE_MATERIALS);
    const now = new Date().toISOString();

    if (material.id) {
      // Edit existing
      const index = materials.findIndex((m) => m.id === material.id);
      if (index !== -1) {
        const updated: Material = {
          ...materials[index],
          ...material,
          updatedAt: now,
        };
        materials[index] = updated;
        safeSet(STORAGE_KEYS.MATERIALS, materials);
        return updated;
      }
    }

    // Create new
    const { id, numericId } = this.getNextMaterialId();
    safeSet(STORAGE_KEYS.NEXT_MATERIAL_ID, numericId + 1);

    const newMaterial: Material = {
      ...material,
      id,
      numericId,
      createdAt: now,
      updatedAt: now,
      platformStatuses: material.platformStatuses || {},
      targetPlatforms: material.targetPlatforms || ['youtube_shorts', 'tiktok'],
      imageReferences: material.imageReferences || [],
      tags: material.tags || [],
    };

    materials.unshift(newMaterial);
    safeSet(STORAGE_KEYS.MATERIALS, materials);
    return newMaterial;
  },

  softDeleteMaterial(id: string): void {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, SAMPLE_MATERIALS);
    const updated = materials.map((m) =>
      m.id === id ? { ...m, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : m
    );
    safeSet(STORAGE_KEYS.MATERIALS, updated);
  },

  restoreMaterial(id: string): void {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, SAMPLE_MATERIALS);
    const updated = materials.map((m) =>
      m.id === id ? { ...m, deletedAt: null, updatedAt: new Date().toISOString() } : m
    );
    safeSet(STORAGE_KEYS.MATERIALS, updated);
  },

  permanentlyDeleteMaterial(id: string): void {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, SAMPLE_MATERIALS);
    const filtered = materials.filter((m) => m.id !== id);
    safeSet(STORAGE_KEYS.MATERIALS, filtered);
  },

  duplicateMaterial(id: string): Material | null {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, SAMPLE_MATERIALS);
    const target = materials.find((m) => m.id === id);
    if (!target) return null;

    const { id: newId, numericId: newNumeric } = this.getNextMaterialId();
    safeSet(STORAGE_KEYS.NEXT_MATERIAL_ID, newNumeric + 1);

    const now = new Date().toISOString();
    const duplicated: Material = {
      ...target,
      id: newId,
      numericId: newNumeric,
      title: `${target.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      platformStatuses: {},
    };

    materials.unshift(duplicated);
    safeSet(STORAGE_KEYS.MATERIALS, materials);
    return duplicated;
  },

  // Account Analytics
  getAccountAnalytics(): AccountAnalyticsEntry[] {
    return safeGet<AccountAnalyticsEntry[]>(
      STORAGE_KEYS.ACCOUNT_ANALYTICS,
      []
    );
  },

  saveAccountAnalytics(entry: Omit<AccountAnalyticsEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): {
    success: boolean;
    entry?: AccountAnalyticsEntry;
    error?: string;
  } {
    const list = this.getAccountAnalytics();
    const now = new Date().toISOString();

    // Check for duplicate platform + reportingDate constraint
    const duplicate = list.find(
      (e) => e.platform === entry.platform && e.reportingDate === entry.reportingDate && e.id !== entry.id
    );
    if (duplicate) {
      return {
        success: false,
        error: `An entry for ${entry.platform} on date ${entry.reportingDate} already exists. Please edit that record instead.`,
      };
    }

    if (entry.id) {
      const idx = list.findIndex((e) => e.id === entry.id);
      if (idx !== -1) {
        const updated: AccountAnalyticsEntry = {
          ...list[idx],
          ...entry,
          updatedAt: now,
        };
        list[idx] = updated;
        safeSet(STORAGE_KEYS.ACCOUNT_ANALYTICS, list);
        return { success: true, entry: updated };
      }
    }

    const newEntry: AccountAnalyticsEntry = {
      ...entry,
      id: `aa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newEntry);
    safeSet(STORAGE_KEYS.ACCOUNT_ANALYTICS, list);
    return { success: true, entry: newEntry };
  },

  deleteAccountAnalytics(id: string): void {
    const list = this.getAccountAnalytics().filter((e) => e.id !== id);
    safeSet(STORAGE_KEYS.ACCOUNT_ANALYTICS, list);
  },

  // Video Checkpoints
  getVideoCheckpoints(materialId?: string): VideoAnalyticsCheckpoint[] {
    const list = safeGet<VideoAnalyticsCheckpoint[]>(
      STORAGE_KEYS.VIDEO_CHECKPOINTS,
      []
    );
    if (materialId) return list.filter((c) => c.materialId === materialId);
    return list;
  },

  saveVideoCheckpoint(
    checkpoint: Omit<VideoAnalyticsCheckpoint, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): { success: boolean; checkpoint?: VideoAnalyticsCheckpoint; error?: string } {
    const list = this.getVideoCheckpoints();
    const now = new Date().toISOString();

    // Check duplicate material + platform + checkpoint
    const duplicate = list.find(
      (c) =>
        c.materialId === checkpoint.materialId &&
        c.platform === checkpoint.platform &&
        c.checkpoint === checkpoint.checkpoint &&
        c.id !== checkpoint.id
    );
    if (duplicate) {
      return {
        success: false,
        error: `A ${checkpoint.checkpoint} checkpoint already exists for this video on this platform.`,
      };
    }

    if (checkpoint.id) {
      const idx = list.findIndex((c) => c.id === checkpoint.id);
      if (idx !== -1) {
        const updated: VideoAnalyticsCheckpoint = {
          ...list[idx],
          ...checkpoint,
          updatedAt: now,
        };
        list[idx] = updated;
        safeSet(STORAGE_KEYS.VIDEO_CHECKPOINTS, list);
        return { success: true, checkpoint: updated };
      }
    }

    const newCheckpoint: VideoAnalyticsCheckpoint = {
      ...checkpoint,
      id: `vc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newCheckpoint);
    safeSet(STORAGE_KEYS.VIDEO_CHECKPOINTS, list);
    return { success: true, checkpoint: newCheckpoint };
  },

  deleteVideoCheckpoint(id: string): void {
    const list = this.getVideoCheckpoints().filter((c) => c.id !== id);
    safeSet(STORAGE_KEYS.VIDEO_CHECKPOINTS, list);
  },

  // Schedules
  getSchedules(): PublishingSchedule[] {
    return safeGet<PublishingSchedule[]>(STORAGE_KEYS.SCHEDULES, []);
  },

  saveSchedule(
    schedule: Omit<PublishingSchedule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): PublishingSchedule {
    const list = this.getSchedules();
    const now = new Date().toISOString();

    if (schedule.id) {
      const idx = list.findIndex((s) => s.id === schedule.id);
      if (idx !== -1) {
        const updated: PublishingSchedule = {
          ...list[idx],
          ...schedule,
          updatedAt: now,
        };
        list[idx] = updated;
        safeSet(STORAGE_KEYS.SCHEDULES, list);
        return updated;
      }
    }

    const newSchedule: PublishingSchedule = {
      ...schedule,
      id: `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newSchedule);
    safeSet(STORAGE_KEYS.SCHEDULES, list);
    return newSchedule;
  },

  deleteSchedule(id: string): void {
    const list = this.getSchedules().filter((s) => s.id !== id);
    safeSet(STORAGE_KEYS.SCHEDULES, list);
  },

  // Goals
  getGoals(): Goal[] {
    return safeGet<Goal[]>(STORAGE_KEYS.GOALS, []);
  },

  saveGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Goal {
    const list = this.getGoals();
    const now = new Date().toISOString();

    if (goal.id) {
      const idx = list.findIndex((g) => g.id === goal.id);
      if (idx !== -1) {
        const updated: Goal = {
          ...list[idx],
          ...goal,
          updatedAt: now,
        };
        list[idx] = updated;
        safeSet(STORAGE_KEYS.GOALS, list);
        return updated;
      }
    }

    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newGoal);
    safeSet(STORAGE_KEYS.GOALS, list);
    return newGoal;
  },

  deleteGoal(id: string): void {
    const list = this.getGoals().filter((g) => g.id !== id);
    safeSet(STORAGE_KEYS.GOALS, list);
  },

  // Notifications
  getNotifications(): AppNotification[] {
    return safeGet<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  markNotificationRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    safeSet(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  markAllNotificationsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    safeSet(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(newNotif);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, list);
    return newNotif;
  },

  // Productivity Tasks
  getTasks(): ProductivityTask[] {
    return safeGet<ProductivityTask[]>(STORAGE_KEYS.TASKS, []);
  },

  toggleTask(id: string): void {
    const list = this.getTasks().map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    safeSet(STORAGE_KEYS.TASKS, list);
  },

  saveTask(task: Omit<ProductivityTask, 'id'> & { id?: string }): ProductivityTask {
    const list = this.getTasks();
    if (task.id) {
      const idx = list.findIndex((t) => t.id === task.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...task };
        safeSet(STORAGE_KEYS.TASKS, list);
        return list[idx];
      }
    }
    const newTask: ProductivityTask = {
      ...task,
      id: `task_${Date.now()}`,
    };
    list.push(newTask);
    safeSet(STORAGE_KEYS.TASKS, list);
    return newTask;
  },

  deleteTask(id: string): void {
    const list = this.getTasks().filter((t) => t.id !== id);
    safeSet(STORAGE_KEYS.TASKS, list);
  },

  // Saved Reports
  getSavedReports(): SavedReport[] {
    return safeGet<SavedReport[]>(STORAGE_KEYS.SAVED_REPORTS, []);
  },

  saveReport(report: SavedReport): void {
    const list = this.getSavedReports();
    list.unshift(report);
    safeSet(STORAGE_KEYS.SAVED_REPORTS, list);
  },

  deleteSavedReport(id: string): void {
    const list = this.getSavedReports().filter((r) => r.id !== id);
    safeSet(STORAGE_KEYS.SAVED_REPORTS, list);
  },

  // Complete Database Export & Restore
  exportFullDatabase() {
    return {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      user: this.getUser(),
      preferences: this.getPreferences(),
      materials: this.getMaterials(true),
      accountAnalytics: this.getAccountAnalytics(),
      videoCheckpoints: this.getVideoCheckpoints(),
      schedules: this.getSchedules(),
      goals: this.getGoals(),
      notifications: this.getNotifications(),
      tasks: this.getTasks(),
      savedReports: this.getSavedReports(),
    };
  },

  importDatabase(data: any): { success: boolean; error?: string } {
    try {
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid backup file structure.' };
      }
      if (data.materials && Array.isArray(data.materials)) {
        safeSet(STORAGE_KEYS.MATERIALS, data.materials);
      }
      if (data.accountAnalytics && Array.isArray(data.accountAnalytics)) {
        safeSet(STORAGE_KEYS.ACCOUNT_ANALYTICS, data.accountAnalytics);
      }
      if (data.videoCheckpoints && Array.isArray(data.videoCheckpoints)) {
        safeSet(STORAGE_KEYS.VIDEO_CHECKPOINTS, data.videoCheckpoints);
      }
      if (data.schedules && Array.isArray(data.schedules)) {
        safeSet(STORAGE_KEYS.SCHEDULES, data.schedules);
      }
      if (data.goals && Array.isArray(data.goals)) {
        safeSet(STORAGE_KEYS.GOALS, data.goals);
      }
      if (data.tasks && Array.isArray(data.tasks)) {
        safeSet(STORAGE_KEYS.TASKS, data.tasks);
      }
      if (data.preferences) {
        safeSet(STORAGE_KEYS.PREFERENCES, data.preferences);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Import error' };
    }
  },

  resetToDemo(): void {
    safeSet(STORAGE_KEYS.MATERIALS, SAMPLE_MATERIALS);
    safeSet(STORAGE_KEYS.ACCOUNT_ANALYTICS, SAMPLE_ACCOUNT_ANALYTICS);
    safeSet(STORAGE_KEYS.VIDEO_CHECKPOINTS, SAMPLE_VIDEO_CHECKPOINTS);
    safeSet(STORAGE_KEYS.SCHEDULES, SAMPLE_SCHEDULES);
    safeSet(STORAGE_KEYS.GOALS, SAMPLE_GOALS);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, SAMPLE_NOTIFICATIONS);
    safeSet(STORAGE_KEYS.TASKS, SAMPLE_PRODUCTIVITY_TASKS);
    safeSet(STORAGE_KEYS.PREFERENCES, INITIAL_PREFERENCES);
    safeSet(STORAGE_KEYS.DEMO_MODE_ACTIVE, true);
  },

  clearAllRealData(): void {
    safeSet(STORAGE_KEYS.MATERIALS, []);
    safeSet(STORAGE_KEYS.ACCOUNT_ANALYTICS, []);
    safeSet(STORAGE_KEYS.VIDEO_CHECKPOINTS, []);
    safeSet(STORAGE_KEYS.SCHEDULES, []);
    safeSet(STORAGE_KEYS.GOALS, []);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, []);
    safeSet(STORAGE_KEYS.TASKS, []);
    safeSet(STORAGE_KEYS.SAVED_REPORTS, []);
    safeSet(STORAGE_KEYS.NEXT_MATERIAL_ID, 1);
    safeSet(STORAGE_KEYS.DEMO_MODE_ACTIVE, false);
  },
};
