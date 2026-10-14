import React, { useState } from 'react';
import { Activity, UserProfile } from '../types/activity';
import { analyzeActivityCoach } from '../services/coachEngine';
import { downloadWorkoutFit } from '../services/garminWorkoutExporter';
import {
  Sparkles,
  Footprints,
  Dumbbell,
  Waves,
  Zap,
  Heart,
  Award,
  GitCompare,
  Watch,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { formatDistance } from '../utils/formatters';

interface ProgressDashboardProps {
  activities: Activity[];
  profile: UserProfile;
  onOpenComparison: () => void;
  onOpenWorkoutCreator: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  activities,
  profile,
  onOpenComparison,
  onOpenWorkoutCreator,
}) => {
  const [selectedSportTab, setSelectedSportTab] = useState<'running' | 'gym' | 'swimming'>('running');

  // Filter activities by sport
  const runningActivities = activities.filter((a) => a.sport === 'running');
  const gymActivities = activities.filter((a) => a.sport === 'workout');
  const swimActivities = activities.filter((a) => a.sport === 'swimming');

  // Get most recent activity for instant coach feedback
  const latestActivity = activities[0] || null;
  const coachReport = latestActivity ? analyzeActivityCoach(latestActivity) : null;

  // Compute Running Cadence averages
  const cadences = runningActivities
    .map((a) => a.avgCadence)
    .filter((c): c is number => c !== undefined && c > 0);

  const avgRunningSpm = cadences.length > 0 ? Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length) : 168;
  const avgRunningFps = (avgRunningSpm / 60).toFixed(2);

  // Compute Total Gym Volume
  const totalGymCalories = gymActivities.reduce((s, a) => s + (a.calories || 0), 0);

  // Handle instant Garmin workout sync from coach prescription
  const handleExportPrescription = () => {
    if (!coachReport) return;
    const p = coachReport.prescription;
    downloadWorkoutFit({
      id: `rx-${Date.now()}`,
      title: p.title,
      sport: p.sport === 'cycling' ? 'running' : (p.sport as any),
      description: p.description,
      createdAt: new Date().toISOString(),
      estimatedDurationMinutes: p.durationMinutes,
      steps: p.steps.map((s, idx) => ({
        id: `${idx + 1}`,
        name: s.name,
        type: 'active',
        durationSeconds: 300,
        notes: s.target,
      })),
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Banner: AI Coach & Actionable Prescription */}
      {coachReport && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-surface via-dark-card to-dark-surface border border-dark-border p-6 md:p-8 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
              <span>Smart Athletic Coach Analysis</span>
            </div>
            <button
              onClick={onOpenComparison}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border text-xs font-bold text-slate-300 hover:text-white hover:border-[#00F0FF] transition-all"
            >
              <GitCompare className="w-3.5 h-3.5 text-[#00F0FF]" />
              Compare Two Workouts
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Left 2 Cols: Cadence & Pacing Diagnosis */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Feedback based on your latest {latestActivity?.sport}:
              </h2>

              {coachReport.cadence && (
                <div className="p-4 rounded-2xl bg-dark-bg/80 border border-dark-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-1.5">
                      <Footprints className="w-4 h-4" /> Cadence (SPM & FPS)
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {coachReport.cadence.avgSpm} SPM &bull; {coachReport.cadence.avgFps} FPS
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {coachReport.cadence.advice}
                  </p>
                </div>
              )}

              {coachReport.pacing && (
                <div className="p-4 rounded-2xl bg-dark-bg/80 border border-dark-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00E676] uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Pacing Strategy ({coachReport.pacing.strategy.replace('_', ' ')})
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      Score: {coachReport.pacing.consistencyScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {coachReport.pacing.advice}
                  </p>
                </div>
              )}
            </div>

            {/* Right Col: Recommended Next Workout with 1-click Garmin Watch Sync */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-dark-card to-dark-surface border border-[#00F0FF]/30 flex flex-col justify-between space-y-4 shadow-glow-cyan">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider block">
                  Recommended Next Workout
                </span>
                <h3 className="text-base font-black text-white">{coachReport.prescription.title}</h3>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#00F0FF]/20 text-[#00F0FF]">
                  {coachReport.prescription.intensity} &bull; {coachReport.prescription.durationMinutes} mins
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {coachReport.prescription.description}
                </p>
              </div>

              <button
                onClick={handleExportPrescription}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#00F0FF]/90 transition-all shadow-glow-cyan"
              >
                <Watch className="w-4 h-4" />
                Sync to Garmin Watch (.FIT)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sport Progression Hub (Running / Gym / Swimming) */}
      <div className="space-y-4">
        {/* Tab Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-dark-surface p-1.5 rounded-2xl border border-dark-border">
            <button
              onClick={() => setSelectedSportTab('running')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                selectedSportTab === 'running'
                  ? 'bg-[#00F0FF] text-black shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Footprints className="w-4 h-4" />
              Running Progress
            </button>

            <button
              onClick={() => setSelectedSportTab('gym')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                selectedSportTab === 'gym'
                  ? 'bg-[#FF2D55] text-white shadow-glow-crimson'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Gym & Strength
            </button>

            <button
              onClick={() => setSelectedSportTab('swimming')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                selectedSportTab === 'swimming'
                  ? 'bg-[#00E676] text-black shadow-glow-emerald'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Waves className="w-4 h-4" />
              Swimming & SWOLF
            </button>
          </div>

          <button
            onClick={onOpenWorkoutCreator}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-dark-surface border border-dark-border text-xs font-bold text-slate-200 hover:text-white hover:border-[#00F0FF] transition-all"
          >
            <Plus className="w-4 h-4 text-[#00F0FF]" />
            Create Custom Workout
          </button>
        </div>

        {/* Running Tab */}
        {selectedSportTab === 'running' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cadence Meter */}
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-[#00F0FF]" /> Average Cadence & FPS
              </span>
              <div className="text-3xl font-black text-white font-mono">
                {avgRunningSpm} <span className="text-sm font-normal text-slate-400">SPM</span>
              </div>
              <div className="text-xs font-mono text-[#00F0FF]">
                = {avgRunningFps} Footstrikes Per Second (FPS)
              </div>
              <div className="w-full bg-dark-bg h-2.5 rounded-full overflow-hidden border border-dark-border">
                <div
                  style={{ width: `${Math.min(100, (avgRunningSpm / 190) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 via-[#00E676] to-[#00F0FF]"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Target benchmark: <strong>174 - 180 SPM (2.9 - 3.0 FPS)</strong>. Higher cadence minimizes ground contact time.
              </p>
            </div>

            {/* Aerobic Base Volume */}
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#FF2D55]" /> Total Running Sessions
              </span>
              <div className="text-3xl font-black text-white font-mono">
                {runningActivities.length} <span className="text-sm font-normal text-slate-400">runs</span>
              </div>
              <p className="text-xs text-slate-300">
                Total distance:{' '}
                <strong className="text-white font-mono">
                  {formatDistance(runningActivities.reduce((s, a) => s + (a.distanceMeters || 0), 0), profile.unitPreference)}
                </strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Remember the <strong>80/20 rule</strong>: 80% of miles in Zone 2 ensures aerobic mitochondrial development without injury.
              </p>
            </div>

            {/* Cadence Pro Tip */}
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> Cadence Drill: Fast Feet
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                To train your nervous system for higher cadence, perform <strong>4 x 20-second strides</strong> at the end of every easy run with 180+ SPM turnover.
              </p>
              <div className="p-2.5 rounded-xl bg-dark-card border border-dark-border text-[11px] text-[#00F0FF] font-mono">
                Tip: Run to 175-180 BPM music tracks
              </div>
            </div>
          </div>
        )}

        {/* Gym Tab */}
        {selectedSportTab === 'gym' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-[#FF2D55]" /> Strength Workouts
              </span>
              <div className="text-3xl font-black text-white font-mono">
                {gymActivities.length} <span className="text-sm font-normal text-slate-400">sessions</span>
              </div>
              <p className="text-xs text-slate-300">
                Energy burned: <strong className="text-amber-400 font-mono">{totalGymCalories} kcal</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Lifting heavy 2x a week increases running economy by <strong>6-8%</strong> through enhanced muscle fiber recruitment.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Essential Gym Movements</span>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> <strong>Barbell Back Squat</strong> (Quad & glute power)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> <strong>Romanian Deadlift</strong> (Hamstring resilience)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> <strong>Bulgarian Split Squat</strong> (Single leg stability)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> <strong>Overhead Press</strong> (Core & shoulder posture)</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-[#FF2D55] uppercase tracking-wider">Gym Workout Creator</span>
              <p className="text-xs text-slate-300">
                Build your sets, reps, and weights, and export directly to your Garmin watch so it counts sets on your wrist.
              </p>
              <button
                onClick={onOpenWorkoutCreator}
                className="w-full py-2 px-3 rounded-xl bg-[#FF2D55] text-white font-bold text-xs hover:bg-[#FF2D55]/90 transition-all shadow-glow-crimson flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Build Gym Routine
              </button>
            </div>
          </div>
        )}

        {/* Swimming Tab */}
        {selectedSportTab === 'swimming' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-[#00E676]" /> Swimming & SWOLF
              </span>
              <div className="text-3xl font-black text-white font-mono">
                {swimActivities.length} <span className="text-sm font-normal text-slate-400">swims</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>SWOLF</strong> = Time (seconds) + Number of strokes for 1 length (e.g., 50m in 42s with 32 strokes = <strong>SWOLF 74</strong>).
              </p>
              <div className="p-2.5 rounded-xl bg-dark-card border border-dark-border text-xs text-[#00E676] font-mono">
                Lower SWOLF = Higher Hydrodynamic Efficiency
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Swim Efficiency Keys</span>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> <strong>Head Position:</strong> Look down at bottom, keeping hips high</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> <strong>High Elbow Catch:</strong> Keep elbow higher than hand</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> <strong>Streamlining:</strong> Push off wall tight like a torpedo</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
              <span className="text-xs font-bold text-[#00E676] uppercase tracking-wider">Pool Workout Builder</span>
              <p className="text-xs text-slate-300">
                Design custom intervals for 25m or 50m pools and sync to your Garmin watch with distance vibration cues.
              </p>
              <button
                onClick={onOpenWorkoutCreator}
                className="w-full py-2 px-3 rounded-xl bg-[#00E676] text-black font-bold text-xs hover:bg-[#00E676]/90 transition-all shadow-glow-emerald flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Build Swim Workout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pro Tips Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Pro Athlete Tips & Methodology
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {coachReport?.proTips.map((tip) => (
            <div key={tip.id} className="p-4 rounded-2xl bg-dark-surface border border-dark-border space-y-2 hover:border-slate-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-dark-card border border-dark-border text-amber-400 font-mono">
                  {tip.badge}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">{tip.sport}</span>
              </div>
              <h4 className="text-xs font-bold text-white">{tip.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{tip.message}</p>
              <div className="pt-1.5 border-t border-dark-border/60 text-[11px] text-[#00F0FF]">
                <strong>Action:</strong> {tip.actionableStep}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
