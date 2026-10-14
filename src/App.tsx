import React, { useState, useEffect } from 'react';
import { Activity, UserProfile } from './types/activity';
import { getAllActivities, saveActivity, deleteActivity, getUserProfile, saveUserProfile } from './services/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { StatsSummaryCards } from './components/StatsSummaryCards';
import { ActivityList } from './components/ActivityList';
import { ActivityDetailView } from './components/ActivityDetailView';
import { FileUploadModal } from './components/FileUploadModal';
import { SettingsModal } from './components/SettingsModal';
import { Watch, ArrowUpRight, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Athlete',
    maxHeartRate: 190,
    restingHeartRate: 54,
    unitPreference: 'metric',
  });

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'activities'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from IndexedDB
  const loadData = async () => {
    try {
      const [storedActivities, storedProfile] = await Promise.all([
        getAllActivities(),
        getUserProfile(),
      ]);
      setActivities(storedActivities);
      setProfile(storedProfile);
    } catch (err) {
      console.error('Error loading initial tracker data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleActivityImported = async (newActivity: Activity) => {
    await saveActivity(newActivity);
    await loadData();
    setSelectedActivity(newActivity);
  };

  const handleDeleteActivity = async (id: string) => {
    await deleteActivity(id);
    await loadData();
    if (selectedActivity?.id === id) {
      setSelectedActivity(null);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const act = activities.find(a => a.id === id);
    if (act) {
      const updated = { ...act, isFavorite: !act.isFavorite };
      await saveActivity(updated);
      await loadData();
      if (selectedActivity?.id === id) {
        setSelectedActivity(updated);
      }
    }
  };

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    await saveUserProfile(newProfile);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-3 border-[#00F0FF] border-t-transparent rounded-full animate-spin shadow-glow-cyan" />
        <p className="text-sm font-bold text-slate-300 font-mono tracking-widest uppercase">
          Initializing Garmin Track Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col">
      {/* Sticky Header */}
      <Navbar
        profile={profile}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {selectedActivity ? (
          <ActivityDetailView
            activity={selectedActivity}
            profile={profile}
            onBack={() => setSelectedActivity(null)}
            onDelete={handleDeleteActivity}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <>
            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-surface via-dark-card to-dark-surface border border-dark-border p-6 md:p-8 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Garmin Watch Connected Dashboard</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  Welcome back, <span className="text-[#00F0FF]">{profile.name}</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                  Analyze your Garmin runs, rides, and workouts with interactive GPS maps, heart rate zones, and split pace metrics. 100% private, client-side, and free forever.
                </p>
              </div>

              {/* Background ambient glow */}
              <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-40 -top-10 w-60 h-60 bg-[#FF2D55]/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Overall Aggregate Stats */}
            <StatsSummaryCards activities={activities} profile={profile} />

            {/* Activities Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Watch className="w-5 h-5 text-[#00F0FF]" />
                  Your Workouts ({activities.length})
                </h2>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="text-xs font-bold text-[#00F0FF] hover:underline flex items-center gap-1"
                >
                  Upload File <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <ActivityList
                activities={activities}
                profile={profile}
                onSelectActivity={(act) => setSelectedActivity(act)}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={mobileTab}
        onSelectTab={(tab) => {
          setMobileTab(tab);
          if (selectedActivity) setSelectedActivity(null);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Upload File Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onActivityImported={handleActivityImported}
      />

      {/* Settings & Garmin Automated Sync Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onDataChanged={loadData}
      />
    </div>
  );
};
