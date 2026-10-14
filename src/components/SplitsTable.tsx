import React from 'react';
import { ActivityLap } from '../types/activity';
import { formatPace, formatDistance, formatDuration } from '../utils/formatters';
import { Zap, Heart, Flag } from 'lucide-react';

interface SplitsTableProps {
  laps: ActivityLap[];
  unit: 'metric' | 'imperial';
}

export const SplitsTable: React.FC<SplitsTableProps> = ({ laps, unit }) => {
  if (!laps || laps.length === 0) {
    return null;
  }

  // Find fastest lap pace
  const paces = laps.map(l => l.avgPaceSecPerKm).filter(p => p > 0);
  const fastestPace = paces.length > 0 ? Math.min(...paces) : 0;

  return (
    <div className="bg-dark-surface rounded-2xl border border-dark-border p-4 md:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
          <Flag className="w-4 h-4 text-[#00F0FF]" />
          Laps & Split Breakdown ({laps.length} Splits)
        </h3>
        <span className="text-xs text-slate-500 font-mono">1 km / 1 mi splits</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-dark-border text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Split</th>
              <th className="py-2.5 px-3">Distance</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Pace</th>
              <th className="py-2.5 px-3 text-right">Avg HR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/50 font-mono">
            {laps.map((lap) => {
              const isFastest = lap.avgPaceSecPerKm > 0 && lap.avgPaceSecPerKm === fastestPace;
              return (
                <tr
                  key={lap.lapIndex}
                  className={`hover:bg-dark-card/60 transition-colors ${
                    isFastest ? 'bg-[#00E676]/5 text-slate-100 font-medium' : 'text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-[10px] text-slate-400">
                      {lap.lapIndex}
                    </span>
                    {isFastest && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00E676]/20 text-[#00E676] font-sans font-bold">
                        FASTEST
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">{formatDistance(lap.distanceMeters, unit)}</td>
                  <td className="py-2.5 px-3">{formatDuration(lap.durationSeconds)}</td>
                  <td className="py-2.5 px-3 flex items-center gap-1.5">
                    <Zap className={`w-3 h-3 ${isFastest ? 'text-[#00E676]' : 'text-slate-500'}`} />
                    <span className={isFastest ? 'text-[#00E676] font-bold' : ''}>
                      {formatPace(lap.avgPaceSecPerKm, unit)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {lap.avgHeartRate ? (
                      <span className="inline-flex items-center gap-1 text-[#FF2D55]">
                        <Heart className="w-3 h-3" />
                        {lap.avgHeartRate} bpm
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
