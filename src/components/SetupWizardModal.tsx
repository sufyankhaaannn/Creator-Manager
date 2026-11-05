import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Layers,
  Sparkles,
  User,
  Waves,
  X,
} from 'lucide-react';
import { Platform, PLATFORM_CONFIG, UserPreferences, UserProfile } from '../types/index';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  preferences: UserPreferences;
  onSavePreferences: (prefs: Partial<UserPreferences>) => void;
  onSaveUser: (u: Partial<UserProfile>) => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  user,
  preferences,
  onSavePreferences,
  onSaveUser,
}) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [timezone, setTimezone] = useState(preferences.timezone || 'Asia/Karachi');
  const [dateFormat, setDateFormat] = useState(preferences.dateFormat || 'DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState(preferences.timeFormat || '12h');

  if (!isOpen) return null;

  const handleFinish = () => {
    onSaveUser({ displayName, email, firstTimeSetupCompleted: true });
    onSavePreferences({ timezone, dateFormat, timeFormat });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg p-6 rounded-2xl arctic-glass border border-[var(--accent)]/40 shadow-2xl space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-[var(--accent)]/20 pb-3">
          <div className="flex items-center space-x-2">
            <Waves className="w-5 h-5 text-[var(--accent-light)]" />
            <h2 className="text-base font-bold text-slate-100">
              Command Center Initialization Wizard
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--accent-light)]">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Step 1: Welcome & Account */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Welcome to AbyssalFacts Command Center</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Your private centralized command platform for managing content production, platform schedules, manual analytics, and verified intelligence across YouTube Shorts, TikTok, Instagram Reels, and Facebook Reels.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">Creator / Administrator Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">Administrator Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2.5 text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Platforms Supported */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Supported Creator Platforms</h3>
              <p className="text-[var(--text-muted)]">
                AbyssalFacts tracks four short-form platforms independently with distinct metric definitions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(['youtube_shorts', 'tiktok', 'instagram_reels', 'facebook_reels'] as Platform[]).map(
                (p) => {
                  const cfg = PLATFORM_CONFIG[p];
                  return (
                    <div
                      key={p}
                      className="p-3 rounded-xl bg-[var(--elevated)] border border-[var(--accent)]/20 flex items-center space-x-2.5"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cfg.brandColor }}
                      />
                      <span className="font-semibold text-slate-200">{cfg.name}</span>
                    </div>
                  );
                }
              )}
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--accent)]/20 text-[11px] text-indigo-200">
              <strong>Operating Principle:</strong> You manually publish videos and manually log daily analytics snapshots. The application organizes, compares, and interprets your real data without fake figures.
            </div>
          </div>
        )}

        {/* Step 3: Timezone & Formatting */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Timezone & Display Preferences</h3>
              <p className="text-[var(--text-muted)]">
                Configure your publishing clock and date formats.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2.5 text-slate-200 font-mono"
                >
                  <option value="Asia/Karachi">Asia/Karachi (PKT - Default UTC+5)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Date Format</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value as any)}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Default)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Time Format</label>
                  <select
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value as any)}
                    className="w-full bg-[var(--elevated)] border border-[var(--accent)]/30 rounded-lg p-2 text-slate-200 font-mono"
                  >
                    <option value="12h">12-Hour (AM/PM)</option>
                    <option value="24h">24-Hour</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Finish */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Setup Complete</h3>
              <p className="text-[var(--text-muted)]">
                Your command center is configured and ready for live operation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--elevated)] border border-emerald-500/30 space-y-2">
              <span className="font-bold text-emerald-400 block">✓ Environment Ready</span>
              <p className="text-slate-300">
                • Timezone: <span className="font-mono text-[var(--accent-light)]">{timezone}</span>
              </p>
              <p className="text-slate-300">
                • Formats: <span className="font-mono text-[var(--accent-light)]">{dateFormat} ({timeFormat})</span>
              </p>
              <p className="text-slate-300">
                • AES-256 encrypted local backups available anytime in Settings.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--accent)]/20">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-slate-200"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 rounded-lg command-btn-primary text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Launch Command Center
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
