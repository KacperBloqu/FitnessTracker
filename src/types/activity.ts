export type SportType = 'running' | 'cycling' | 'walking' | 'swimming' | 'hiking' | 'workout' | 'other';

export interface TrackPoint {
  timestamp: number; // epoch ms
  lat: number;
  lon: number;
  altitude?: number; // meters
  heartRate?: number; // bpm
  speed?: number; // m/s
  cadence?: number; // rpm or spm
  distance?: number; // cumulative meters
}

export interface ActivityLap {
  lapIndex: number;
  startTime: string;
  durationSeconds: number;
  distanceMeters: number;
  avgPaceSecPerKm: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
}

export interface HeartRateZones {
  z1Sec: number; // Active Recovery / Warmup (< 60% max HR)
  z2Sec: number; // Aerobic Base / Fat Burn (60 - 70% max HR)
  z3Sec: number; // Tempo / Aerobic Endurance (70 - 80% max HR)
  z4Sec: number; // Lactate Threshold (80 - 90% max HR)
  z5Sec: number; // Anaerobic Capacity / VO2 Max (> 90% max HR)
}

export interface Activity {
  id: string;
  title: string;
  sport: SportType;
  startTime: string; // ISO 8601
  durationSeconds: number;
  distanceMeters: number;
  calories: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  avgCadence?: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  device?: string;
  trackPoints: TrackPoint[];
  laps: ActivityLap[];
  hrZones: HeartRateZones;
  sourceFile?: string;
  isFavorite?: boolean;
}

export interface UserProfile {
  name: string;
  maxHeartRate: number;
  restingHeartRate: number;
  unitPreference: 'metric' | 'imperial';
}

export interface DashboardStats {
  totalActivities: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalCalories: number;
  longestDistanceMeters: number;
  fastestPaceSecPerKm: number;
  currentStreakDays: number;
}
