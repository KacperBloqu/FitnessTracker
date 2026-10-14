import React, { useState } from 'react';
import { StructuredWorkout, WorkoutStep, GymExercise, SwimStep } from '../types/workoutPlan';
import { downloadWorkoutFit, downloadWorkoutJson } from '../services/garminWorkoutExporter';
import { X, Plus, Trash2, Watch, Dumbbell, Waves, Footprints, Download, Sparkles, Check, HelpCircle } from 'lucide-react';

interface WorkoutCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkoutCreatorModal: React.FC<WorkoutCreatorModalProps> = ({ isOpen, onClose }) => {
  const [sport, setSport] = useState<'running' | 'gym' | 'swimming'>('running');
  const [title, setTitle] = useState('5x1000m Threshold Intervals');
  const [description, setDescription] = useState('Build lactate threshold speed and cadence turnover.');
  const [estimatedDuration, setEstimatedDuration] = useState(45);
  const [showGarminHelp, setShowGarminHelp] = useState(false);

  // Running steps state
  const [runSteps, setRunSteps] = useState<WorkoutStep[]>([
    { id: '1', name: 'Warmup Jog', type: 'warmup', durationSeconds: 600, targetPaceSecPerKm: 330, notes: 'Zone 2 relaxed' },
    { id: '2', name: '1000m Repeat 1', type: 'active', distanceMeters: 1000, targetPaceSecPerKm: 270, notes: 'Zone 4 Threshold' },
    { id: '3', name: 'Jog Recovery', type: 'recovery', durationSeconds: 90, notes: 'Heart rate < 130 bpm' },
    { id: '4', name: '1000m Repeat 2', type: 'active', distanceMeters: 1000, targetPaceSecPerKm: 270, notes: 'Maintain cadence 176+ SPM' },
    { id: '5', name: 'Jog Recovery', type: 'recovery', durationSeconds: 90, notes: 'Shake out arms' },
    { id: '6', name: 'Cooldown Flush', type: 'cooldown', durationSeconds: 600, notes: 'Zone 1 walk/jog' },
  ]);

  // Gym exercises state
  const [gymExercises, setGymExercises] = useState<GymExercise[]>([
    { id: '1', name: 'Barbell Back Squats', muscleGroup: 'Legs', sets: 4, reps: 8, weightKg: 80, restSeconds: 120, notes: 'Full depth' },
    { id: '2', name: 'Romanian Deadlifts', muscleGroup: 'Legs', sets: 3, reps: 10, weightKg: 70, restSeconds: 90, notes: 'Hamstrings stretch' },
    { id: '3', name: 'Barbell Bench Press', muscleGroup: 'Chest', sets: 4, reps: 8, weightKg: 75, restSeconds: 90, notes: 'Pause at bottom' },
    { id: '4', name: 'Pull-Ups / Lat Pulldown', muscleGroup: 'Back', sets: 4, reps: 10, weightKg: 65, restSeconds: 75, notes: 'Engage lats' },
  ]);

  // Swimming steps state
  const [swimSteps, setSwimSteps] = useState<SwimStep[]>([
    { id: '1', name: 'Warmup Easy', distanceMeters: 300, stroke: 'Freestyle', restSeconds: 30, notes: 'Long glide' },
    { id: '2', name: 'High Elbow Catch Drill', distanceMeters: 200, stroke: 'Drill', restSeconds: 20, notes: 'Fingertip drag' },
    { id: '3', name: '4x100m Threshold Pace', distanceMeters: 400, stroke: 'Freestyle', targetPacePer100mSec: 105, restSeconds: 20, notes: 'Count strokes (SWOLF)' },
    { id: '4', name: 'Cooldown Choice', distanceMeters: 200, stroke: 'Backstroke', restSeconds: 0, notes: 'Relax shoulders' },
  ]);

  if (!isOpen) return null;

  const currentWorkout: StructuredWorkout = {
    id: `workout-${Date.now()}`,
    title,
    sport,
    description,
    createdAt: new Date().toISOString(),
    estimatedDurationMinutes: estimatedDuration,
    steps: sport === 'running' ? runSteps : undefined,
    gymExercises: sport === 'gym' ? gymExercises : undefined,
    swimSteps: sport === 'swimming' ? swimSteps : undefined,
  };

  const handleDownloadFit = () => {
    downloadWorkoutFit(currentWorkout);
    setShowGarminHelp(true);
  };

  const handleDownloadJson = () => {
    downloadWorkoutJson(currentWorkout);
  };

  const loadTemplate = (templateType: '5k_run' | 'tempo_run' | 'push_gym' | 'swim_endurance') => {
    if (templateType === '5k_run') {
      setSport('running');
      setTitle('5K Speed Intervals (6x800m)');
      setDescription('High VO2 Max repeats for 5k and 10k speed development.');
      setRunSteps([
        { id: '1', name: 'Warmup Jog', type: 'warmup', durationSeconds: 600, notes: 'Dynamic drills' },
        { id: '2', name: '800m Interval', type: 'active', distanceMeters: 800, targetPaceSecPerKm: 250, notes: 'Target cadence 180 SPM (3.0 FPS)' },
        { id: '3', name: 'Rest', type: 'recovery', durationSeconds: 90 },
        { id: '4', name: '800m Interval', type: 'active', distanceMeters: 800, targetPaceSecPerKm: 250 },
        { id: '5', name: 'Cooldown', type: 'cooldown', durationSeconds: 600 },
      ]);
    } else if (templateType === 'push_gym') {
      setSport('gym');
      setTitle('Push Day Hypertrophy & Stability');
      setDescription('Targeting Chest, Shoulders, and Triceps.');
      setGymExercises([
        { id: '1', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', sets: 4, reps: 10, weightKg: 28, restSeconds: 90 },
        { id: '2', name: 'Overhead Barbell Press', muscleGroup: 'Shoulders', sets: 4, reps: 8, weightKg: 50, restSeconds: 120 },
        { id: '3', name: 'Dumbbell Lateral Raises', muscleGroup: 'Shoulders', sets: 4, reps: 15, weightKg: 12, restSeconds: 60 },
        { id: '4', name: 'Triceps Rope Pushdowns', muscleGroup: 'Arms', sets: 3, reps: 12, weightKg: 25, restSeconds: 60 },
      ]);
    } else if (templateType === 'swim_endurance') {
      setSport('swimming');
      setTitle('Aerobic Threshold Ladder (1500m)');
      setDescription('Build aerobic capacity and stroke economy in the pool.');
      setSwimSteps([
        { id: '1', name: 'Warmup', distanceMeters: 300, stroke: 'Freestyle', restSeconds: 30 },
        { id: '2', name: '100m Pace', distanceMeters: 100, stroke: 'Freestyle', targetPacePer100mSec: 100, restSeconds: 15 },
        { id: '3', name: '200m Pace', distanceMeters: 200, stroke: 'Freestyle', targetPacePer100mSec: 105, restSeconds: 20 },
        { id: '4', name: '300m Sustained', distanceMeters: 300, stroke: 'Freestyle', targetPacePer100mSec: 110, restSeconds: 30 },
        { id: '5', name: 'Cooldown', distanceMeters: 200, stroke: 'Backstroke', restSeconds: 0 },
      ]);
    }
  };

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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F0FF] to-blue-600 flex items-center justify-center text-black font-bold">
            <Watch className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">Create Structured Workout</h2>
            <p className="text-xs text-slate-400">Design custom intervals and sync directly to your Garmin watch</p>
          </div>
        </div>

        {/* Sport Selection Tabs */}
        <div className="flex items-center gap-2 border-b border-dark-border pb-3">
          <button
            onClick={() => setSport('running')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              sport === 'running'
                ? 'bg-[#00F0FF] text-black shadow-glow-cyan'
                : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'
            }`}
          >
            <Footprints className="w-4 h-4" />
            Running Intervals
          </button>
          <button
            onClick={() => setSport('gym')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              sport === 'gym'
                ? 'bg-[#FF2D55] text-white shadow-glow-crimson'
                : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            Gym & Strength
          </button>
          <button
            onClick={() => setSport('swimming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              sport === 'swimming'
                ? 'bg-[#00E676] text-black shadow-glow-emerald'
                : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'
            }`}
          >
            <Waves className="w-4 h-4" />
            Pool Swimming
          </button>
        </div>

        {/* Quick Templates */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Templates:
          </span>
          <button
            onClick={() => loadTemplate('5k_run')}
            className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-[#00F0FF] transition-all"
          >
            5K Track Repeats
          </button>
          <button
            onClick={() => loadTemplate('push_gym')}
            className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-[#FF2D55] transition-all"
          >
            Push Strength
          </button>
          <button
            onClick={() => loadTemplate('swim_endurance')}
            className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-[#00E676] transition-all"
          >
            1500m Swim Ladder
          </button>
        </div>

        {/* Workout Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-dark-card p-4 rounded-2xl border border-dark-border">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Workout Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Est. Duration (mins)</label>
            <input
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(parseInt(e.target.value, 10) || 30)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
            />
          </div>
        </div>

        {/* Dynamic Interval / Exercise Table */}
        {sport === 'running' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider">Interval Steps ({runSteps.length})</h3>
              <button
                onClick={() =>
                  setRunSteps([
                    ...runSteps,
                    { id: `${Date.now()}`, name: 'Interval', type: 'active', distanceMeters: 1000, targetPaceSecPerKm: 270 },
                  ])
                }
                className="flex items-center gap-1 text-xs text-[#00F0FF] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            <div className="space-y-2">
              {runSteps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-card border border-dark-border text-xs">
                  <span className="w-6 text-center font-bold font-mono text-slate-500">#{idx + 1}</span>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => {
                      const updated = [...runSteps];
                      updated[idx].name = e.target.value;
                      setRunSteps(updated);
                    }}
                    className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <select
                    value={step.type}
                    onChange={(e) => {
                      const updated = [...runSteps];
                      updated[idx].type = e.target.value as any;
                      setRunSteps(updated);
                    }}
                    className="bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-slate-300"
                  >
                    <option value="warmup">Warmup</option>
                    <option value="active">Active Interval</option>
                    <option value="recovery">Recovery</option>
                    <option value="cooldown">Cooldown</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Dist (m)"
                    value={step.distanceMeters || ''}
                    onChange={(e) => {
                      const updated = [...runSteps];
                      updated[idx].distanceMeters = parseInt(e.target.value, 10) || undefined;
                      setRunSteps(updated);
                    }}
                    className="w-24 bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                  <button
                    onClick={() => setRunSteps(runSteps.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-500 hover:text-[#FF2D55]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sport === 'gym' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#FF2D55] uppercase tracking-wider">Exercises & Sets</h3>
              <button
                onClick={() =>
                  setGymExercises([
                    ...gymExercises,
                    { id: `${Date.now()}`, name: 'Dumbbell Curls', muscleGroup: 'Arms', sets: 3, reps: 12, weightKg: 14, restSeconds: 60 },
                  ])
                }
                className="flex items-center gap-1 text-xs text-[#FF2D55] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exercise
              </button>
            </div>

            <div className="space-y-2">
              {gymExercises.map((ex, idx) => (
                <div key={ex.id} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-dark-card border border-dark-border text-xs">
                  <span className="w-6 text-center font-bold font-mono text-slate-500">#{idx + 1}</span>
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => {
                      const updated = [...gymExercises];
                      updated[idx].name = e.target.value;
                      setGymExercises(updated);
                    }}
                    className="flex-1 min-w-[140px] bg-dark-bg border border-dark-border rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <span className="text-slate-500 font-mono">Sets:</span>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => {
                      const updated = [...gymExercises];
                      updated[idx].sets = parseInt(e.target.value, 10) || 1;
                      setGymExercises(updated);
                    }}
                    className="w-14 bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                  <span className="text-slate-500 font-mono">Reps:</span>
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) => {
                      const updated = [...gymExercises];
                      updated[idx].reps = parseInt(e.target.value, 10) || 1;
                      setGymExercises(updated);
                    }}
                    className="w-14 bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                  <span className="text-slate-500 font-mono">Kg:</span>
                  <input
                    type="number"
                    value={ex.weightKg}
                    onChange={(e) => {
                      const updated = [...gymExercises];
                      updated[idx].weightKg = parseFloat(e.target.value) || 0;
                      setGymExercises(updated);
                    }}
                    className="w-16 bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                  <button
                    onClick={() => setGymExercises(gymExercises.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-500 hover:text-[#FF2D55]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sport === 'swimming' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#00E676] uppercase tracking-wider">Swim Sets</h3>
              <button
                onClick={() =>
                  setSwimSteps([
                    ...swimSteps,
                    { id: `${Date.now()}`, name: 'Main Set', distanceMeters: 200, stroke: 'Freestyle', restSeconds: 20 },
                  ])
                }
                className="flex items-center gap-1 text-xs text-[#00E676] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Swim Set
              </button>
            </div>

            <div className="space-y-2">
              {swimSteps.map((sw, idx) => (
                <div key={sw.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-card border border-dark-border text-xs">
                  <span className="w-6 text-center font-bold font-mono text-slate-500">#{idx + 1}</span>
                  <input
                    type="text"
                    value={sw.name}
                    onChange={(e) => {
                      const updated = [...swimSteps];
                      updated[idx].name = e.target.value;
                      setSwimSteps(updated);
                    }}
                    className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <select
                    value={sw.stroke}
                    onChange={(e) => {
                      const updated = [...swimSteps];
                      updated[idx].stroke = e.target.value as any;
                      setSwimSteps(updated);
                    }}
                    className="bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-slate-300"
                  >
                    <option value="Freestyle">Freestyle</option>
                    <option value="Breaststroke">Breaststroke</option>
                    <option value="Backstroke">Backstroke</option>
                    <option value="Butterfly">Butterfly</option>
                    <option value="Medley">Medley</option>
                    <option value="Drill">Drill</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Meters"
                    value={sw.distanceMeters}
                    onChange={(e) => {
                      const updated = [...swimSteps];
                      updated[idx].distanceMeters = parseInt(e.target.value, 10) || 50;
                      setSwimSteps(updated);
                    }}
                    className="w-24 bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                  <button
                    onClick={() => setSwimSteps(swimSteps.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-500 hover:text-[#FF2D55]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync to Watch Actions */}
        <div className="pt-4 border-t border-dark-border flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowGarminHelp(!showGarminHelp)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <HelpCircle className="w-4 h-4 text-[#00F0FF]" />
            How to put this workout on your Garmin watch?
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-slate-300 hover:text-white"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>

            <button
              onClick={handleDownloadFit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#00F0FF]/90 transition-all shadow-glow-cyan"
            >
              <Watch className="w-4 h-4" />
              Download Garmin .FIT Workout
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        {showGarminHelp && (
          <div className="p-4 rounded-2xl bg-dark-card border border-[#00F0FF]/40 space-y-2 text-xs text-slate-300 animate-fadeIn font-mono">
            <h4 className="font-bold text-[#00F0FF] font-sans flex items-center gap-1.5">
              <Check className="w-4 h-4" /> How to sync workout to your Garmin Watch:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
              <li>Click <strong>Download Garmin .FIT Workout</strong> above.</li>
              <li>Plug your Garmin watch into your PC with its charging cable.</li>
              <li>Open your watch drive and paste the file into: <code className="text-[#00F0FF]">GARMIN / WORKOUTS</code> (or <code className="text-[#00F0FF]">GARMIN / NEWFILES</code>).</li>
              <li>Unplug watch. On your wrist: Press <strong>Start &rarr; Run/Gym/Swim &rarr; Options &rarr; Training &rarr; Workouts</strong>.</li>
              <li>Your watch will alert and vibrate through every interval and rest target!</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
