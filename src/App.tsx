import React, { useState, useEffect } from 'react';
import { Activity, UserProfile } from './types/activity';
import { getAllActivities, saveActivity, deleteActivity, getUserProfile, saveUserProfile, syncFromGitHubRepoData } from './services/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { StatsSummaryCards } from './components/StatsSummaryCards';
import { ActivityList } from './components/ActivityList';
import { ActivityDetailView } from './components/ActivityDetailView';
import { ProgressDashboard } from './components/ProgressDashboard';
import { FileUploadModal } from './components/FileUploadModal';
import { SettingsModal } from './components/SettingsModal';
import { ActivityComparisonModal } from './components/ActivityComparisonModal';
import { WorkoutCreatorModal } from './components/WorkoutCreatorModal';
import { Watch, ArrowUpRight, Sparkles, GitCompare } from 'lucide-react';

export const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Athlete',
    maxHeartRate: 190,
    restingHeartRate: 54,
    unitPreference: 'metric',
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'progress'>('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isWorkoutCreatorOpen, setIsWorkoutCreatorOpen] = useState(false);
  const [compareInitialId, setCompareInitialId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from IndexedDB & repo sync
  const loadData = async () => {
    try {
      await syncFromGitHubRepoData();
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

  const handleOpenComparisonForActivity = (activityId?: string) => {
    setCompareInitialId(activityId);
    setIsComparisonOpen(true);
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
      {/* Sticky Header with Navigation Tabs */}
      <Navbar
        profile={profile}
        currentView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          setSelectedActivity(null);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenComparison={() => handleOpenComparisonForActivity()}
        onOpenWorkoutCreator={() => setIsWorkoutCreatorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {selectedActivity ? (
          <ActivityDetailView
            activity={selectedActivity}
            profile={profile}
            onBack={() => setSelectedActivity(null)}
            onDelete={handleDeleteActivity}
            onToggleFavorite={handleToggleFavorite}
            onOpenComparison={() => handleOpenComparisonForActivity(selectedActivity.id)}
          />
        ) : activeView === 'progress' ? (
          <ProgressDashboard
            activities={activities}
            profile={profile}
            onOpenComparison={() => handleOpenComparisonForActivity()}
            onOpenWorkoutCreator={() => setIsWorkoutCreatorOpen(true)}
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
                  Track running cadence (FPS & SPM), gym volume, and swimming efficiency (SWOLF). Compare workouts side-by-side and create custom workouts to send to your Garmin watch.
                </p>

                {/* Quick Action Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveView('progress')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-bg/90 border border-dark-border text-xs text-[#00F0FF] hover:border-[#00F0FF] transition-all font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Coach Analysis
                  </button>
                  <button
                    onClick={() => setIsWorkoutCreatorOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-bg/90 border border-dark-border text-xs text-[#00E676] hover:border-[#00E676] transition-all font-semibold"
                  >
                    <Watch className="w-3.5 h-3.5" />
                    Sync Workouts to Watch
                  </button>
                  <button
                    onClick={() => handleOpenComparisonForActivity()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-bg/90 border border-dark-border text-xs text-amber-400 hover:border-amber-400 transition-all font-semibold"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Compare Sessions
                  </button>
                </div>
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenComparisonForActivity()}
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-[#00E676]" /> Compare
                  </button>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="text-xs font-bold text-[#00F0FF] hover:underline flex items-center gap-1"
                  >
                    Upload File <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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
        currentTab={activeView}
        onSelectTab={(tab) => {
          setActiveView(tab);
          setSelectedActivity(null);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWorkoutCreator={() => setIsWorkoutCreatorOpen(true)}
      />

      {/* Upload File Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onActivityImported={handleActivityImported}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onDataChanged={loadData}
      />

      {/* Activity Side-by-Side Comparison Modal */}
      <ActivityComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        activities={activities}
        profile={profile}
        initialActivityId={compareInitialId}
      />

      {/* Structured Workout Creator & Garmin Sync Modal */}
      <WorkoutCreatorModal
        isOpen={isWorkoutCreatorOpen}
        onClose={() => setIsWorkoutCreatorOpen(false)}
      />
    </div>
  );
};
