import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { StorageService } from './storage';
import { calculateAccountViews, calculateCombinedFollowerTotal, formatPlatformName } from './calculations';

/**
 * Generates an Excel (.xlsx) workbook with separate sheets for each module
 */
export function exportToExcelWorkbook(): void {
  const data = StorageService.exportFullDatabase();
  const wb = XLSX.utils.book_new();

  // Sheet 1: Account Analytics
  const accountRows = data.accountAnalytics.map((a) => {
    const isAllTime = a.entryType === 'all_time' || (a.allTimeViews !== undefined && a.allTimeViews > 0);
    return {
      'Date / As Of': a.reportingDate,
      'Platform': formatPlatformName(a.platform),
      'Entry Type': isAllTime ? 'All-Time Snapshot' : 'Daily Insight',
      'Followers / Subscribers': a.followerSnapshot,
      'Views': isAllTime ? (a.allTimeViews || a.dailyViews) : a.dailyViews,
      'Likes': isAllTime ? (a.allTimeLikes ?? a.dailyLikes) : a.dailyLikes,
      'Comments': isAllTime ? (a.allTimeComments ?? a.dailyComments) : a.dailyComments,
      'Shares': isAllTime ? (a.allTimeShares ?? a.dailyShares) : a.dailyShares,
      'Total Videos': a.allTimeVideos || 0,
      'Profile Visits': a.profileVisits || 0,
      'Last Updated': a.updatedAt,
    };
  });
  const wsAccount = XLSX.utils.json_to_sheet(accountRows);
  XLSX.utils.book_append_sheet(wb, wsAccount, 'Account Analytics');

  // Sheet 2: Video Analytics Checkpoints
  const videoRows = data.videoCheckpoints.map((v) => ({
    'Material ID': v.materialId,
    'Platform': formatPlatformName(v.platform),
    'Checkpoint': v.checkpoint,
    'Recorded At': v.recordedAt,
    'Cumulative Views': v.cumulativeViews,
    'Cumulative Likes': v.cumulativeLikes,
    'Cumulative Comments': v.cumulativeComments,
    'Cumulative Shares': v.cumulativeShares,
    'Saves': v.saves || 0,
    'Reach': v.reach || 0,
    'Avg Watch Time (s)': v.avgWatchTimeSeconds || 0,
    'Completion Rate (%)': v.completionRate || 0,
    'Followers Gained': v.followersGained || 0,
  }));
  const wsVideo = XLSX.utils.json_to_sheet(videoRows);
  XLSX.utils.book_append_sheet(wb, wsVideo, 'Video Checkpoints');

  // Sheet 3: Materials Hub
  const materialRows = data.materials.map((m) => ({
    'ID': m.id,
    'Title': m.title,
    'Category': m.category,
    'Tags': m.tags.join(', '),
    'Target Platforms': m.targetPlatforms.map(formatPlatformName).join(', '),
    'Video Text (Continuous)': m.videoText,
    'YouTube Description': m.youtubeDescription,
    'TikTok Caption': m.tiktokCaption,
    'Instagram Description': m.instagramDescription,
    'Facebook Description': m.facebookDescription,
    'Image Cues Count': m.imageReferences.length,
    'Thumbnail Prompt': m.thumbnailPrompt,
    'Created At': m.createdAt,
  }));
  const wsMaterials = XLSX.utils.json_to_sheet(materialRows);
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'Materials');

  // Sheet 4: Publishing Schedules
  const scheduleRows = data.schedules.map((s) => ({
    'Material ID': s.materialId,
    'Platform': formatPlatformName(s.platform),
    'Planned Time (UTC)': s.plannedPublishAt,
    'Actual Time (UTC)': s.actualPublishAt || 'N/A',
    'Status': s.status,
    'Reminders': s.reminders.join(', '),
    'Video URL': s.publishedUrl || '',
  }));
  const wsSchedules = XLSX.utils.json_to_sheet(scheduleRows);
  XLSX.utils.book_append_sheet(wb, wsSchedules, 'Schedules');

  // Sheet 5: Goals & Targets
  const goalRows = data.goals.map((g) => ({
    'Title': g.title,
    'Category': g.category,
    'Period': g.period,
    'Target Value': g.targetValue,
    'Current Value': g.currentValue,
    'Status': g.status,
    'Start Date': g.startDate,
    'End Date': g.endDate,
  }));
  const wsGoals = XLSX.utils.json_to_sheet(goalRows);
  XLSX.utils.book_append_sheet(wb, wsGoals, 'Goals');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `AbyssalFacts-Creator-Report-${dateStr}.xlsx`);
}

/**
 * Exports CSV for account analytics or video analytics
 */
export function exportToCsv(type: 'account' | 'video' | 'materials'): void {
  const data = StorageService.exportFullDatabase();
  let content = '';
  let filename = '';

  if (type === 'account') {
    const headers = ['Date', 'Platform', 'Type', 'Followers', 'Views', 'Likes', 'Comments', 'Shares', 'Videos'];
    const rows = data.accountAnalytics.map((a) => {
      const isAllTime = a.entryType === 'all_time' || (a.allTimeViews !== undefined && a.allTimeViews > 0);
      return [
        a.reportingDate,
        formatPlatformName(a.platform),
        isAllTime ? 'All-Time' : 'Daily',
        a.followerSnapshot,
        isAllTime ? (a.allTimeViews || a.dailyViews) : a.dailyViews,
        isAllTime ? (a.allTimeLikes ?? a.dailyLikes) : a.dailyLikes,
        isAllTime ? (a.allTimeComments ?? a.dailyComments) : a.dailyComments,
        isAllTime ? (a.allTimeShares ?? a.dailyShares) : a.dailyShares,
        a.allTimeVideos || 0,
      ];
    });
    content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    filename = `abyssalfacts-account-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (type === 'video') {
    const headers = ['Material ID', 'Platform', 'Checkpoint', 'Cumulative Views', 'Likes', 'Comments', 'Shares', 'Completion Rate'];
    const rows = data.videoCheckpoints.map((v) => [
      v.materialId,
      v.platform,
      v.checkpoint,
      v.cumulativeViews,
      v.cumulativeLikes,
      v.cumulativeComments,
      v.cumulativeShares,
      v.completionRate || '',
    ]);
    content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    filename = `abyssalfacts-video-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    const headers = ['ID', 'Title', 'Category', 'Created Date'];
    const rows = data.materials.map((m) => [
      m.id,
      `"${m.title.replace(/"/g, '""')}"`,
      m.category,
      m.createdAt.slice(0, 10),
    ]);
    content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    filename = `abyssalfacts-materials-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports complete JSON backup
 */
export function exportToJson(): void {
  const data = StorageService.exportFullDatabase();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `abyssalfacts-data-${new Date().toISOString().slice(0, 10)}.json`);
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive PDF report with Arctic Glass branding
 */
export function generatePdfReport(reportTitle = 'Weekly Intelligence Report'): void {
  const data = StorageService.exportFullDatabase();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const followers = calculateCombinedFollowerTotal(data.accountAnalytics);
  const views = calculateAccountViews(data.accountAnalytics);
  const dateStr = new Date().toLocaleDateString('en-GB');

  // Header banner
  doc.setFillColor(8, 13, 20); // Deep Midnight
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(101, 223, 255); // Arctic Cyan
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ABYSSALFACTS COMMAND CENTER', 14, 16);

  doc.setTextColor(181, 242, 255); // Ice Highlight
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(reportTitle.toUpperCase(), 14, 25);

  doc.setTextColor(113, 134, 156); // Steel Slate
  doc.setFontSize(9);
  doc.text(`Generated: ${dateStr} | Timezone: Asia/Karachi | Admin: ${data.user.email}`, 14, 32);

  // Key KPI Summary Boxes
  doc.setDrawColor(101, 223, 255);
  doc.setFillColor(17, 28, 41);

  // Box 1: Combined Views
  doc.roundedRect(14, 46, 56, 26, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(113, 134, 156);
  doc.text('COMBINED ACCOUNT VIEWS', 18, 53);
  doc.setFontSize(15);
  doc.setTextColor(101, 223, 255);
  doc.text(views.totalViews.toLocaleString(), 18, 64);

  // Box 2: Combined Audience
  doc.roundedRect(77, 46, 56, 26, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(113, 134, 156);
  doc.text('COMBINED AUDIENCE TOTAL', 81, 53);
  doc.setFontSize(15);
  doc.setTextColor(181, 242, 255);
  doc.text(followers.total.toLocaleString(), 81, 64);

  // Box 3: Materials
  doc.roundedRect(140, 46, 56, 26, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(113, 134, 156);
  doc.text('MATERIALS PRODUCED', 144, 53);
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(data.materials.length.toString(), 144, 64);

  // Platform Breakdown Table
  let y = 85;
  doc.setFontSize(11);
  doc.setTextColor(8, 13, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Platform Performance Snapshot', 14, y);

  y += 7;
  doc.setFillColor(235, 245, 250);
  doc.rect(14, y - 5, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(50, 70, 90);
  doc.text('PLATFORM', 18, y);
  doc.text('AUDIENCE SNAPSHOT', 75, y);
  doc.text('DAILY VIEWS LOGGED', 125, y);
  doc.text('ENGAGEMENT RATE', 165, y);

  const platforms: ('youtube_shorts' | 'tiktok' | 'instagram_reels' | 'facebook_reels')[] = [
    'youtube_shorts',
    'tiktok',
    'instagram_reels',
    'facebook_reels',
  ];

  platforms.forEach((plat) => {
    y += 8;
    const count = followers.platformCounts[plat] || 0;
    const pViews = views.byPlatform[plat]?.views || 0;
    const pLikes = views.byPlatform[plat]?.likes || 0;
    const pComments = views.byPlatform[plat]?.comments || 0;
    const pShares = views.byPlatform[plat]?.shares || 0;
    const engRate = pViews > 0 ? (((pLikes + pComments + pShares) / pViews) * 100).toFixed(2) : '0.00';

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 30, 45);
    doc.text(formatPlatformName(plat), 18, y);
    doc.text(count.toLocaleString(), 75, y);
    doc.text(pViews.toLocaleString(), 125, y);
    doc.text(`${engRate}%`, 165, y);
    doc.setDrawColor(220, 230, 240);
    doc.line(14, y + 2, 196, y + 2);
  });

  // Recent Materials & Scheduled Items
  y += 18;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(8, 13, 20);
  doc.text('Top Content Materials & Video Text Samples', 14, y);

  const recent = data.materials.slice(0, 3);
  recent.forEach((m) => {
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(7, 142, 174);
    doc.text(`[${m.id}] ${m.title}`, 14, y);

    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 95, 110);
    const splitText = doc.splitTextToSize(`Video Text: "${m.videoText}"`, 182);
    doc.text(splitText.slice(0, 2), 14, y);
    y += Math.min(splitText.length, 2) * 4;
  });

  // Footer notes & data integrity notice
  doc.setFontSize(7);
  doc.setTextColor(130, 145, 160);
  doc.text(
    'Notice: Followers/subscribers represent latest available platform snapshots. Combined views reflect manual account-level daily records. No unofficial scraping used.',
    14,
    285
  );

  const dateFileStr = new Date().toISOString().slice(0, 10);
  doc.save(`AbyssalFacts-Intelligence-Report-${dateFileStr}.pdf`);
}
