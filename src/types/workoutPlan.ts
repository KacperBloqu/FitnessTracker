export interface WorkoutStep {
  id: string;
  name: string;
  type: 'warmup' | 'active' | 'rest' | 'recovery' | 'cooldown';
  durationSeconds?: number;
  distanceMeters?: number;
  targetPaceSecPerKm?: number;
  targetHrZone?: 1 | 2 | 3 | 4 | 5;
  targetCadenceSpm?: number;
  notes?: string;
}

export interface GymExercise {
  id: string;
  name: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Full Body';
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  notes?: string;
}

export interface SwimStep {
  id: string;
  name: string;
  distanceMeters: number;
  stroke: 'Freestyle' | 'Breaststroke' | 'Backstroke' | 'Butterfly' | 'Medley' | 'Kick' | 'Drill';
  targetPacePer100mSec?: number;
  restSeconds: number;
  notes?: string;
}

export interface StructuredWorkout {
  id: string;
  title: string;
  sport: 'running' | 'gym' | 'swimming';
  description: string;
  createdAt: string;
  estimatedDurationMinutes: number;
  steps?: WorkoutStep[];
  gymExercises?: GymExercise[];
  swimSteps?: SwimStep[];
  poolLengthMeters?: 25 | 50;
}
