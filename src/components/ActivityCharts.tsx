import React, { useState, useMemo } from 'react';
import { TrackPoint, HeartRateZones } from '../types/activity';
import { formatDuration, formatDistance } from '../utils/formatters';
import { Activity, Heart, TrendingUp, Zap } from 'lucide-react';

interface ActivityChartsProps {
  trackPoints: TrackPoint[];
  hrZones: HeartRateZones;
  unit: 'metric' | 'imperial';
  onHoverPoint?: (index: number | null) => void;
}

export const ActivityCharts: React.FC<ActivityChartsProps> = ({
  trackPoints,
  hrZones,
  unit,
  onHoverPoint,
}) => {
  const [activeMetric, setActiveMetric] = useState<'elevation' | 'hr' | 'pace'>('elevation');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Subsample points if activity is massive (e.g. > 10,000 points) for buttery 60fps SVG rendering
  const sampledPoints = useMemo(() => {
    if (!trackPoints || trackPoints.length === 0) return [];
    if (trackPoints.length <= 400) return trackPoints;
    const step = Math.ceil(trackPoints.length / 400);
    const result: TrackPoint[] = [];
    for (let i = 0; i < trackPoints.length; i += step) {
      result.push(trackPoints[i]);
    }
    // ensure last point is included
    if (result[result.length - 1] !== trackPoints[trackPoints.length - 1]) {
      result.push(trackPoints[trackPoints.length - 1]);
    }
    return result;
  }, [trackPoints]);

  const stats = useMemo(() => {
    if (sampledPoints.length === 0) return null;

    let minAlt = Infinity;
    let maxAlt = -Infinity;
    let minHr = Infinity;
    let maxHr = -Infinity;
    let maxSpeed = 0;

    sampledPoints.forEach((p) => {
      if (p.altitude !== undefined) {
        if (p.altitude < minAlt) minAlt = p.altitude;
        if (p.altitude > maxAlt) maxAlt = p.altitude;
      }
      if (p.heartRate !== undefined && p.heartRate > 0) {
        if (p.heartRate < minHr) minHr = p.heartRate;
        if (p.heartRate > maxHr) maxHr = p.heartRate;
      }
      if (p.speed !== undefined && p.speed > maxSpeed) {
        maxSpeed = p.speed;
      }
    });

    if (minAlt === Infinity) { minAlt = 0; maxAlt = 100; }
    if (minHr === Infinity) { minHr = 60; maxHr = 180; }
    if (minAlt === maxAlt) maxAlt += 10;
    if (minHr === maxHr) maxHr += 10;

    const totalDist = sampledPoints[sampledPoints.length - 1].distance || 1;

    return { minAlt, maxAlt, minHr, maxHr, maxSpeed, totalDist };
  }, [sampledPoints]);

  if (!stats || sampledPoints.length < 2) {
    return (
      <div className="p-8 text-center bg-dark-surface rounded-2xl border border-dark-border text-slate-400">
        No sensor stream data available for this activity.
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  // Generate SVG coordinates
  const altPoints = sampledPoints.map((p, i) => {
    const x = paddingX + (i / (sampledPoints.length - 1)) * chartW;
    const normY = ((p.altitude ?? stats.minAlt) - stats.minAlt) / (stats.maxAlt - stats.minAlt);
    const y = svgHeight - paddingY - normY * chartH;
    return { x, y, origIndex: i, point: p };
  });

  const hrPoints = sampledPoints.map((p, i) => {
    const x = paddingX + (i / (sampledPoints.length - 1)) * chartW;
    const hr = p.heartRate ?? stats.minHr;
    const normY = (hr - stats.minHr) / (stats.maxHr - stats.minHr);
    const y = svgHeight - paddingY - normY * chartH;
    return { x, y, origIndex: i, point: p };
  });

  const pacePoints = sampledPoints.map((p, i) => {
    const x = paddingX + (i / (sampledPoints.length - 1)) * chartW;
    const speed = p.speed ?? (stats.maxSpeed / 2);
    const normY = stats.maxSpeed > 0 ? speed / stats.maxSpeed : 0.5;
    const y = svgHeight - paddingY - normY * chartH;
    return { x, y, origIndex: i, point: p };
  });

  const altPathD = `M ${altPoints[0].x} ${altPoints[0].y} ` + altPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  const altAreaD = `${altPathD} L ${altPoints[altPoints.length - 1].x} ${svgHeight - paddingY} L ${altPoints[0].x} ${svgHeight - paddingY} Z`;

  const hrPathD = `M ${hrPoints[0].x} ${hrPoints[0].y} ` + hrPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  const pacePathD = `M ${pacePoints[0].x} ${pacePoints[0].y} ` + pacePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scale = svgWidth / rect.width;
    const svgX = clientX * scale;

    const relativeX = (svgX - paddingX) / chartW;
    const clamped = Math.max(0, Math.min(1, relativeX));
    const targetIdx = Math.round(clamped * (sampledPoints.length - 1));

    setHoverIndex(targetIdx);
    if (onHoverPoint) {
      // Find approximate index in original trackpoints
      const origIndex = Math.min(
        trackPoints.length - 1,
        Math.round((targetIdx / (sampledPoints.length - 1)) * (trackPoints.length - 1))
      );
      onHoverPoint(origIndex);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    if (onHoverPoint) onHoverPoint(null);
  };

  const currentHover = hoverIndex !== null ? sampledPoints[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? altPoints[hoverIndex]?.x : null;

  // HR Zones totals
  const totalZoneSec = (hrZones.z1Sec || 0) + (hrZones.z2Sec || 0) + (hrZones.z3Sec || 0) + (hrZones.z4Sec || 0) + (hrZones.z5Sec || 0);

  return (
    <div className="bg-dark-surface rounded-2xl border border-dark-border p-4 md:p-6 shadow-xl space-y-6">
      {/* Metric Selector Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Interactive Metric Streams</h3>
        <div className="flex items-center gap-1.5 bg-dark-card p-1 rounded-xl border border-dark-border">
          <button
            onClick={() => setActiveMetric('elevation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMetric === 'elevation'
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Elevation
          </button>
          <button
            onClick={() => setActiveMetric('hr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMetric === 'hr'
                ? 'bg-[#FF2D55]/15 text-[#FF2D55] border border-[#FF2D55]/30 shadow-glow-crimson'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Heart Rate
          </button>
          <button
            onClick={() => setActiveMetric('pace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMetric === 'pace'
                ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30 shadow-glow-emerald'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Pace & Speed
          </button>
        </div>
      </div>

      {/* Hover Status Bar */}
      {currentHover ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-dark-card/90 border border-dark-border px-4 py-2.5 rounded-xl text-xs font-mono">
          <div>
            <span className="text-slate-500">Distance: </span>
            <span className="text-slate-200 font-semibold">{formatDistance(currentHover.distance || 0, unit)}</span>
          </div>
          <div>
            <span className="text-slate-500">Elevation: </span>
            <span className="text-[#00F0FF] font-semibold">{Math.round(currentHover.altitude || 0)} m</span>
          </div>
          <div>
            <span className="text-slate-500">HR: </span>
            <span className="text-[#FF2D55] font-semibold">{currentHover.heartRate ? `${currentHover.heartRate} bpm` : '--'}</span>
          </div>
          <div>
            <span className="text-slate-500">Speed: </span>
            <span className="text-[#00E676] font-semibold">{currentHover.speed ? `${(currentHover.speed * 3.6).toFixed(1)} km/h` : '--'}</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 font-mono px-4 py-2.5 bg-dark-card/40 rounded-xl border border-dark-border/50">
          Hover or tap anywhere on the graph to inspect instant metrics and map position
        </div>
      )}

      {/* SVG Chart */}
      <div className="relative w-full aspect-[8/2.6] bg-dark-bg/60 rounded-xl border border-dark-border overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = touch.clientX - rect.left;
            const scale = svgWidth / rect.width;
            const svgX = clientX * scale;
            const relativeX = (svgX - paddingX) / chartW;
            const clamped = Math.max(0, Math.min(1, relativeX));
            setHoverIndex(Math.round(clamped * (sampledPoints.length - 1)));
          }}
        >
          <defs>
            <linearGradient id="elevationAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="hrAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF2D55" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FF2D55" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="paceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E676" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00E676" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#202D49" strokeDasharray="3 3" />
          <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#202D49" strokeDasharray="3 3" />
          <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#202D49" />

          {/* Elevation Curve & Shading */}
          {activeMetric === 'elevation' && (
            <>
              <path d={altAreaD} fill="url(#elevationAreaGrad)" />
              <path d={altPathD} fill="none" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Heart Rate Curve */}
          {activeMetric === 'hr' && (
            <>
              <path d={hrPathD} fill="none" stroke="#FF2D55" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Pace Curve */}
          {activeMetric === 'pace' && (
            <>
              <path d={pacePathD} fill="none" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Hover Crosshair Line & Point */}
          {hoverX !== null && hoverIndex !== null && (
            <>
              <line
                x1={hoverX}
                y1={paddingY}
                x2={hoverX}
                y2={svgHeight - paddingY}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {activeMetric === 'elevation' && altPoints[hoverIndex] && (
                <circle cx={altPoints[hoverIndex].x} cy={altPoints[hoverIndex].y} r="5" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="2" />
              )}
              {activeMetric === 'hr' && hrPoints[hoverIndex] && (
                <circle cx={hrPoints[hoverIndex].x} cy={hrPoints[hoverIndex].y} r="5" fill="#FF2D55" stroke="#FFFFFF" strokeWidth="2" />
              )}
              {activeMetric === 'pace' && pacePoints[hoverIndex] && (
                <circle cx={pacePoints[hoverIndex].x} cy={pacePoints[hoverIndex].y} r="5" fill="#00E676" stroke="#FFFFFF" strokeWidth="2" />
              )}
            </>
          )}
        </svg>
      </div>

      {/* Heart Rate Zones Distribution Bar */}
      {totalZoneSec > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-dark-border">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#FF2D55]" />
              Heart Rate Training Zones
            </span>
            <span className="text-slate-500">{formatDuration(totalZoneSec)} in zones</span>
          </div>

          <div className="flex h-3 w-full rounded-full overflow-hidden bg-dark-bg p-0.5 gap-0.5 border border-dark-border">
            <div style={{ width: `${((hrZones.z1Sec || 0) / totalZoneSec) * 100}%` }} className="bg-blue-500 rounded-sm" title={`Z1: ${formatDuration(hrZones.z1Sec || 0)}`} />
            <div style={{ width: `${((hrZones.z2Sec || 0) / totalZoneSec) * 100}%` }} className="bg-[#00E676] rounded-sm" title={`Z2: ${formatDuration(hrZones.z2Sec || 0)}`} />
            <div style={{ width: `${((hrZones.z3Sec || 0) / totalZoneSec) * 100}%` }} className="bg-[#00F0FF] rounded-sm" title={`Z3: ${formatDuration(hrZones.z3Sec || 0)}`} />
            <div style={{ width: `${((hrZones.z4Sec || 0) / totalZoneSec) * 100}%` }} className="bg-[#FFB800] rounded-sm" title={`Z4: ${formatDuration(hrZones.z4Sec || 0)}`} />
            <div style={{ width: `${((hrZones.z5Sec || 0) / totalZoneSec) * 100}%` }} className="bg-[#FF2D55] rounded-sm" title={`Z5: ${formatDuration(hrZones.z5Sec || 0)}`} />
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-[11px] text-center pt-1">
            <div className="p-1 rounded bg-dark-card border border-dark-border">
              <span className="block text-blue-400 font-bold">Z1 Recovery</span>
              <span className="text-slate-400 font-mono">{formatDuration(hrZones.z1Sec || 0)}</span>
            </div>
            <div className="p-1 rounded bg-dark-card border border-dark-border">
              <span className="block text-[#00E676] font-bold">Z2 Aerobic</span>
              <span className="text-slate-400 font-mono">{formatDuration(hrZones.z2Sec || 0)}</span>
            </div>
            <div className="p-1 rounded bg-dark-card border border-dark-border">
              <span className="block text-[#00F0FF] font-bold">Z3 Tempo</span>
              <span className="text-slate-400 font-mono">{formatDuration(hrZones.z3Sec || 0)}</span>
            </div>
            <div className="p-1 rounded bg-dark-card border border-dark-border">
              <span className="block text-[#FFB800] font-bold">Z4 Threshold</span>
              <span className="text-slate-400 font-mono">{formatDuration(hrZones.z4Sec || 0)}</span>
            </div>
            <div className="p-1 rounded bg-dark-card border border-dark-border">
              <span className="block text-[#FF2D55] font-bold">Z5 Max/VO2</span>
              <span className="text-slate-400 font-mono">{formatDuration(hrZones.z5Sec || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
