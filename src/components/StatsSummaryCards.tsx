import React from 'react';
import { Activity, UserProfile } from '../types/activity';
import { formatDistance, formatDuration } from '../utils/formatters';
import { Milestone, Timer, Flame, Award, Heart, TrendingUp } from 'lucide-react';

interface StatsSummaryCardsProps {
  activities: Activity[];
  profile: UserProfile;
}

export const StatsSummaryCards: React.FC<StatsSummaryCardsProps> = ({ activities, profile }) => {
  const totalDistance = activities.reduce((sum, a) => sum + (a.distanceMeters || 0), 0);
  const totalSeconds = activities.reduce((sum, a) => sum + (a.durationSeconds || 0), 0);
  const totalCalories = activities.reduce((sum, a) => sum + (a.calories || 0), 0);
  const totalElevation = activities.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);

  const hrActivities = activities.filter(a => a.avgHeartRate && a.avgHeartRate > 0);
  const overallAvgHr = hrActivities.length > 0 
    ? Math.round(hrActivities.reduce((sum, a) => sum + a.avgHeartRate!, 0) / hrActivities.length)
    : undefined;

  const longestDistance = activities.reduce((max, a) => Math.max(max, a.distanceMeters || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* Total Distance */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border hover:border-[#00F0FF]/40 transition-all shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Distance</span>
          <Milestone className="w-4 h-4 text-[#00F0FF] group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl md:text-2xl font-black text-white font-mono">
          {formatDistance(totalDistance, profile.unitPreference)}
        </div>
        <span className="text-[10px] text-slate-500 font-mono">All-time tracked</span>
      </div>

      {/* Active Time */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border hover:border-[#00F0FF]/40 transition-all shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Active Time</span>
          <Timer className="w-4 h-4 text-[#00F0FF] group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl md:text-2xl font-black text-white font-mono">
          {formatDuration(totalSeconds)}
        </div>
        <span className="text-[10px] text-slate-500 font-mono">{activities.length} total sessions</span>
      </div>

      {/* Calories */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border hover:border-amber-500/40 transition-all shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Calories</span>
          <Flame className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl md:text-2xl font-black text-amber-400 font-mono">
          {totalCalories.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kcal</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Energy expended</span>
      </div>

      {/* Elevation Gain */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border hover:border-[#00E676]/40 transition-all shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Elevation Climbed</span>
          <TrendingUp className="w-4 h-4 text-[#00E676] group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl md:text-2xl font-black text-[#00E676] font-mono">
          +{totalElevation.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">m</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Vertical ascent</span>
      </div>

      {/* Average Heart Rate */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border hover:border-[#FF2D55]/40 transition-all shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Heart Rate</span>
          <Heart className="w-4 h-4 text-[#FF2D55] group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl md:text-2xl font-black text-[#FF2D55] font-mono">
          {overallAvgHr ? `${overallAvgHr} bpm` : '--'}
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Across sessions</span>
      </div>

      {/* Longest Activity Record */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border hover:border-purple-500/40 transition-all shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Longest Workout</span>
          <Award className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl md:text-2xl font-black text-purple-400 font-mono">
          {formatDistance(longestDistance, profile.unitPreference)}
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Personal Best</span>
      </div>
    </div>
  );
};
