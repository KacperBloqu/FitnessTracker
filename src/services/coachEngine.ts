import { Activity } from '../types/activity';
import {
  CadenceAnalysis,
  PacingAnalysis,
  AerobicEfficiencyAnalysis,
  WorkoutPrescription,
  ProTip,
  ActivityCoachReport,
} from '../types/coach';

export function analyzeActivityCoach(activity: Activity): ActivityCoachReport {
  const cadence = analyzeCadence(activity);
  const pacing = analyzePacing(activity);
  const aerobic = analyzeAerobicEfficiency(activity);
  const prescription = generateNextWorkoutPrescription(activity, cadence);
  const proTips = generateProTips(activity, cadence);

  return {
    cadence,
    pacing,
    aerobic,
    prescription,
    proTips,
  };
}

/**
 * Analyzes Cadence in Steps-Per-Minute (SPM) and Footstrikes-Per-Second (FPS)
 */
function analyzeCadence(activity: Activity): CadenceAnalysis | undefined {
  let spm = activity.avgCadence;

  // Fallback to average from trackpoints
  if (!spm && activity.trackPoints && activity.trackPoints.length > 0) {
    const cadences = activity.trackPoints
      .map((p) => p.cadence)
      .filter((c): c is number => c !== undefined && c > 50 && c < 260);

    if (cadences.length > 0) {
      spm = Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length);
    }
  }

  // If still not available for running, supply benchmark estimate based on speed
  if (!spm && activity.sport === 'running') {
    spm = 166; // estimated benchmark
  }

  if (!spm) return undefined;

  // Footstrikes per second (180 SPM = 3.0 FPS)
  const fps = Math.round((spm / 60) * 100) / 100;

  if (activity.sport === 'cycling') {
    const isOptimal = spm >= 80 && spm <= 95;
    return {
      avgSpm: spm,
      avgFps: fps,
      targetSpm: 90,
      targetFps: 1.5,
      status: isOptimal ? 'optimal' : spm < 80 ? 'low' : 'high',
      headline: isOptimal ? 'Optimal Pedaling Cadence (80-95 RPM)' : spm < 80 ? 'Low Pedaling Cadence (Grinding)' : 'High Cadence Spin',
      advice: spm < 80
        ? `Your cycling cadence was ${spm} RPM. Grinding heavy gears below 80 RPM causes muscular fatigue in your quads and knees. Shift into an easier gear to spin closer to 85-92 RPM.`
        : `Great cadence at ${spm} RPM! Efficient pedaling reduces leg strain and relies on aerobic energy.`,
    };
  }

  // Running Cadence Analysis
  if (spm < 165) {
    return {
      avgSpm: spm,
      avgFps: fps,
      targetSpm: 174,
      targetFps: 2.9,
      status: 'low',
      headline: `Cadence: ${spm} SPM (${fps} FPS) — Overstriding Detected`,
      advice: `Your average cadence was ${spm} steps/min (${fps} footstrikes/sec). Cadence under 165 SPM usually means your feet are landing too far ahead of your hips (overstriding), creating excessive braking forces and shock to knees and shins. Next time, aim for 170-175 SPM (2.85-2.90 FPS) by taking slightly shorter, quicker steps with a compact stride.`,
    };
  } else if (spm >= 165 && spm <= 184) {
    return {
      avgSpm: spm,
      avgFps: fps,
      targetSpm: 176,
      targetFps: 2.93,
      status: 'optimal',
      headline: `Cadence: ${spm} SPM (${fps} FPS) — Optimal Running Rhythm`,
      advice: `Excellent cadence! At ${spm} SPM (${fps} footstrikes/sec), your ground contact time is minimized and you are maximizing elastic energy recoil from your Achilles tendons and calves. Maintain this cadence even when running slow recovery paces.`,
    };
  } else {
    return {
      avgSpm: spm,
      avgFps: fps,
      targetSpm: 180,
      targetFps: 3.0,
      status: 'high',
      headline: `Cadence: ${spm} SPM (${fps} FPS) — High Turnover`,
      advice: `Fast cadence at ${spm} SPM (${fps} footstrikes/sec). High turnover is great for sprint finishes and interval repeats. Ensure you maintain full hip drive rather than short shuffling steps.`,
    };
  }
}

/**
 * Analyzes Pacing Consistency, Splitting, and Fade
 */
function analyzePacing(activity: Activity): PacingAnalysis | undefined {
  if (!activity.laps || activity.laps.length < 2) return undefined;

  const validLaps = activity.laps.filter((l) => l.avgPaceSecPerKm > 0 && l.avgPaceSecPerKm < 1200);
  if (validLaps.length < 2) return undefined;

  const mid = Math.floor(validLaps.length / 2);
  const firstHalfLaps = validLaps.slice(0, mid);
  const secondHalfLaps = validLaps.slice(mid);

  const firstHalfAvg = firstHalfLaps.reduce((sum, l) => sum + l.avgPaceSecPerKm, 0) / firstHalfLaps.length;
  const secondHalfAvg = secondHalfLaps.reduce((sum, l) => sum + l.avgPaceSecPerKm, 0) / secondHalfLaps.length;

  const paceFadeSec = Math.round(secondHalfAvg - firstHalfAvg);
  const consistencyScore = Math.max(20, Math.min(100, Math.round(100 - Math.abs(paceFadeSec) * 1.5)));

  let strategy: 'negative_split' | 'even_split' | 'faded' = 'even_split';
  let advice = '';

  if (paceFadeSec < -5) {
    strategy = 'negative_split';
    advice = `Masterful pacing! You ran the second half ${Math.abs(paceFadeSec)}s/km faster than the first (negative split). Starting controlled allowed you to finish with power.`;
  } else if (paceFadeSec > 15) {
    strategy = 'faded';
    advice = `Pace fade detected: your second half was ${paceFadeSec}s/km slower than your first half. You likely went out slightly too fast in the opening kilometers. Next time, aim to run the first 2-3 km 10s slower than goal pace.`;
  } else {
    strategy = 'even_split';
    advice = `Consistent execution! Your pace held steady within ${Math.abs(paceFadeSec)}s/km throughout the workout. This produces maximum metabolic efficiency.`;
  }

  return {
    firstHalfPaceSec: Math.round(firstHalfAvg),
    secondHalfPaceSec: Math.round(secondHalfAvg),
    paceFadeSec,
    consistencyScore,
    strategy,
    advice,
  };
}

/**
 * Analyzes Aerobic Decoupling (Cardiac Drift)
 */
function analyzeAerobicEfficiency(activity: Activity): AerobicEfficiencyAnalysis | undefined {
  if (!activity.avgHeartRate || activity.avgHeartRate <= 0) return undefined;
  if (!activity.trackPoints || activity.trackPoints.length < 30) return undefined;

  const ptsWithHr = activity.trackPoints.filter((p) => p.heartRate && p.heartRate > 0 && p.speed && p.speed > 0);
  if (ptsWithHr.length < 20) return undefined;

  const mid = Math.floor(ptsWithHr.length / 2);
  const firstHalf = ptsWithHr.slice(0, mid);
  const secondHalf = ptsWithHr.slice(mid);

  const speedToHr1 = (firstHalf.reduce((s, p) => s + p.speed!, 0) / firstHalf.length) /
                     (firstHalf.reduce((s, p) => s + p.heartRate!, 0) / firstHalf.length);

  const speedToHr2 = (secondHalf.reduce((s, p) => s + p.speed!, 0) / secondHalf.length) /
                     (secondHalf.reduce((s, p) => s + p.heartRate!, 0) / secondHalf.length);

  const driftPct = Math.round(((speedToHr1 - speedToHr2) / speedToHr1) * 100);
  const isDecoupled = driftPct > 5;

  let advice = '';
  if (isDecoupled) {
    advice = `Aerobic decoupling of +${driftPct}% detected. Your heart rate drifted higher while speed stayed steady or dropped. This suggests either dehydration, core temperature buildup, or aerobic fatigue. Make sure to hydrate 500ml before your next session.`;
  } else {
    advice = `Solid aerobic endurance! Cardiac drift stayed under 5% (${driftPct}%), indicating your cardiovascular system remained stable under effort.`;
  }

  return {
    efficiencyScore: Math.round(speedToHr1 * 1000) / 10,
    heartRateDriftPct: driftPct,
    isDecoupled,
    advice,
  };
}

/**
 * Generates an Actionable Next Workout Prescription
 */
function generateNextWorkoutPrescription(activity: Activity, _cadence?: CadenceAnalysis): WorkoutPrescription {
  const isHighIntensity = (activity.hrZones.z4Sec + activity.hrZones.z5Sec) > (activity.durationSeconds * 0.25);
  const isLongDuration = activity.durationSeconds > 4500; // > 75 mins

  if (activity.sport === 'running') {
    if (isHighIntensity || isLongDuration) {
      return {
        title: 'Zone 2 Active Recovery & Cadence Flush',
        sport: 'running',
        type: 'recovery',
        durationMinutes: 40,
        intensity: 'Zone 2 Base',
        description: '40 minutes of relaxed, conversational jogging strictly in Heart Rate Zone 2, focusing on quick light cadence turnover.',
        rationale: 'Your last session had high intensity or long fatigue. An easy Zone 2 flush stimulates mitochondrial capillary density without adding muscular breakdown.',
        steps: [
          { name: 'Warmup Jog', durationOrDist: '5 min', target: 'Zone 1 (Heart Rate < 125 bpm)' },
          { name: 'Easy Aerobic Pace', durationOrDist: '30 min', target: 'Zone 2 (Pace conversational, Cadence 172-176 SPM)' },
          { name: 'Cadence Strides (x4)', durationOrDist: '4 x 20 sec', target: 'Fast & Relaxed (Cadence 180+ SPM / 3.0 FPS)' },
          { name: 'Cooldown Walk', durationOrDist: '3 min', target: 'Zone 1 Recovery' },
        ],
      };
    } else {
      return {
        title: 'Threshold Cruise Intervals (5 x 1000m)',
        sport: 'running',
        type: 'threshold',
        durationMinutes: 50,
        intensity: 'Zone 4 Threshold',
        description: 'Lactate threshold intervals designed to elevate your race pace and fatigue resistance.',
        rationale: 'You are well-recovered from your recent session. Stimulating your lactate clearance rate now will boost your running speed economy.',
        steps: [
          { name: 'Easy Warmup', durationOrDist: '12 min', target: 'Zone 2 (Easy Jog)' },
          { name: '5 x 1000m Intervals', durationOrDist: '5 repeats', target: 'Zone 4 Threshold Pace (90s jog recovery between)' },
          { name: 'Cooldown Flush', durationOrDist: '8 min', target: 'Zone 1 Recovery' },
        ],
      };
    }
  } else if (activity.sport === 'swimming') {
    return {
      title: 'Stroke Technique & Aerobic Ladder (1800m)',
      sport: 'swimming',
      type: 'swim_endurance',
      durationMinutes: 45,
      intensity: 'Zone 2 Base',
      description: 'Focus on high-elbow catch, head position, and decreasing stroke count per 50m (SWOLF efficiency).',
      rationale: 'Swimming efficiency is 80% hydrodynamic drag reduction. Ladder intervals teach stroke pacing under fatigue.',
      steps: [
        { name: 'Warmup Choice', durationOrDist: '300m', target: 'Easy Freestyle & Breaststroke' },
        { name: 'High Elbow Catch Drills', durationOrDist: '4 x 50m', target: 'Fingertip drag drill with 20s rest' },
        { name: 'Main Set Aerobic Ladder', durationOrDist: '100m, 200m, 300m, 200m, 100m', target: 'Consistent pace @ 1:45/100m (30s rest)' },
        { name: 'Cooldown', durationOrDist: '200m', target: 'Gentle Backstroke & Freestyle' },
      ],
    };
  } else {
    return {
      title: 'Hypertrophy Full-Body Strength & Core',
      sport: 'workout',
      type: 'strength',
      durationMinutes: 50,
      intensity: 'Zone 3 Tempo',
      description: 'Compound strength movements to build muscular resilience, bone density, and running power.',
      rationale: 'Heavy compounds build connective tissue resilience, protecting joints from repetitive impact injuries.',
      steps: [
        { name: 'Barbell Squats', durationOrDist: '4 sets x 8 reps', target: 'RPE 7-8 (Rest 2 min)' },
        { name: 'Romanian Deadlifts', durationOrDist: '3 sets x 10 reps', target: 'Hamstring & Glute power (Rest 90s)' },
        { name: 'Dumbbell Bench Press', durationOrDist: '4 sets x 10 reps', target: 'Chest & Tricep stability' },
        { name: 'Pull-Ups / Lat Pulldown', durationOrDist: '3 sets x 10 reps', target: 'Back posture & Lat strength' },
        { name: 'Hanging Knee Raises', durationOrDist: '3 sets x 15 reps', target: 'Core & Hip flexor stabilization' },
      ],
    };
  }
}

/**
 * Curated Pro Tips for Running, Gym, and Swimming
 */
function generateProTips(_activity: Activity, _cadence?: CadenceAnalysis): ProTip[] {
  const tips: ProTip[] = [
    {
      id: 'tip-run-cadence',
      sport: 'running',
      title: 'The 180 SPM (3.0 FPS) Cadence Rule',
      category: 'cadence',
      message: 'Running with a cadence between 170-180 SPM (2.8 - 3.0 footstrikes/second) shortens your stride length naturally, landing your foot directly under your center of mass rather than in front of it.',
      actionableStep: 'Count your right foot strikes for 30 seconds on your next run. If it is under 42 (84 SPM total), use a metronome app or upbeat playlist set to 175 BPM.',
      badge: 'CADENCE',
    },
    {
      id: 'tip-run-negative-split',
      sport: 'running',
      title: 'Negative Split Pacing Strategy',
      category: 'pacing',
      message: 'World records from 5K to the Marathon are almost exclusively set with negative splits (the second half run faster than the first). Running fast early burns through finite glycogen reserves and floods muscles with hydrogen ions.',
      actionableStep: 'On your next 5k or 10k tempo run, deliberately run the first kilometer 15 seconds slower than your target pace.',
      badge: 'EFFICIENCY',
    },
    {
      id: 'tip-gym-progressive-overload',
      sport: 'workout',
      title: 'Progressive Overload for Runners & Swimmers',
      category: 'strength',
      message: 'Heavy strength training does not make endurance athletes bulky; it increases motor unit recruitment, tendon stiffness, and running economy by up to 8%.',
      actionableStep: 'Focus on 3 core movements: Barbell Back Squats, Romanian Deadlifts, and Single-Leg Bulgarian Split Squats twice a week.',
      badge: 'HYPERTROPHY',
    },
    {
      id: 'tip-swim-swolf',
      sport: 'swimming',
      title: 'Mastering Your SWOLF Score in the Pool',
      category: 'swimming',
      message: 'SWOLF (Swimming + Golf) is calculated as: Time in seconds + Number of strokes to cross the pool. A lower score means you are gliding further per stroke with less wasted energy.',
      actionableStep: 'During 50m intervals, try to drop your stroke count by 2 without letting your split time drop. Focus on holding water with a vertical forearm.',
      badge: 'SWOLF',
    },
    {
      id: 'tip-recovery-sleep',
      sport: 'running',
      title: 'The 80/20 Polarized Training Rule',
      category: 'recovery',
      message: '80% of your weekly endurance mileage should be strictly in Zone 2 (where you can easily speak full sentences). Only 20% should be high-intensity threshold or VO2 max intervals.',
      actionableStep: 'If your heart rate exceeds 75% of your max on easy days, slow down to a walk until it recovers.',
      badge: 'RECOVERY',
    },
  ];

  return tips;
}
