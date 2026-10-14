import React, { useState } from 'react';
import { Activity, SportType, UserProfile } from '../types/activity';
import { formatDistance, formatDuration, formatPace, formatSpeed, formatDate } from '../utils/formatters';
import {
  Activity as ActivityIcon,
  Search,
  ChevronRight,
  Heart,
  Star,
  Plus,
  Bike,
  Footprints,
  Dumbbell
} from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  profile: UserProfile;
  onSelectActivity: (activity: Activity) => void;
  onOpenUpload: () => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  profile,
  onSelectActivity,
  onOpenUpload,
}) => {
  const [filterSport, setFilterSport] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = activities.filter((activity) => {
    const matchesSport = filterSport === 'all' || activity.sport === filterSport;
    const matchesQuery = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.sport.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesQuery;
  });

  const getSportIcon = (sport: SportType) => {
    switch (sport) {
      case 'cycling':
        return <Bike className="w-4 h-4 text-[#00E676]" />;
      case 'walking':
      case 'hiking':
        return <Footprints className="w-4 h-4 text-[#FFB800]" />;
      case 'workout':
        return <Dumbbell className="w-4 h-4 text-purple-400" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-[#00F0FF]" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-surface p-3 md:p-4 rounded-2xl border border-dark-border">
        {/* Sport Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['all', 'running', 'cycling', 'walking', 'workout'].map((sport) => (
            <button
              key={sport}
              onClick={() => setFilterSport(sport)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filterSport === sport
                  ? 'bg-[#00F0FF] text-black shadow-glow-cyan'
                  : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
          />
        </div>
      </div>

      {/* Activity Card List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-dark-surface rounded-3xl border border-dark-border space-y-4">
          <div className="w-14 h-14 rounded-full bg-dark-card border border-dark-border flex items-center justify-center mx-auto text-slate-400">
            <ActivityIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No activities found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Import a Garmin .FIT, .GPX, or .TCX file to see your workout analytics, GPS map, and heart rate zones.
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#00F0FF]/90 transition-all shadow-glow-cyan"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Import First Workout
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((activity) => {
            const paceSec = activity.distanceMeters > 0 ? (activity.durationSeconds / activity.distanceMeters) * 1000 : 0;
            return (
              <div
                key={activity.id}
                onClick={() => onSelectActivity(activity)}
                className="group relative bg-dark-surface hover:bg-dark-hover p-4 md:p-5 rounded-2xl border border-dark-border hover:border-[#00F0FF]/50 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Sport Icon, Title & Date */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center shrink-0 group-hover:border-[#00F0FF]/40 transition-colors">
                    {getSportIcon(activity.sport)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm md:text-base font-bold text-white group-hover:text-[#00F0FF] transition-colors">
                        {activity.title}
                      </h4>
                      {activity.isFavorite && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{formatDate(activity.startTime)}</p>
                  </div>
                </div>

                {/* Right: Key Metrics Strip */}
                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8 border-t sm:border-t-0 pt-3 sm:pt-0 border-dark-border/60">
                  {/* Distance */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Distance</span>
                    <span className="text-sm md:text-base font-black text-white font-mono">
                      {formatDistance(activity.distanceMeters, profile.unitPreference)}
                    </span>
                  </div>

                  {/* Duration */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Time</span>
                    <span className="text-sm md:text-base font-black text-slate-200 font-mono">
                      {formatDuration(activity.durationSeconds)}
                    </span>
                  </div>

                  {/* Pace / Speed */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      {activity.sport === 'cycling' ? 'Avg Speed' : 'Pace'}
                    </span>
                    <span className="text-sm md:text-base font-black text-[#00E676] font-mono">
                      {activity.sport === 'cycling'
                        ? formatSpeed(activity.avgSpeedMps, profile.unitPreference)
                        : formatPace(paceSec, profile.unitPreference)}
                    </span>
                  </div>

                  {/* Avg Heart Rate */}
                  {activity.avgHeartRate ? (
                    <div className="hidden lg:block">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Avg HR</span>
                      <span className="text-sm md:text-base font-black text-[#FF2D55] font-mono flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-[#FF2D55]" />
                        {activity.avgHeartRate}
                      </span>
                    </div>
                  ) : null}

                  <div className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-slate-400 group-hover:text-[#00F0FF] group-hover:border-[#00F0FF]/40 transition-all shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
