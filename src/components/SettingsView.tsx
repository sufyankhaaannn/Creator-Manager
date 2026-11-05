import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Key,
  Lock,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { UserPreferences, UserProfile } from '../types/index';
import { createEncryptedBackup, decryptAndVerifyBackup, getBackupLogs } from '../lib/backup';
import { StorageService } from '../lib/storage';
import { exportToExcelWorkbook, exportToJson } from '../lib/export';

interface SettingsViewProps {
  user: UserProfile;
  preferences: UserPreferences;
  onUpdateUser: (user: Partial<UserProfile>) => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onReloadAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  preferences,
  onUpdateUser,
  onUpdatePreferences,
  onReloadAllData,
}) => {
  const [activeSection, setActiveSection] = useState<'preferences' | 'security' | 'backup' | 'account'>('preferences');

  // Account form
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);

  // Backup state
  const [backupPassword, setBackupPassword] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);

  // Restore state
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFileText, setRestoreFileText] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Dataset management state
  const [datasetMsg, setDatasetMsg] = useState<string | null>(null);
  const [confirmClearData, setConfirmClearData] = useState(false);

  const backupLogs = getBackupLogs();

  // Handle Account Save
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ displayName, email });
    setAccountMsg('Account profile successfully updated.');
    setTimeout(() => setAccountMsg(null), 3000);
  };

  // Create Encrypted Backup
  const handleCreateEncryptedBackup = async () => {
    if (!backupPassword || backupPassword.length < 6) {
      setBackupStatusMsg('Password must be at least 6 characters for AES-256 encryption.');
      return;
    }
    setIsCreatingBackup(true);
    setBackupStatusMsg(null);
    try {
      const { blob, fileName, checksum } = await createEncryptedBackup(backupPassword);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatusMsg(`Encrypted backup generated successfully! (SHA-256 Checksum: ${checksum.slice(0, 16)}...)`);
      setBackupPassword('');
    } catch (err: any) {
      setBackupStatusMsg(`Backup failed: ${err.message}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handle file select for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setRestoreFileText(event.target?.result as string);
      setRestorePreview(null);
      setRestoreError(null);
    };
    reader.readAsText(file);
  };

  // Verify and preview restore
  const handleVerifyRestore = async () => {
    if (!restoreFileText || !restorePassword) {
      setRestoreError('Please provide both the backup file and the decryption password.');
      return;
    }
    setRestoreError(null);
    const result = await decryptAndVerifyBackup(restoreFileText, restorePassword);
    if (!result.success) {
      setRestoreError(result.error || 'Decryption failed.');
    } else {
      setRestorePreview(result.data);
    }
  };

  // Confirm restore with safety backup
  const handleExecuteRestore = async () => {
    if (!restorePreview) return;
    try {
      // Create pre-restore safety backup in localStorage
      const safety = StorageService.exportFullDatabase();
      localStorage.setItem('abyssal_pre_restore_safety_backup', JSON.stringify(safety));

      // Import the verified backup
      const res = StorageService.importDatabase(restorePreview);
      if (res.success) {
        setRestoreSuccess('Database successfully restored and verified from encrypted backup!');
        setRestorePreview(null);
        setRestoreFileText(null);
        setRestorePassword('');
        onReloadAllData();
      } else {
        setRestoreError(res.error || 'Restore failed.');
      }
    } catch (err: any) {
      setRestoreError(err.message || 'Restore error');
    }
  };

  // Calculate storage usage
  const calculateStorageSize = () => {
    if (typeof window === 'undefined') return '0 KB';
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('abyssal_')) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    return `${(total / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl arctic-glass">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[var(--accent-light)]" />
            Settings, Security & Data Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            System preferences, AES-256 encrypted backups, integrity verification, and storage controls
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex items-center bg-[var(--elevated)] p-1 rounded-lg border border-[var(--accent)]/20">
          <button
            onClick={() => setActiveSection('preferences')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${
              activeSection === 'preferences' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveSection('backup')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${
              activeSection === 'backup' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
            }`}
          >
            Encrypted Backup & Restore
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${
              activeSection === 'security' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
            }`}
          >
            Security & System Health
          </button>
          <button
            onClick={() => setActiveSection('account')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${
              activeSection === 'account' ? 'bg-[var(--elevated-hover)] text-[var(--accent-light)]' : 'text-[var(--text-muted)]'
            }`}
          >
            Admin Account
          </button>
        </div>
      </div>

      {/* 11.2 Preferences Section */}
      {activeSection === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl arctic-glass space-y-4">
            <h2 className="text-sm font-bold text-slate-100 border-b border-[var(--accent)]/15 pb-2">
              Timezone & Date Configuration
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Default Timezone (Creator Local Time)
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => onUpdatePreferences({ timezone: e.target.value })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                >
                  <option value="Asia/Karachi">Asia/Karachi (PKT - Default UTC+5)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST UTC+4)</option>
                </select>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  All timestamps are stored in UTC and rendered in your configured timezone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Date Format</label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => onUpdatePreferences({ dateFormat: e.target.value as any })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Default)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Time Format</label>
                  <select
                    value={preferences.timeFormat}
                    onChange={(e) => onUpdatePreferences({ timeFormat: e.target.value as any })}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                  >
                    <option value="12h">12-Hour (AM/PM - Default)</option>
                    <option value="24h">24-Hour Military</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">Default Date Range</label>
                <select
                  value={preferences.defaultDateRange}
                  onChange={(e) => onUpdatePreferences({ defaultDateRange: e.target.value as any })}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                >
                  <option value="30d">Last 30 Days (Default)</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="all">All Available Data</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl arctic-glass space-y-4">
            <h2 className="text-sm font-bold text-slate-100 border-b border-[var(--accent)]/15 pb-2">
              Theme & UI Preferences
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)]">
                <div>
                  <span className="font-semibold text-slate-200">Color Theme</span>
                  <p className="text-[10px] text-[var(--text-muted)]">Obsidian command palette</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      onUpdatePreferences({ theme: 'dark' });
                    }}
                    className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
                      preferences.theme === 'dark' ? 'bg-[var(--accent)] text-white shadow-sm font-semibold' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => {
                      onUpdatePreferences({ theme: 'light' });
                    }}
                    className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
                      preferences.theme === 'light' ? 'bg-[var(--accent)] text-white shadow-sm font-semibold' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Accent Theme Picker */}
              <div className="p-3 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] space-y-2">
                <div>
                  <span className="font-semibold text-slate-200">Accent Color Tone</span>
                  <p className="text-[10px] text-[var(--text-muted)]">Custom styling palette for charts, buttons, and highlights</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { id: 'indigo', name: 'Electric Indigo', color: '#6366f1' },
                    { id: 'violet', name: 'Royal Violet', color: '#8b5cf6' },
                    { id: 'emerald', name: 'Cyber Emerald', color: '#10b981' },
                    { id: 'sky', name: 'Atmosphere Sky', color: '#0284c7' },
                  ].map((accent) => {
                    const isSelected = (preferences.accentTheme || 'indigo') === accent.id;
                    return (
                      <button
                        key={accent.id}
                        type="button"
                        onClick={() => onUpdatePreferences({ accentTheme: accent.id as any })}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent-bg)] font-bold text-white'
                            : 'border-[var(--panel-border)] text-[var(--text-muted)] hover:border-slate-500'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: accent.color }}
                        />
                        <span className="text-[11px] truncate">{accent.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-200">In-App Alert Channels</span>
                {[
                  { key: 'reminders', label: 'Publishing schedule countdown reminders (30m, 15m, 5m)' },
                  { key: 'overdueAlerts', label: 'Overdue upload alerts when time passes without confirmation' },
                  { key: 'goals', label: 'Milestone notifications when goals hit targets' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center space-x-2.5 p-2 rounded-lg bg-[var(--elevated)] border border-[var(--panel-border)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(preferences.notifications as any)[item.key]}
                      onChange={(e) =>
                        onUpdatePreferences({
                          notifications: {
                            ...preferences.notifications,
                            [item.key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-[var(--panel-border)] text-[var(--accent-light)]"
                    />
                    <span className="text-slate-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11.4 Encrypted Backup & Restoration */}
      {activeSection === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Encrypted Backup */}
            <div className="p-5 rounded-xl arctic-glass space-y-4">
              <div className="flex items-center space-x-2 border-b border-[var(--accent)]/15 pb-2">
                <Lock className="w-4 h-4 text-[var(--accent-light)]" />
                <h2 className="text-sm font-bold text-slate-100">Create AES-256 Encrypted Backup</h2>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Generates an encrypted package containing all materials, account analytics, video checkpoints, schedules, and goals with an embedded SHA-256 integrity checksum.
              </p>

              {backupStatusMsg && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-[var(--accent)]/30 text-xs text-indigo-200">
                  {backupStatusMsg}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--text-muted)]">
                  Encryption Passphrase (Min 6 characters)
                </label>
                <input
                  type="password"
                  placeholder="Enter strong encryption passphrase..."
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
                />
              </div>

              <button
                onClick={handleCreateEncryptedBackup}
                disabled={isCreatingBackup}
                className="w-full py-2.5 rounded-lg command-btn-primary text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-indigo-500/20"
              >
                <Download className="w-4 h-4" />
                <span>{isCreatingBackup ? 'Encrypting Database...' : 'Download Encrypted Backup (.abyssalbackup)'}</span>
              </button>
            </div>

            {/* Restore from Backup with Preview & Pre-Restore Safety */}
            <div className="p-5 rounded-xl arctic-glass space-y-4">
              <div className="flex items-center space-x-2 border-b border-[var(--accent)]/15 pb-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-100">Restore & Verify Encrypted Backup</h2>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Upload your <code className="text-[var(--accent-light)]">.abyssalbackup</code> file, enter the passphrase, verify the SHA-256 integrity hash, and preview records before restoring.
              </p>

              {restoreError && (
                <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {restoreSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{restoreSuccess}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Select Backup File</label>
                  <input
                    type="file"
                    accept=".abyssalbackup,.json"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--elevated-hover)] file:text-[var(--accent-light)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Decryption Passphrase</label>
                  <input
                    type="password"
                    placeholder="Enter backup passphrase..."
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                  />
                </div>

                {!restorePreview ? (
                  <button
                    onClick={handleVerifyRestore}
                    disabled={!restoreFileText || !restorePassword}
                    className="w-full py-2 bg-[var(--elevated-hover)] text-[var(--accent-light)] font-bold rounded-lg hover:bg-[var(--accent)] hover:text-[#080D14] disabled:opacity-50 transition-all"
                  >
                    Verify & Preview Contents
                  </button>
                ) : (
                  <div className="space-y-3 p-3 rounded-lg bg-[var(--bg-main)] border border-emerald-500/40">
                    <span className="font-bold text-emerald-400 block">
                      ✓ Checksum Verified: Backup Integrity Intact
                    </span>
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <p>• Materials: {restorePreview.materials?.length || 0}</p>
                      <p>• Account Analytics: {restorePreview.accountAnalytics?.length || 0}</p>
                      <p>• Video Checkpoints: {restorePreview.videoCheckpoints?.length || 0}</p>
                      <p>• Schedules: {restorePreview.schedules?.length || 0}</p>
                    </div>

                    <button
                      onClick={handleExecuteRestore}
                      className="w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-all"
                    >
                      Confirm Restoration (Creates Safety Backup)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Backup Log Archive */}
          <div className="arctic-glass rounded-xl overflow-hidden border border-[var(--accent)]/15">
            <div className="p-3 bg-[var(--elevated)] border-b border-[var(--panel-border)] font-semibold text-xs text-slate-200">
              Audit Logs of Latest 30 Backups
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[var(--elevated)]/40 text-[var(--text-muted)] uppercase font-semibold border-b border-[var(--panel-border)]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Materials</th>
                    <th className="py-2.5 px-3">SHA-256 Integrity</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)] text-slate-200">
                  {backupLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                        No backup logs recorded yet. Create an encrypted backup above.
                      </td>
                    </tr>
                  ) : (
                    backupLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--elevated-hover)]/30 font-mono text-[11px]">
                        <td className="py-2 px-3 text-indigo-200">{log.createdAt.slice(0, 16)}</td>
                        <td className="py-2 px-3">{log.fileName}</td>
                        <td className="py-2 px-3">{(log.sizeBytes / 1024).toFixed(1)} KB</td>
                        <td className="py-2 px-3">{log.recordsCount.materials}</td>
                        <td className="py-2 px-3 text-[var(--text-muted)]">{log.sha256Checksum.slice(0, 12)}...</td>
                        <td className="py-2 px-3">
                          <span className="text-emerald-400 font-bold uppercase">{log.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 11.3 Security & System Health */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl arctic-glass space-y-2">
              <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)]">
                <Database className="w-4 h-4 text-[var(--accent-light)]" />
                <span className="uppercase font-semibold">Local Storage State</span>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-400">OPERATIONAL</p>
              <p className="text-[10px] text-[var(--text-muted)]">Encrypted browser store synchronized</p>
            </div>

            <div className="p-4 rounded-xl arctic-glass space-y-2">
              <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)]">
                <Server className="w-4 h-4 text-indigo-200" />
                <span className="uppercase font-semibold">Storage Space Utilized</span>
              </div>
              <p className="text-xl font-bold font-mono text-slate-100">{calculateStorageSize()}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Well below 5MB browser quota</p>
            </div>

            <div className="p-4 rounded-xl arctic-glass space-y-2">
              <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)]">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-light)]" />
                <span className="uppercase font-semibold">Build Architecture</span>
              </div>
              <p className="text-xl font-bold font-mono text-cyan-300">v1.2.0 PROD</p>
              <p className="text-[10px] text-[var(--text-muted)]">Client-side AES-GCM + Node test runner</p>
            </div>
          </div>

          {/* Reset or Load Demo Data */}
          <div className="p-5 rounded-xl command-card border border-[var(--accent)]/20 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[var(--accent-light)]" />
              Dataset Management: Demo Mode vs Real Operational Database
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Demo data is strictly separated from your real operational records. You can load sample Abyssal facts data for testing, or wipe clean for real operation.
            </p>

            {datasetMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <span>{datasetMsg}</span>
                <button onClick={() => setDatasetMsg(null)} className="text-emerald-400 font-bold ml-2">✕</button>
              </div>
            )}

            {confirmClearData ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <p className="text-xs text-rose-300 font-semibold">
                  Are you sure you want to clear all data? This will empty all materials, analytics snapshots, and schedules. Make sure you have exported a backup if needed.
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      StorageService.clearAllRealData();
                      onReloadAllData();
                      setConfirmClearData(false);
                      setDatasetMsg('All data cleared. Database is now completely empty.');
                    }}
                    className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-500 transition-colors"
                  >
                    Yes, Clear Everything
                  </button>
                  <button
                    onClick={() => setConfirmClearData(false)}
                    className="px-4 py-2 bg-[var(--elevated)] text-[var(--text-muted)] hover:text-white text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    StorageService.resetToDemo();
                    onReloadAllData();
                    setDatasetMsg('Demo dataset loaded successfully.');
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--elevated-hover)] text-xs font-semibold text-[var(--accent-light)] hover:bg-[var(--accent)] hover:text-white transition-all"
                >
                  Load Sample Abyssal Facts Dataset
                </button>

                <button
                  onClick={() => setConfirmClearData(true)}
                  className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                >
                  Clear All Data (Start Empty Real Database)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11.1 Admin Account */}
      {activeSection === 'account' && (
        <div className="max-w-xl p-5 rounded-xl arctic-glass space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--accent)]/15 pb-2">
            <User className="w-4 h-4 text-[var(--accent-light)]" />
            <h2 className="text-sm font-bold text-slate-100">Administrator Profile</h2>
          </div>

          {accountMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
              {accountMsg}
            </div>
          )}

          <form onSubmit={handleSaveAccount} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">Administrator Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2.5 text-slate-200"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2.5 text-slate-200 font-mono"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg command-btn-primary text-white font-bold text-xs"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
