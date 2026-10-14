import { SportType } from './activity';

export interface CadenceAnalysis {
  avgSpm: number; // steps per minute
  avgFps: number; // footstrikes per second (avgSpm / 60)
  targetSpm: number;
  targetFps: number;
  status: 'low' | 'optimal' | 'high';
  headline: string;
  advice: string;
}

export interface PacingAnalysis {
  firstHalfPaceSec: number;
  secondHalfPaceSec: number;
  paceFadeSec: number; // positive = slowed down (positive split), negative = sped up (negative split)
  consistencyScore: number; // 0 - 100
  strategy: 'negative_split' | 'even_split' | 'faded';
  advice: string;
}

export interface AerobicEfficiencyAnalysis {
  efficiencyScore: number; // meters per heartbeat
  heartRateDriftPct: number; // % HR rise for steady pace
  isDecoupled: boolean;
  advice: string;
}

export interface WorkoutPrescription {
  title: string;
  sport: SportType;
  type: 'recovery' | 'aerobic_base' | 'threshold' | 'intervals' | 'strength' | 'swim_endurance';
  durationMinutes: number;
  intensity: 'Zone 1 Recovery' | 'Zone 2 Base' | 'Zone 3 Tempo' | 'Zone 4 Threshold' | 'Zone 5 Max';
  description: string;
  rationale: string;
  steps: {
    name: string;
    durationOrDist: string;
    target: string;
  }[];
}

export interface ProTip {
  id: string;
  sport: SportType;
  title: string;
  category: 'technique' | 'pacing' | 'cadence' | 'strength' | 'swimming' | 'recovery';
  message: string;
  actionableStep: string;
  badge: 'CADENCE' | 'EFFICIENCY' | 'SWOLF' | 'HYPERTROPHY' | 'RECOVERY';
}

export interface ActivityCoachReport {
  cadence?: CadenceAnalysis;
  pacing?: PacingAnalysis;
  aerobic?: AerobicEfficiencyAnalysis;
  prescription: WorkoutPrescription;
  proTips: ProTip[];
}
