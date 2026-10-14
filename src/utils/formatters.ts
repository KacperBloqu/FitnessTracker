import { HeartRateZones, TrackPoint, ActivityLap } from '../types/activity';

export function formatDistance(meters: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const miles = meters / 1609.344;
    return `${miles.toFixed(2)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatPace(secPerKm: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (!secPerKm || !isFinite(secPerKm) || secPerKm <= 0 || secPerKm > 3600) {
    return '--:--';
  }

  const effectiveSec = unit === 'imperial' ? secPerKm * 1.609344 : secPerKm;
  const minutes = Math.floor(effectiveSec / 60);
  const seconds = Math.floor(effectiveSec % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')} /${unit === 'imperial' ? 'mi' : 'km'}`;
}

export function formatSpeed(mps: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (!mps || !isFinite(mps)) return '0.0';
  if (unit === 'imperial') {
    const mph = mps * 2.23694;
    return `${mph.toFixed(1)} mph`;
  }
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Converts Garmin semicircles to standard decimal degrees
 */
export function semicirclesToDegrees(semicircles: number): number {
  return semicircles * (180 / 2147483648);
}

/**
 * Computes time in 5 HR Zones based on maximum Heart Rate
 */
export function calculateHrZones(points: TrackPoint[], maxHr: number = 190): HeartRateZones {
  const zones: HeartRateZones = {
    z1Sec: 0,
    z2Sec: 0,
    z3Sec: 0,
    z4Sec: 0,
    z5Sec: 0,
  };

  if (!points || points.length < 2) return zones;

  for (let i = 1; i < points.length; i++) {
    const hr = points[i].heartRate;
    if (!hr) continue;

    const dt = Math.max(0, Math.min(10, (points[i].timestamp - points[i - 1].timestamp) / 1000));
    const pct = hr / maxHr;

    if (pct < 0.60) {
      zones.z1Sec += dt;
    } else if (pct < 0.70) {
      zones.z2Sec += dt;
    } else if (pct < 0.80) {
      zones.z3Sec += dt;
    } else if (pct < 0.90) {
      zones.z4Sec += dt;
    } else {
      zones.z5Sec += dt;
    }
  }

  return zones;
}

/**
 * Auto-splits track points into 1km / 1mi laps if native laps are not in file
 */
export function generateAutoLaps(points: TrackPoint[], lapDistanceMeters: number = 1000): ActivityLap[] {
  const laps: ActivityLap[] = [];
  if (!points || points.length === 0) return laps;

  let currentLapStart = points[0];
  let currentLapStartIndex = 0;
  let lapIndex = 1;
  let accumulatedDist = 0;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    
    // incremental distance
    let deltaDist = 0;
    if (p2.distance !== undefined && p1.distance !== undefined) {
      deltaDist = p2.distance - p1.distance;
    } else {
      // haversine approximation
      deltaDist = haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
    }

    if (deltaDist > 0) {
      accumulatedDist += deltaDist;
    }

    if (accumulatedDist >= lapDistanceMeters || i === points.length - 1) {
      const durationSec = Math.max(1, (p2.timestamp - currentLapStart.timestamp) / 1000);
      const lapSlice = points.slice(currentLapStartIndex, i + 1);
      
      const hrValues = lapSlice.map(p => p.heartRate).filter((hr): hr is number => hr !== undefined && hr > 0);
      const avgHr = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : undefined;
      const maxHr = hrValues.length ? Math.max(...hrValues) : undefined;

      const paceSecPerKm = (durationSec / Math.max(10, accumulatedDist)) * 1000;

      laps.push({
        lapIndex,
        startTime: new Date(currentLapStart.timestamp).toISOString(),
        durationSeconds: Math.round(durationSec),
        distanceMeters: Math.round(accumulatedDist),
        avgPaceSecPerKm: Math.round(paceSecPerKm),
        avgHeartRate: avgHr,
        maxHeartRate: maxHr,
      });

      lapIndex++;
      currentLapStart = p2;
      currentLapStartIndex = i;
      accumulatedDist = 0;
    }
  }

  return laps;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
