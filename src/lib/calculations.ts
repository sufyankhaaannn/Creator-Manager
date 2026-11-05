import {
  AccountAnalyticsEntry,
  CheckpointInterval,
  OverallStatus,
  Platform,
  PlatformStatus,
  PublishingSchedule,
  VideoAnalyticsCheckpoint,
} from '../types/index';

/**
 * Calculates overall material status from platform publishing records
 * Rule 1: No published platforms and no scheduled platforms: in_working
 * Rule 2: No published platforms but at least one scheduled platform: scheduled
 * Rule 3: Some platforms published while others remain incomplete: in_progress
 * Rule 4: All intended platforms published: published
 */
export function calculateOverallMaterialStatus(
  targetPlatforms: Platform[],
  platformStatuses: Partial<Record<Platform, PlatformStatus>>
): OverallStatus {
  if (!targetPlatforms || targetPlatforms.length === 0) {
    return 'in_working';
  }

  const statuses = targetPlatforms.map((p) => platformStatuses[p] || 'in_working');
  const publishedCount = statuses.filter((s) => s === 'published').length;
  const scheduledCount = statuses.filter((s) => s === 'scheduled').length;

  if (publishedCount === targetPlatforms.length) {
    return 'published';
  }

  if (publishedCount > 0 && publishedCount < targetPlatforms.length) {
    return 'in_progress';
  }

  if (publishedCount === 0 && scheduledCount > 0) {
    return 'scheduled';
  }

  return 'in_working';
}

/**
 * Calculates combined follower snapshot total.
 * Followers/subscribers represent total audience at the time of entry.
 * Note: Combined total is a sum of snapshots, not unique individuals.
 */
export function calculateCombinedFollowerTotal(
  entries: AccountAnalyticsEntry[],
  selectedPlatforms?: Platform[]
): { total: number; platformCounts: Record<Platform, number>; latestDates: Record<Platform, string> } {
  const platformsToConsider: Platform[] = selectedPlatforms && selectedPlatforms.length > 0
    ? selectedPlatforms
    : ['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'];

  const platformCounts: Record<Platform, number> = {
    youtube_shorts: 0,
    tiktok: 0,
    instagram_reels: 0,
    facebook_reels: 0,
  };

  const latestDates: Record<Platform, string> = {
    youtube_shorts: '',
    tiktok: '',
    instagram_reels: '',
    facebook_reels: '',
  };

  for (const plat of platformsToConsider) {
    const platEntries = entries
      .filter((e) => e.platform === plat)
      .sort((a, b) => b.reportingDate.localeCompare(a.reportingDate));

    if (platEntries.length > 0) {
      platformCounts[plat] = platEntries[0].followerSnapshot;
      latestDates[plat] = platEntries[0].reportingDate;
    }
  }

  const total = Object.values(platformCounts).reduce((acc, curr) => acc + curr, 0);

  return { total, platformCounts, latestDates };
}

/**
 * Calculates net follower growth across a date range.
 * Compares latest snapshot vs earliest snapshot for each platform.
 */
export function calculateFollowerGrowth(
  entries: AccountAnalyticsEntry[],
  selectedPlatforms?: Platform[],
  startDate?: string,
  endDate?: string
): { netGrowth: number; byPlatform: Record<Platform, number> } {
  const platforms: Platform[] = selectedPlatforms && selectedPlatforms.length > 0
    ? selectedPlatforms
    : ['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'];

  const byPlatform: Record<Platform, number> = {
    youtube_shorts: 0,
    tiktok: 0,
    instagram_reels: 0,
    facebook_reels: 0,
  };

  for (const plat of platforms) {
    let filtered = entries.filter((e) => e.platform === plat);
    if (startDate) {
      filtered = filtered.filter((e) => e.reportingDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((e) => e.reportingDate <= endDate);
    }

    filtered.sort((a, b) => a.reportingDate.localeCompare(b.reportingDate));

    if (filtered.length >= 2) {
      const earliest = filtered[0].followerSnapshot;
      const latest = filtered[filtered.length - 1].followerSnapshot;
      byPlatform[plat] = latest - earliest;
    } else if (filtered.length === 1) {
      // Find the entry immediately prior to startDate if available
      if (startDate) {
        const priorEntries = entries
          .filter((e) => e.platform === plat && e.reportingDate < startDate)
          .sort((a, b) => b.reportingDate.localeCompare(a.reportingDate));
        if (priorEntries.length > 0) {
          byPlatform[plat] = filtered[0].followerSnapshot - priorEntries[0].followerSnapshot;
        }
      }
    }
  }

  const netGrowth = Object.values(byPlatform).reduce((acc, curr) => acc + curr, 0);
  return { netGrowth, byPlatform };
}

/**
 * Combined Views: Sum of daily account-level views for reporting period.
 * Strict rule: Never add account views and individual video views together.
 */
export function calculateAccountViews(
  entries: AccountAnalyticsEntry[],
  startDate?: string,
  endDate?: string,
  selectedPlatforms?: Platform[]
): {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  entriesCount: number;
  byPlatform: Record<Platform, { views: number; likes: number; comments: number; shares: number }>;
} {
  const platforms: Platform[] = selectedPlatforms && selectedPlatforms.length > 0
    ? selectedPlatforms
    : ['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'];

  let filtered = entries.filter((e) => platforms.includes(e.platform));
  if (startDate) {
    filtered = filtered.filter((e) => e.reportingDate >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((e) => e.reportingDate <= endDate);
  }

  const byPlatform: Record<Platform, { views: number; likes: number; comments: number; shares: number }> = {
    youtube_shorts: { views: 0, likes: 0, comments: 0, shares: 0 },
    tiktok: { views: 0, likes: 0, comments: 0, shares: 0 },
    instagram_reels: { views: 0, likes: 0, comments: 0, shares: 0 },
    facebook_reels: { views: 0, likes: 0, comments: 0, shares: 0 },
  };

  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;

  for (const entry of filtered) {
    totalViews += entry.dailyViews;
    totalLikes += entry.dailyLikes;
    totalComments += entry.dailyComments;
    totalShares += entry.dailyShares;

    if (byPlatform[entry.platform]) {
      byPlatform[entry.platform].views += entry.dailyViews;
      byPlatform[entry.platform].likes += entry.dailyLikes;
      byPlatform[entry.platform].comments += entry.dailyComments;
      byPlatform[entry.platform].shares += entry.dailyShares;
    }
  }

  return {
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    entriesCount: filtered.length,
    byPlatform,
  };
}

/**
 * Weighted engagement rate calculation.
 * Formula: ((totalLikes + totalComments + totalShares) / totalViews) * 100
 * Avoids simple averaging of platform percentages.
 */
export function calculateWeightedEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  views: number
): number {
  if (views <= 0) return 0;
  const rate = ((likes + comments + shares) / views) * 100;
  return Number(rate.toFixed(2));
}

export interface CheckpointDelta {
  checkpoint: CheckpointInterval;
  platform: Platform;
  recordedAt: string;
  cumulativeViews: number;
  cumulativeLikes: number;
  cumulativeComments: number;
  cumulativeShares: number;
  deltaViews: number;
  deltaLikes: number;
  deltaComments: number;
  deltaShares: number;
}

/**
 * Calculates incremental checkpoint deltas for video analytics.
 * Rule: Checkpoints store cumulative metrics.
 * Rule: Never sum cumulative values. Delta = current cumulative - previous cumulative within the same platform.
 */
export function calculateCheckpointDeltas(
  checkpoints: VideoAnalyticsCheckpoint[],
  targetPlatform?: Platform
): CheckpointDelta[] {
  if (!checkpoints || checkpoints.length === 0) return [];

  const orderWeight: Record<CheckpointInterval, number> = {
    '24h': 1,
    '48h': 2,
    '7d': 3,
    '30d': 4,
    'custom': 5,
  };

  const platforms: Platform[] = targetPlatform
    ? [targetPlatform]
    : Array.from(new Set(checkpoints.map((c) => c.platform)));

  const results: CheckpointDelta[] = [];

  for (const plat of platforms) {
    const platCheckpoints = checkpoints
      .filter((c) => c.platform === plat)
      .sort((a, b) => {
        const diff = (orderWeight[a.checkpoint] || 99) - (orderWeight[b.checkpoint] || 99);
        if (diff !== 0) return diff;
        return a.recordedAt.localeCompare(b.recordedAt);
      });

    for (let i = 0; i < platCheckpoints.length; i++) {
      const current = platCheckpoints[i];
      const prev = i > 0 ? platCheckpoints[i - 1] : null;

      const deltaViews = prev ? Math.max(0, current.cumulativeViews - prev.cumulativeViews) : current.cumulativeViews;
      const deltaLikes = prev ? Math.max(0, current.cumulativeLikes - prev.cumulativeLikes) : current.cumulativeLikes;
      const deltaComments = prev ? Math.max(0, current.cumulativeComments - prev.cumulativeComments) : current.cumulativeComments;
      const deltaShares = prev ? Math.max(0, current.cumulativeShares - prev.cumulativeShares) : current.cumulativeShares;

      results.push({
        checkpoint: current.checkpoint,
        platform: current.platform,
        recordedAt: current.recordedAt,
        cumulativeViews: current.cumulativeViews,
        cumulativeLikes: current.cumulativeLikes,
        cumulativeComments: current.cumulativeComments,
        cumulativeShares: current.cumulativeShares,
        deltaViews,
        deltaLikes,
        deltaComments,
        deltaShares,
      });
    }
  }

  return results;
}

/**
 * Calculates consistency metrics against actual scheduled publishing plans.
 * Does NOT impose an arbitrary daily schedule; evaluates planned vs completed.
 */
export function calculatePublishingConsistency(
  schedules: PublishingSchedule[],
  nowIso = new Date().toISOString()
): {
  plannedCount: number;
  completedCount: number;
  overdueCount: number;
  onTimePercentage: number;
  currentStreakDays: number;
  longestStreakDays: number;
} {
  const activeSchedules = schedules.filter((s) => s.status !== 'cancelled');
  const plannedCount = activeSchedules.length;
  const completedCount = activeSchedules.filter((s) => s.status === 'published').length;

  const overdueCount = activeSchedules.filter((s) => {
    if (s.status === 'overdue') return true;
    if (s.status === 'scheduled' && s.plannedPublishAt < nowIso) return true;
    return false;
  }).length;

  const onTimePercentage = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 100;

  // Calculate streak based on completed publication dates
  const publishedDates = Array.from(
    new Set(
      activeSchedules
        .filter((s) => s.status === 'published' && s.actualPublishAt)
        .map((s) => (s.actualPublishAt as string).slice(0, 10))
    )
  ).sort();

  let currentStreakDays = 0;
  let longestStreakDays = 0;

  if (publishedDates.length > 0) {
    let tempStreak = 1;
    longestStreakDays = 1;

    for (let i = 1; i < publishedDates.length; i++) {
      const prev = new Date(publishedDates[i - 1]);
      const curr = new Date(publishedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreakDays) longestStreakDays = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    const todayStr = nowIso.slice(0, 10);
    const lastPublishedDate = publishedDates[publishedDates.length - 1];
    const daysSinceLast = Math.round(
      (new Date(todayStr).getTime() - new Date(lastPublishedDate).getTime()) / (1000 * 3600 * 24)
    );

    if (daysSinceLast <= 1) {
      currentStreakDays = tempStreak;
    } else {
      currentStreakDays = 0;
    }
  }

  return {
    plannedCount,
    completedCount,
    overdueCount,
    onTimePercentage,
    currentStreakDays,
    longestStreakDays,
  };
}

/**
 * Rule-based performance intelligence generator.
 * Strictly adheres to truth in reporting:
 * - Never invents facts or causes
 * - Shows data coverage and limitations
 * - Highlights missing checkpoints and trends
 */
export function generateAutomatedInsights(params: {
  accountEntries: AccountAnalyticsEntry[];
  checkpoints: VideoAnalyticsCheckpoint[];
  schedules: PublishingSchedule[];
  materialsCount: number;
}): {
  keyFindings: string[];
  recommendations: string[];
  dataCoverageNote: string;
} {
  const { accountEntries, checkpoints, schedules, materialsCount } = params;
  const keyFindings: string[] = [];
  const recommendations: string[] = [];

  if (accountEntries.length === 0 && checkpoints.length === 0) {
    return {
      keyFindings: ['No analytics data entered yet. Begin by logging your first daily account snapshot.'],
      recommendations: ['Create materials in the Material Hub and set scheduled platform dates.'],
      dataCoverageNote: 'Zero records in database. Enter data manually to unlock intelligent analytics.',
    };
  }

  // Analyze platform view distribution
  const viewsByPlatform = calculateAccountViews(accountEntries);
  const platformsWithViews = (Object.keys(viewsByPlatform.byPlatform) as Platform[])
    .map((plat) => ({
      platform: plat,
      views: viewsByPlatform.byPlatform[plat].views,
      likes: viewsByPlatform.byPlatform[plat].likes,
      comments: viewsByPlatform.byPlatform[plat].comments,
      shares: viewsByPlatform.byPlatform[plat].shares,
    }))
    .sort((a, b) => b.views - a.views);

  if (platformsWithViews.length > 0 && platformsWithViews[0].views > 0) {
    const top = platformsWithViews[0];
    const topEngRate = calculateWeightedEngagementRate(
      top.likes,
      top.comments,
      top.shares,
      top.views
    );
    keyFindings.push(
      `Leading Platform by Views: ${formatPlatformName(top.platform)} accounts for ${top.views.toLocaleString()} daily views with a ${topEngRate}% engagement rate.`
    );
  }

  // Check for overdue or missing checkpoints
  const overdueSchedules = schedules.filter(
    (s) => s.status === 'overdue' || (s.status === 'scheduled' && s.plannedPublishAt < new Date().toISOString())
  );
  if (overdueSchedules.length > 0) {
    keyFindings.push(
      `Action Needed: ${overdueSchedules.length} scheduled upload(s) are overdue and require confirmation or rescheduling.`
    );
    recommendations.push(
      'Review pending uploads on the Calendar and confirm publication with the exact timestamp.'
    );
  }

  // Checkpoint compliance
  const publishedSchedules = schedules.filter((s) => s.status === 'published');
  if (publishedSchedules.length > 0 && checkpoints.length < publishedSchedules.length) {
    keyFindings.push(
      `Checkpoint Gaps: You have ${publishedSchedules.length} published uploads but only ${checkpoints.length} recorded video checkpoints.`
    );
    recommendations.push(
      'Log 24h and 48h analytics checkpoints for recent uploads to track retention and reach accurately.'
    );
  }

  // Publishing consistency
  const consistency = calculatePublishingConsistency(schedules);
  if (consistency.plannedCount > 0) {
    keyFindings.push(
      `Schedule Fidelity: ${consistency.onTimePercentage}% on-time completion across ${consistency.plannedCount} planned uploads. Current streak: ${consistency.currentStreakDays} days.`
    );
  }

  const dataCoverageNote = `Intelligence based on ${accountEntries.length} account analytics records, ${checkpoints.length} video checkpoints, and ${materialsCount} materials. No AI speculation applied.`;

  return { keyFindings, recommendations, dataCoverageNote };
}

export function formatPlatformName(platform: Platform): string {
  switch (platform) {
    case 'youtube_shorts':
      return 'YouTube Shorts';
    case 'tiktok':
      return 'TikTok';
    case 'instagram_reels':
      return 'Instagram Reels';
    case 'facebook_reels':
      return 'Facebook Reels';
  }
}
