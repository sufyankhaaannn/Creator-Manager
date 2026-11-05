export type Platform = 'youtube_shorts' | 'tiktok' | 'instagram_reels' | 'facebook_reels';

export const PLATFORM_CONFIG: Record<
  Platform,
  { name: string; icon: string; brandColor: string; bgGradient: string; maxLen: number }
> = {
  youtube_shorts: {
    name: 'YouTube Shorts',
    icon: 'Youtube',
    brandColor: '#FF0000',
    bgGradient: 'from-red-500/20 to-transparent',
    maxLen: 5000,
  },
  tiktok: {
    name: 'TikTok',
    icon: 'Video',
    brandColor: '#00F2FE',
    bgGradient: 'from-cyan-500/20 to-transparent',
    maxLen: 2200,
  },
  instagram_reels: {
    name: 'Instagram Reels',
    icon: 'Instagram',
    brandColor: '#E1306C',
    bgGradient: 'from-pink-500/20 to-transparent',
    maxLen: 2200,
  },
  facebook_reels: {
    name: 'Facebook Reels',
    icon: 'Facebook',
    brandColor: '#1877F2',
    bgGradient: 'from-blue-500/20 to-transparent',
    maxLen: 2000,
  },
};

export type OverallStatus = 'in_working' | 'scheduled' | 'in_progress' | 'published';
export type PlatformStatus = 'in_working' | 'scheduled' | 'published';

export interface Material {
  id: string; // e.g. MAT-001
  numericId: number;
  title: string;
  videoText: string; // Continuous passage displayed throughout video, NOT broken into sentences
  youtubeDescription: string;
  tiktokCaption: string;
  instagramDescription: string;
  facebookDescription: string;
  imageReferences: string[]; // 5-6 visual cues/references
  thumbnailPrompt: string;
  internalNotes?: string;
  tags: string[];
  category: string;
  targetPlatforms: Platform[];
  platformStatuses: Partial<Record<Platform, PlatformStatus>>;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  deletedAt?: string | null; // For 30-day retention
}

export type AccountEntryType = 'all_time' | 'daily';

export interface AccountAnalyticsEntry {
  id: string;
  platform: Platform;
  reportingDate: string; // YYYY-MM-DD
  entryType?: AccountEntryType; // 'all_time' for lifetime channel stats, 'daily' for single-day insights
  followerSnapshot: number; // Cumulative total followers/subscribers
  dailyViews: number; // Single-day views (for daily logs; 0 or delta if all_time)
  dailyLikes: number;
  dailyComments: number;
  dailyShares: number;
  allTimeViews?: number; // Lifetime cumulative channel views
  allTimeLikes?: number; // Lifetime cumulative channel likes
  allTimeComments?: number; // Lifetime cumulative channel comments
  allTimeShares?: number; // Lifetime cumulative channel shares
  allTimeVideos?: number; // Lifetime cumulative published videos/shorts on channel
  profileVisits?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AllTimePlatformStats {
  platform: Platform;
  followers: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  videosCount?: number;
  lastUpdated: string;
  source: 'all_time_snapshot' | 'daily_aggregate';
}

export type CheckpointInterval = '24h' | '48h' | '7d' | '30d' | 'custom';

export interface VideoAnalyticsCheckpoint {
  id: string;
  materialId: string;
  platform: Platform;
  checkpoint: CheckpointInterval;
  recordedAt: string; // ISO or YYYY-MM-DD
  cumulativeViews: number;
  cumulativeLikes: number;
  cumulativeComments: number;
  cumulativeShares: number;
  saves?: number;
  reach?: number;
  avgWatchTimeSeconds?: number;
  completionRate?: number; // 0-100%
  followersGained?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublishingSchedule {
  id: string;
  materialId: string;
  platform: Platform;
  plannedPublishAt: string; // ISO in UTC
  actualPublishAt?: string; // ISO in UTC
  status: 'scheduled' | 'published' | 'overdue' | 'cancelled';
  reminders: ('30m' | '15m' | '5m' | 'at_time' | 'custom')[];
  customReminderMinutes?: number;
  publishedUrl?: string;
  checklist: {
    videoExported: boolean;
    captionSelected: boolean;
    thumbnailReady: boolean;
    videoUploaded: boolean;
    publicationConfirmed: boolean;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalCategory =
  | 'content_production'
  | 'views'
  | 'audience_growth'
  | 'engagement'
  | 'consistency'
  | 'data_management';

export type GoalTargetType =
  | 'weekly_uploads'
  | 'views'
  | 'follower_growth'
  | 'engagement_rate'
  | 'daily_analytics_entries'
  | 'custom';

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  targetType: GoalTargetType;
  period: GoalPeriod;
  targetValue: number;
  currentValue: number;
  platformScope: 'all' | Platform;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'at_risk' | 'paused';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  type: 'reminder' | 'overdue' | 'goal' | 'checkpoint' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  platform?: Platform;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  accentTheme?: 'indigo' | 'emerald' | 'violet' | 'sky';
  timezone: string; // e.g. "Asia/Karachi"
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  timeFormat: '12h' | '24h';
  defaultDateRange: '7d' | '30d' | '90d' | 'all';
  defaultLandingPage: string;
  notifications: {
    browserPush: boolean;
    inApp: boolean;
    reminders: boolean;
    goals: boolean;
    overdueAlerts: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'administrator' | 'editor';
  avatarSeed: string;
  firstTimeSetupCompleted: boolean;
}

export interface SavedReport {
  id: string;
  title: string;
  reportType: 'weekly' | 'monthly' | 'custom' | 'platform' | 'video';
  dateRange: { start: string; end: string };
  platform?: Platform;
  generatedAt: string;
  metricsSummary: {
    accountViews: number;
    followerGrowth: number;
    publishedVideos: number;
    avgEngagementRate: number;
  };
  observations: string[];
  sourceRecordsCount: number;
  lastSourceUpdated: string;
}

export interface ProductivityTask {
  id: string;
  title: string;
  category: 'analytics' | 'material' | 'scheduling' | 'verification';
  completed: boolean;
  dueDate: string;
  materialId?: string;
  platform?: Platform;
}
