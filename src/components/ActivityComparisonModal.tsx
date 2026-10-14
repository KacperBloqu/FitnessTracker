import React, { useState } from 'react';
import { Activity, UserProfile } from '../types/activity';
import { formatDistance, formatDuration, formatPace, formatDate } from '../utils/formatters';
import { X, GitCompare, Award } from 'lucide-react';

interface ActivityComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  profile: UserProfile;
  initialActivityId?: string;
}

export const ActivityComparisonModal: React.FC<ActivityComparisonModalProps> = ({
  isOpen,
  onClose,
  activities,
  profile,
  initialActivityId,
}) => {
  const [activityAId, setActivityAId] = useState<string>(initialActivityId || (activities[0]?.id || ''));
  const [activityBId, setActivityBId] = useState<string>(activities[1]?.id || (activities[0]?.id || ''));

  if (!isOpen) return null;

  const activityA = activities.find((a) => a.id === activityAId);
  const activityB = activities.find((a) => a.id === activityBId);

  // Compute metrics for Activity A
  const paceSecA = activityA && activityA.distanceMeters > 0 ? (activityA.durationSeconds / activityA.distanceMeters) * 1000 : 0;
  const paceSecB = activityB && activityB.distanceMeters > 0 ? (activityB.durationSeconds / activityB.distanceMeters) * 1000 : 0;
  const paceDiffSec = Math.round(paceSecB - paceSecA);

  const distDiffMeters = (activityB?.distanceMeters || 0) - (activityA?.distanceMeters || 0);
  const hrDiffBpm = (activityB?.avgHeartRate || 0) - (activityA?.avgHeartRate || 0);

  // Cadence in SPM and FPS
  const spmA = activityA?.avgCadence || 0;
  const spmB = activityB?.avgCadence || 0;
  const fpsA = spmA > 0 ? (spmA / 60).toFixed(2) : '--';
  const fpsB = spmB > 0 ? (spmB / 60).toFixed(2) : '--';

  // Aerobic Efficiency: Speed (m/s) divided by Heart Rate
  const efficiencyA = activityA && activityA.avgHeartRate && activityA.avgHeartRate > 0
    ? (activityA.avgSpeedMps / activityA.avgHeartRate) * 1000
    : 0;

  const efficiencyB = activityB && activityB.avgHeartRate && activityB.avgHeartRate > 0
    ? (activityB.avgSpeedMps / activityB.avgHeartRate) * 1000
    : 0;

  const efficiencyDiff = Math.round((efficiencyB - efficiencyA) * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-dark-surface border border-dark-border rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-dark-card border border-dark-border text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/15 text-[#00F0FF] flex items-center justify-center border border-[#00F0FF]/30">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">Compare Activities Side-by-Side</h2>
            <p className="text-xs text-slate-400">Evaluate pacing consistency, cadence changes (FPS), and aerobic efficiency</p>
          </div>
        </div>

        {/* Activity Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-card p-4 rounded-2xl border border-dark-border">
          <div>
            <label className="block text-xs font-semibold text-[#00F0FF] mb-1.5 uppercase tracking-wider">
              Activity A (Baseline)
            </label>
            <select
              value={activityAId}
              onChange={(e) => setActivityAId(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-[#00F0FF]"
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({formatDate(a.startTime)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#00E676] mb-1.5 uppercase tracking-wider">
              Activity B (Comparison)
            </label>
            <select
              value={activityBId}
              onChange={(e) => setActivityBId(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-[#00E676]"
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({formatDate(a.startTime)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activityA && activityB ? (
          <div className="space-y-4">
            {/* Aerobic Efficiency Highlight Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-dark-card to-dark-hover border border-dark-border flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Aerobic Fitness & Efficiency Delta
                </span>
                <p className="text-xs text-slate-300">
                  {efficiencyDiff > 0
                    ? `Positive adaptation! In Activity B, you produced +${efficiencyDiff} higher velocity per heartbeat, showing improved cardiovascular efficiency.`
                    : efficiencyDiff < 0
                    ? `Activity B had ${Math.abs(efficiencyDiff)} lower efficiency index, suggesting higher fatigue, heat stress, or higher terrain challenge.`
                    : 'Aerobic efficiency was identical between both activities.'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Efficiency Ratio</span>
                <span className="text-lg md:text-xl font-black font-mono text-amber-400">
                  {efficiencyA.toFixed(1)} &rarr; {efficiencyB.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Activity A Column */}
              <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-4">
                <div className="border-b border-dark-border pb-3">
                  <span className="text-[10px] uppercase font-bold text-[#00F0FF] tracking-wider">Activity A</span>
                  <h3 className="text-base font-bold text-white">{activityA.title}</h3>
                  <span className="text-xs text-slate-400 font-mono">{formatDate(activityA.startTime)}</span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Distance</span>
                    <span className="text-white font-bold">{formatDistance(activityA.distanceMeters, profile.unitPreference)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white font-bold">{formatDuration(activityA.durationSeconds)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Pace</span>
                    <span className="text-[#00E676] font-bold">{formatPace(paceSecA, profile.unitPreference)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Cadence (SPM / FPS)</span>
                    <span className="text-white font-bold">
                      {spmA > 0 ? `${spmA} SPM (${fpsA} FPS)` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Avg Heart Rate</span>
                    <span className="text-[#FF2D55] font-bold">{activityA.avgHeartRate ? `${activityA.avgHeartRate} bpm` : '--'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Elevation Gain</span>
                    <span className="text-[#00F0FF] font-bold">+{activityA.elevationGainMeters} m</span>
                  </div>
                </div>
              </div>

              {/* Activity B Column with Deltas */}
              <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-4">
                <div className="border-b border-dark-border pb-3">
                  <span className="text-[10px] uppercase font-bold text-[#00E676] tracking-wider">Activity B (Delta)</span>
                  <h3 className="text-base font-bold text-white">{activityB.title}</h3>
                  <span className="text-xs text-slate-400 font-mono">{formatDate(activityB.startTime)}</span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Distance</span>
                    <div className="text-right">
                      <span className="text-white font-bold mr-2">{formatDistance(activityB.distanceMeters, profile.unitPreference)}</span>
                      <span className={`text-[11px] ${distDiffMeters >= 0 ? 'text-[#00E676]' : 'text-[#FF2D55]'}`}>
                        ({distDiffMeters >= 0 ? '+' : ''}{(distDiffMeters / 1000).toFixed(2)} km)
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white font-bold">{formatDuration(activityB.durationSeconds)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Pace</span>
                    <div className="text-right">
                      <span className="text-[#00E676] font-bold mr-2">{formatPace(paceSecB, profile.unitPreference)}</span>
                      <span className={`text-[11px] ${paceDiffSec <= 0 ? 'text-[#00E676]' : 'text-[#FF2D55]'}`}>
                        ({paceDiffSec <= 0 ? `${paceDiffSec}s faster` : `+${paceDiffSec}s slower`})
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Cadence (SPM / FPS)</span>
                    <div className="text-right">
                      <span className="text-white font-bold mr-2">
                        {spmB > 0 ? `${spmB} SPM (${fpsB} FPS)` : '--'}
                      </span>
                      {spmA > 0 && spmB > 0 && (
                        <span className={`text-[11px] ${spmB >= spmA ? 'text-[#00E676]' : 'text-slate-400'}`}>
                          ({spmB >= spmA ? '+' : ''}{spmB - spmA} SPM)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border/40">
                    <span className="text-slate-400">Avg Heart Rate</span>
                    <div className="text-right">
                      <span className="text-[#FF2D55] font-bold mr-2">{activityB.avgHeartRate ? `${activityB.avgHeartRate} bpm` : '--'}</span>
                      {activityA.avgHeartRate && activityB.avgHeartRate && (
                        <span className={`text-[11px] ${hrDiffBpm <= 0 ? 'text-[#00E676]' : 'text-[#FF2D55]'}`}>
                          ({hrDiffBpm > 0 ? '+' : ''}{hrDiffBpm} bpm)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Elevation Gain</span>
                    <span className="text-[#00F0FF] font-bold">+{activityB.elevationGainMeters} m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            Please select two activities above to compare.
          </div>
        )}
      </div>
    </div>
  );
};
