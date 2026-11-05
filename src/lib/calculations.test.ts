import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOverallMaterialStatus,
  calculateCombinedFollowerTotal,
  calculateFollowerGrowth,
  calculateAccountViews,
  calculateAllTimePlatformStats,
  calculateWeightedEngagementRate,
  calculateCheckpointDeltas,
  calculatePublishingConsistency,
  generateAutomatedInsights,
} from './calculations';
import {
  AccountAnalyticsEntry,
  Platform,
  PublishingSchedule,
  VideoAnalyticsCheckpoint,
} from '../types/index';

test('Material overall status calculation follows creator business rules', () => {
  const allPlatforms: Platform[] = ['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'];

  // 1. No published platforms and no scheduled platforms -> in_working
  assert.equal(
    calculateOverallMaterialStatus(allPlatforms, {
      youtube_shorts: 'in_working',
      tiktok: 'in_working',
    }),
    'in_working'
  );

  // 2. No published platforms, but at least one scheduled platform -> scheduled
  assert.equal(
    calculateOverallMaterialStatus(allPlatforms, {
      youtube_shorts: 'scheduled',
      tiktok: 'in_working',
    }),
    'scheduled'
  );

  // 3. Some platforms published while others remain incomplete -> in_progress
  assert.equal(
    calculateOverallMaterialStatus(allPlatforms, {
      youtube_shorts: 'published',
      tiktok: 'scheduled',
      instagram_reels: 'in_working',
    }),
    'in_progress'
  );

  // 4. All intended target platforms published -> published
  assert.equal(
    calculateOverallMaterialStatus(allPlatforms, {
      youtube_shorts: 'published',
      tiktok: 'published',
      instagram_reels: 'published',
      facebook_reels: 'published',
    }),
    'published'
  );

  // 5. If material only targets 2 platforms (e.g. YouTube & TikTok), and both are published -> published
  assert.equal(
    calculateOverallMaterialStatus(['youtube_shorts', 'tiktok'], {
      youtube_shorts: 'published',
      tiktok: 'published',
    }),
    'published'
  );
});

test('Combined follower snapshot calculates sum of latest snapshots without double-counting history', () => {
  const entries: AccountAnalyticsEntry[] = [
    {
      id: '1',
      platform: 'youtube_shorts',
      reportingDate: '2026-11-01',
      followerSnapshot: 10000,
      dailyViews: 500,
      dailyLikes: 50,
      dailyComments: 10,
      dailyShares: 5,
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
    {
      id: '2',
      platform: 'youtube_shorts',
      reportingDate: '2026-11-02',
      followerSnapshot: 10250, // latest for YT
      dailyViews: 800,
      dailyLikes: 80,
      dailyComments: 15,
      dailyShares: 10,
      createdAt: '2026-11-02T00:00:00Z',
      updatedAt: '2026-11-02T00:00:00Z',
    },
    {
      id: '3',
      platform: 'tiktok',
      reportingDate: '2026-11-01',
      followerSnapshot: 25000,
      dailyViews: 2000,
      dailyLikes: 200,
      dailyComments: 30,
      dailyShares: 40,
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
    {
      id: '4',
      platform: 'tiktok',
      reportingDate: '2026-11-02',
      followerSnapshot: 25800, // latest for TT
      dailyViews: 3000,
      dailyLikes: 350,
      dailyComments: 50,
      dailyShares: 60,
      createdAt: '2026-11-02T00:00:00Z',
      updatedAt: '2026-11-02T00:00:00Z',
    },
  ];

  const result = calculateCombinedFollowerTotal(entries);
  // YT (10250) + TT (25800) + IG (0) + FB (0) = 36050
  assert.equal(result.total, 36050);
  assert.equal(result.platformCounts.youtube_shorts, 10250);
  assert.equal(result.platformCounts.tiktok, 25800);
});

test('Follower growth calculates snapshot differential correctly', () => {
  const entries: AccountAnalyticsEntry[] = [
    {
      id: '1',
      platform: 'youtube_shorts',
      reportingDate: '2026-11-01',
      followerSnapshot: 1000,
      dailyViews: 100,
      dailyLikes: 10,
      dailyComments: 2,
      dailyShares: 1,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      platform: 'youtube_shorts',
      reportingDate: '2026-11-03',
      followerSnapshot: 1075,
      dailyViews: 120,
      dailyLikes: 15,
      dailyComments: 3,
      dailyShares: 2,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const growth = calculateFollowerGrowth(entries, ['youtube_shorts']);
  assert.equal(growth.netGrowth, 75);
  assert.equal(growth.byPlatform.youtube_shorts, 75);
});

test('Documented weighted engagement rate calculation', () => {
  // ((likes + comments + shares) / views) * 100
  // 50 likes + 10 comments + 5 shares = 65 interactions. 1000 views -> 6.5%
  const rate = calculateWeightedEngagementRate(50, 10, 5, 1000);
  assert.equal(rate, 6.5);

  // 0 views gives 0 without dividing by zero error
  assert.equal(calculateWeightedEngagementRate(10, 5, 2, 0), 0);
});

test('Checkpoint deltas compute incremental changes without adding cumulative metrics', () => {
  const checkpoints: VideoAnalyticsCheckpoint[] = [
    {
      id: 'cp1',
      materialId: 'MAT-001',
      platform: 'youtube_shorts',
      checkpoint: '24h',
      recordedAt: '2026-11-01T10:00:00Z',
      cumulativeViews: 1000,
      cumulativeLikes: 100,
      cumulativeComments: 20,
      cumulativeShares: 10,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'cp2',
      materialId: 'MAT-001',
      platform: 'youtube_shorts',
      checkpoint: '48h',
      recordedAt: '2026-11-02T10:00:00Z',
      cumulativeViews: 1600,
      cumulativeLikes: 150,
      cumulativeComments: 25,
      cumulativeShares: 15,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const deltas = calculateCheckpointDeltas(checkpoints);
  assert.equal(deltas.length, 2);

  // 24h baseline delta equals cumulative
  assert.equal(deltas[0].deltaViews, 1000);
  assert.equal(deltas[0].deltaLikes, 100);

  // 48h checkpoint incremental: 1600 - 1000 = 600
  assert.equal(deltas[1].deltaViews, 600);
  assert.equal(deltas[1].deltaLikes, 50);
  assert.equal(deltas[1].deltaComments, 5);
  assert.equal(deltas[1].deltaShares, 5);
});

test('Publishing consistency reflects actual planned schedule rather than arbitrary daily quotas', () => {
  const nowIso = '2026-11-05T12:00:00Z';
  const schedules: PublishingSchedule[] = [
    {
      id: 's1',
      materialId: 'MAT-001',
      platform: 'youtube_shorts',
      plannedPublishAt: '2026-11-01T10:00:00Z',
      actualPublishAt: '2026-11-01T10:05:00Z',
      status: 'published',
      reminders: ['30m'],
      checklist: {
        videoExported: true,
        captionSelected: true,
        thumbnailReady: true,
        videoUploaded: true,
        publicationConfirmed: true,
      },
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 's2',
      materialId: 'MAT-001',
      platform: 'tiktok',
      plannedPublishAt: '2026-11-02T10:00:00Z',
      actualPublishAt: '2026-11-02T10:02:00Z',
      status: 'published',
      reminders: ['15m'],
      checklist: {
        videoExported: true,
        captionSelected: true,
        thumbnailReady: true,
        videoUploaded: true,
        publicationConfirmed: true,
      },
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 's3',
      materialId: 'MAT-002',
      platform: 'instagram_reels',
      plannedPublishAt: '2026-11-04T10:00:00Z',
      status: 'overdue',
      reminders: ['5m'],
      checklist: {
        videoExported: true,
        captionSelected: false,
        thumbnailReady: false,
        videoUploaded: false,
        publicationConfirmed: false,
      },
      createdAt: '',
      updatedAt: '',
    },
  ];

  const consistency = calculatePublishingConsistency(schedules, nowIso);
  assert.equal(consistency.plannedCount, 3);
  assert.equal(consistency.completedCount, 2);
  assert.equal(consistency.overdueCount, 1);
  assert.equal(consistency.onTimePercentage, 67); // 2/3 = 66.67% -> 67%
});

test('calculateAllTimePlatformStats accurately aggregates pure all-time data across platforms', () => {
  const entries: AccountAnalyticsEntry[] = [
    {
      id: 'at_yt',
      platform: 'youtube_shorts',
      reportingDate: '2026-11-05',
      entryType: 'all_time',
      followerSnapshot: 15400,
      dailyViews: 0,
      dailyLikes: 0,
      dailyComments: 0,
      dailyShares: 0,
      allTimeViews: 540000,
      allTimeLikes: 42000,
      allTimeComments: 3100,
      allTimeShares: 1200,
      allTimeVideos: 45,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'at_tt',
      platform: 'tiktok',
      reportingDate: '2026-11-05',
      entryType: 'all_time',
      followerSnapshot: 28000,
      dailyViews: 0,
      dailyLikes: 0,
      dailyComments: 0,
      dailyShares: 0,
      allTimeViews: 850000,
      allTimeLikes: 95000,
      allTimeComments: 6400,
      allTimeShares: 5300,
      allTimeVideos: 62,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const stats = calculateAllTimePlatformStats(entries);
  // Combined Views: 540,000 + 850,000 = 1,390,000
  assert.equal(stats.combined.views, 1390000);
  // Combined Followers: 15,400 + 28,000 = 43,400
  assert.equal(stats.combined.followers, 43400);
  // Combined Videos: 45 + 62 = 107
  assert.equal(stats.combined.videosCount, 107);
  // Platform individual check
  assert.equal(stats.byPlatform.youtube_shorts.views, 540000);
  assert.equal(stats.byPlatform.youtube_shorts.followers, 15400);
  assert.equal(stats.byPlatform.tiktok.views, 850000);

  // calculateAccountViews with no date boundaries returns the true All-Time total
  const viewsCalc = calculateAccountViews(entries);
  assert.equal(viewsCalc.isAllTime, true);
  assert.equal(viewsCalc.totalViews, 1390000);
});

test('calculateAllTimePlatformStats seamlessly integrates all-time snapshot with subsequent daily logs', () => {
  const entries: AccountAnalyticsEntry[] = [
    {
      id: 'at_yt',
      platform: 'youtube_shorts',
      reportingDate: '2026-11-01',
      entryType: 'all_time',
      followerSnapshot: 10000,
      dailyViews: 0,
      dailyLikes: 0,
      dailyComments: 0,
      dailyShares: 0,
      allTimeViews: 100000,
      allTimeLikes: 5000,
      allTimeComments: 400,
      allTimeShares: 200,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'd_yt_1',
      platform: 'youtube_shorts',
      reportingDate: '2026-11-02',
      entryType: 'daily',
      followerSnapshot: 10050,
      dailyViews: 2500,
      dailyLikes: 150,
      dailyComments: 10,
      dailyShares: 5,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'd_yt_2',
      platform: 'youtube_shorts',
      reportingDate: '2026-11-03',
      entryType: 'daily',
      followerSnapshot: 10120,
      dailyViews: 3500,
      dailyLikes: 200,
      dailyComments: 15,
      dailyShares: 10,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const stats = calculateAllTimePlatformStats(entries);
  // Base 100,000 + 2,500 + 3,500 = 106,000 views
  assert.equal(stats.byPlatform.youtube_shorts.views, 106000);
  // Latest follower count: 10,120
  assert.equal(stats.byPlatform.youtube_shorts.followers, 10120);
  // Likes: 5000 + 150 + 200 = 5350
  assert.equal(stats.byPlatform.youtube_shorts.likes, 5350);
});

