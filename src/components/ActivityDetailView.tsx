import React, { useState } from 'react';
import { Activity, UserProfile } from '../types/activity';
import { formatDistance, formatDuration, formatPace, formatSpeed, formatDate } from '../utils/formatters';
import { analyzeActivityCoach } from '../services/coachEngine';
import { downloadWorkoutFit } from '../services/garminWorkoutExporter';
import { LeafletMap } from './LeafletMap';
import { ActivityCharts } from './ActivityCharts';
import { SplitsTable } from './SplitsTable';
import {
  ArrowLeft,
  Heart,
  TrendingUp,
  Watch,
  Trash2,
  Star,
  Download,
  Zap,
  Timer,
  Milestone,
  Footprints,
  Sparkles,
  GitCompare,
  CheckCircle2
} from 'lucide-react';

interface ActivityDetailViewProps {
  activity: Activity;
  profile: UserProfile;
  onBack: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenComparison?: () => void;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({
  activity,
  profile,
  onBack,
  onDelete,
  onToggleFavorite,
  onOpenComparison,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const coachReport = analyzeActivityCoach(activity);

  const exportActivityJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activity, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activity.title.replace(/\s+/g, '_')}_${activity.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const paceSec = activity.distanceMeters > 0 ? (activity.durationSeconds / activity.distanceMeters) * 1000 : 0;
  const spm = activity.avgCadence || (activity.sport === 'running' ? 168 : undefined);
  const fps = spm ? (spm / 60).toFixed(2) : undefined;

  const handleSyncPrescription = () => {
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
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-dark-surface p-4 rounded-2xl border border-dark-border shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300 hover:text-white transition-all text-xs md:text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          {onOpenComparison && (
            <button
              onClick={onOpenComparison}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border text-xs font-semibold text-[#00F0FF] hover:border-[#00F0FF] transition-all"
              title="Compare with another workout"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </button>
          )}

          <button
            onClick={() => onToggleFavorite(activity.id)}
            className={`p-2 rounded-xl border transition-all ${
              activity.isFavorite
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-dark-card border-dark-border text-slate-400 hover:text-white'
            }`}
            title="Mark as Favorite"
          >
            <Star className={`w-4 h-4 ${activity.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={exportActivityJson}
            className="p-2 rounded-xl bg-dark-card border border-dark-border text-slate-400 hover:text-[#00F0FF] transition-all"
            title="Export Activity JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this workout?')) {
                onDelete(activity.id);
              }
            }}
            className="p-2 rounded-xl bg-dark-card border border-dark-border text-slate-400 hover:text-[#FF2D55] hover:border-[#FF2D55]/30 transition-all"
            title="Delete Activity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Activity Header Info */}
      <div className="bg-dark-surface p-5 md:p-6 rounded-2xl border border-dark-border shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                {activity.sport}
              </span>
              {activity.device && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Watch className="w-3.5 h-3.5 text-slate-500" />
                  {activity.device}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight mt-1.5">
              {activity.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">{formatDate(activity.startTime)}</p>
          </div>
        </div>

        {/* Primary Metric Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Distance */}
          <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Milestone className="w-3.5 h-3.5 text-[#00F0FF]" /> Distance
            </span>
            <div className="text-lg md:text-2xl font-black text-white font-mono mt-1">
              {formatDistance(activity.distanceMeters, profile.unitPreference)}
            </div>
          </div>

          {/* Duration */}
          <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-[#00F0FF]" /> Duration
            </span>
            <div className="text-lg md:text-2xl font-black text-white font-mono mt-1">
              {formatDuration(activity.durationSeconds)}
            </div>
          </div>

          {/* Pace / Speed */}
          <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00E676]" />
              {activity.sport === 'cycling' ? 'Avg Speed' : 'Avg Pace'}
            </span>
            <div className="text-lg md:text-2xl font-black text-[#00E676] font-mono mt-1">
              {activity.sport === 'cycling'
                ? formatSpeed(activity.avgSpeedMps, profile.unitPreference)
                : formatPace(paceSec, profile.unitPreference)}
            </div>
          </div>

          {/* Cadence / FPS */}
          <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-[#00F0FF]" /> Cadence
            </span>
            <div className="text-lg md:text-2xl font-black text-white font-mono mt-1">
              {spm ? `${spm} SPM` : '--'}
            </div>
            {fps && (
              <span className="text-[10px] text-[#00F0FF] font-mono">{fps} FPS</span>
            )}
          </div>

          {/* Heart Rate */}
          <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#FF2D55]" /> Avg HR
            </span>
            <div className="text-lg md:text-2xl font-black text-[#FF2D55] font-mono mt-1">
              {activity.avgHeartRate ? `${activity.avgHeartRate} bpm` : '--'}
            </div>
            {activity.maxHeartRate && (
              <span className="text-[10px] text-slate-500 font-mono">Max: {activity.maxHeartRate} bpm</span>
            )}
          </div>

          {/* Elevation Gain */}
          <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#00F0FF]" /> Elevation
            </span>
            <div className="text-lg md:text-2xl font-black text-[#00F0FF] font-mono mt-1">
              +{activity.elevationGainMeters} m
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Loss: -{activity.elevationLossMeters} m</span>
          </div>
        </div>
      </div>

      {/* AI Coach Insights & What to Change Card */}
      {coachReport && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-dark-surface via-dark-card to-dark-surface border border-[#00F0FF]/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
              AI Coach Breakdown & Actionable Adjustments
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] font-mono">
              Smart Analysis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cadence Diagnosis */}
            {coachReport.cadence && (
              <div className="p-4 rounded-2xl bg-dark-bg/90 border border-dark-border space-y-2">
                <span className="text-xs font-bold text-[#00F0FF] flex items-center gap-1.5 uppercase tracking-wider">
                  <Footprints className="w-4 h-4" /> Cadence Analysis (SPM & FPS)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {coachReport.cadence.advice}
                </p>
              </div>
            )}

            {/* Pacing Fade Analysis */}
            {coachReport.pacing && (
              <div className="p-4 rounded-2xl bg-dark-bg/90 border border-dark-border space-y-2">
                <span className="text-xs font-bold text-[#00E676] flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="w-4 h-4" /> Pacing Consistency ({coachReport.pacing.strategy.replace('_', ' ')})
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {coachReport.pacing.advice}
                </p>
              </div>
            )}
          </div>

          {/* Next Workout Recommendation */}
          <div className="p-4 rounded-2xl bg-dark-card border border-dark-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> What to do for your next session:
              </span>
              <p className="text-sm font-bold text-white">{coachReport.prescription.title}</p>
              <p className="text-xs text-slate-300">{coachReport.prescription.description}</p>
            </div>
            <button
              onClick={handleSyncPrescription}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#00F0FF]/90 transition-all shadow-glow-cyan"
            >
              <Watch className="w-4 h-4" />
              Sync Workout to Watch (.FIT)
            </button>
          </div>
        </div>
      )}

      {/* Interactive Map & GPS Stream (Leaflet) */}
      {activity.trackPoints && activity.trackPoints.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
            <span>GPS Route & Elevation Track</span>
            <span className="text-slate-500">{activity.trackPoints.length} track points</span>
          </div>
          <LeafletMap trackPoints={activity.trackPoints} hoveredPointIndex={hoveredPointIndex} className="h-80 md:h-96 w-full rounded-2xl" />
        </div>
      )}

      {/* Sensor Stream Graphs (Elevation / Heart Rate / Pace / HR Zones) */}
      <ActivityCharts
        trackPoints={activity.trackPoints}
        hrZones={activity.hrZones}
        unit={profile.unitPreference}
        onHoverPoint={(idx) => setHoveredPointIndex(idx)}
      />

      {/* Laps & Splits Breakdown */}
      <SplitsTable laps={activity.laps} unit={profile.unitPreference} />
    </div>
  );
};
