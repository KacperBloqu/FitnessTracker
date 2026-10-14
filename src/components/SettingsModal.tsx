import React, { useState } from 'react';
import { UserProfile } from '../types/activity';
import { exportAllDataAsJson, importAllDataFromJson, clearAllActivities, syncFromGitHubRepoData } from '../services/storage';
import {
  X,
  Settings,
  User,
  Heart,
  Download,
  Upload,
  RefreshCw,
  GitBranch,
  AlertTriangle
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onDataChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onDataChanged,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    onClose();
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    const jsonStr = await exportAllDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garmin_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setIsExporting(false);
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const count = await importAllDataFromJson(text);
        alert(`Successfully imported ${count} activities!`);
        onDataChanged();
        onClose();
      } catch (err: any) {
        alert('Failed to import backup: ' + err.message);
      }
    };
    input.click();
  };

  const handleSyncFromRepo = async () => {
    setSyncStatus('Checking repo for synced workouts...');
    const count = await syncFromGitHubRepoData();
    if (count > 0) {
      setSyncStatus(`Synced ${count} workouts from GitHub repo!`);
      onDataChanged();
    } else {
      setSyncStatus('No new remote activities found in public/data/activities.json.');
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to delete all stored workouts? This cannot be undone.')) {
      await clearAllActivities();
      onDataChanged();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-dark-surface border border-dark-border rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-dark-card border border-dark-border text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/15 text-[#00F0FF] flex items-center justify-center border border-[#00F0FF]/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Settings & Garmin Sync</h2>
            <p className="text-xs text-slate-400">Configure athlete profile, heart rate zones, and automated cloud sync</p>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 bg-dark-card p-5 rounded-2xl border border-dark-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00F0FF] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Athlete Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Athlete Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Unit Preference</label>
              <select
                value={formData.unitPreference}
                onChange={(e) => setFormData({ ...formData, unitPreference: e.target.value as any })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
              >
                <option value="metric">Metric (Kilometers, km/h, min/km)</option>
                <option value="imperial">Imperial (Miles, mph, min/mi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3 text-[#FF2D55]" /> Max Heart Rate (bpm)
              </label>
              <input
                type="number"
                value={formData.maxHeartRate}
                onChange={(e) => setFormData({ ...formData, maxHeartRate: parseInt(e.target.value, 10) || 190 })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
              />
              <span className="text-[10px] text-slate-500">Used to compute 5 HR Training Zones</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Resting Heart Rate (bpm)</label>
              <input
                type="number"
                value={formData.restingHeartRate}
                onChange={(e) => setFormData({ ...formData, restingHeartRate: parseInt(e.target.value, 10) || 55 })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#00F0FF]/90 transition-all shadow-glow-cyan"
            >
              Save Profile Changes
            </button>
          </div>
        </form>

        {/* Automated Garmin Cloud Sync (GitHub Actions) */}
        <div className="bg-dark-card p-5 rounded-2xl border border-dark-border space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E676] flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" /> Automated GitHub Actions Garmin Sync (100% Free)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Want your Garmin watch workouts to sync automatically without manual file uploading? We have included a ready-to-run GitHub Action workflow in <code className="text-[#00F0FF]">.github/workflows/garmin-sync.yml</code>.
          </p>

          <div className="p-3 bg-dark-bg rounded-xl border border-dark-border text-[11px] text-slate-300 space-y-1.5 font-mono">
            <p className="text-[#00F0FF] font-semibold font-sans">Setup Instructions:</p>
            <p>1. In your GitHub repository, go to <strong>Settings &rarr; Secrets & Variables &rarr; Actions</strong>.</p>
            <p>2. Add secret <code className="text-[#00E676]">GARMIN_EMAIL</code> (your Garmin account email).</p>
            <p>3. Add secret <code className="text-[#00E676]">GARMIN_PASSWORD</code> (your Garmin password).</p>
            <p>4. The GitHub Action will run daily, fetch new workouts, and publish them to your GitHub Pages site!</p>
          </div>

          <button
            onClick={handleSyncFromRepo}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-hover border border-dark-border text-xs text-slate-200 hover:text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#00E676]" />
            Pull latest sync data from repo
          </button>
          {syncStatus && <p className="text-xs text-[#00E676] font-mono">{syncStatus}</p>}
        </div>

        {/* Backup & Data Management */}
        <div className="bg-dark-card p-5 rounded-2xl border border-dark-border space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Data Backup & Portability
          </h3>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-200 hover:text-white hover:border-[#00F0FF] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#00F0FF]" />
              Export All Data (JSON)
            </button>

            <button
              onClick={handleImportBackup}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-200 hover:text-white hover:border-[#00E676] transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-[#00E676]" />
              Import Data (JSON)
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/30 border border-red-900/60 text-xs text-red-300 hover:bg-red-950/60 transition-all ml-auto"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Reset Stored Workouts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
