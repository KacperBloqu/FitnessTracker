import { Activity, TrackPoint, ActivityLap } from '../types/activity';
import { calculateHrZones, generateAutoLaps } from '../utils/formatters';

// Generate realistic GPS track for a 10K coastal run
function generateRunPoints(): TrackPoint[] {
  const points: TrackPoint[] = [];
  const baseLat = 37.7749;
  const baseLon = -122.4194;
  const startTime = new Date(Date.now() - 24 * 3600 * 1000).getTime(); // yesterday morning
  let dist = 0;
  let elev = 15;

  for (let i = 0; i < 400; i++) {
    const t = startTime + i * 7500; // ~50 minutes total
    const progress = i / 400;
    
    // slight curve / route
    const lat = baseLat + Math.sin(progress * Math.PI * 2) * 0.02 + progress * 0.01;
    const lon = baseLon + Math.cos(progress * Math.PI * 2) * 0.02;
    
    dist += 25; // 25 meters per point = 10,000m
    
    // rolling hills
    elev = 15 + Math.sin(progress * 10) * 18 + Math.cos(progress * 4) * 8;
    
    // progressive heart rate with warmup & tempo surge
    let hr = 135;
    if (progress < 0.15) {
      hr = 135 + (progress / 0.15) * 20; // 135 -> 155 warmup
    } else if (progress < 0.75) {
      hr = 158 + Math.sin(progress * 30) * 8; // steady tempo 158-166
    } else {
      hr = 168 + ((progress - 0.75) / 0.25) * 12; // finish kick 168 -> 180
    }

    const speed = 3.3 + Math.sin(progress * 15) * 0.3; // ~4:50 - 5:10 min/km pace
    const cadence = 172 + Math.floor(Math.sin(progress * 20) * 4); // 170-176 spm

    points.push({
      timestamp: t,
      lat,
      lon,
      altitude: Math.round(elev * 10) / 10,
      heartRate: Math.round(hr),
      speed: Math.round(speed * 10) / 10,
      cadence,
      distance: dist,
    });
  }

  return points;
}

// Generate realistic GPS track for a 30K cycling gravel ride
function generateBikePoints(): TrackPoint[] {
  const points: TrackPoint[] = [];
  const baseLat = 37.8044;
  const baseLon = -122.2712;
  const startTime = new Date(Date.now() - 3 * 24 * 3600 * 1000).getTime(); // 3 days ago
  let dist = 0;
  let elev = 45;

  for (let i = 0; i < 500; i++) {
    const t = startTime + i * 8000; // ~66 minutes
    const progress = i / 500;

    const lat = baseLat + Math.sin(progress * Math.PI) * 0.05;
    const lon = baseLon + progress * 0.06;

    dist += 60; // 60 meters * 500 = 30,000m

    // mountain elevation climb and descent
    elev = 45 + Math.sin(progress * Math.PI) * 210;

    let hr = 130;
    if (elev > 150) {
      hr = 165 + Math.sin(progress * 40) * 7; // climbing high effort
    } else {
      hr = 142 + Math.cos(progress * 20) * 6; // flat/descent
    }

    const speed = elev > 150 ? 5.5 : 9.5; // climb vs downhill
    const cadence = 84 + Math.floor(Math.sin(progress * 15) * 6); // 80-90 rpm

    points.push({
      timestamp: t,
      lat,
      lon,
      altitude: Math.round(elev * 10) / 10,
      heartRate: Math.round(hr),
      speed: Math.round(speed * 10) / 10,
      cadence,
      distance: dist,
    });
  }

  return points;
}

export function getInitialSampleActivities(): Activity[] {
  const runPoints = generateRunPoints();
  const runDuration = (runPoints[runPoints.length - 1].timestamp - runPoints[0].timestamp) / 1000;
  const runDist = runPoints[runPoints.length - 1].distance || 10000;
  const runLaps: ActivityLap[] = generateAutoLaps(runPoints, 1000);
  const runHrZones = calculateHrZones(runPoints, 192);

  const bikePoints = generateBikePoints();
  const bikeDuration = (bikePoints[bikePoints.length - 1].timestamp - bikePoints[0].timestamp) / 1000;
  const bikeDist = bikePoints[bikePoints.length - 1].distance || 30000;
  const bikeLaps: ActivityLap[] = generateAutoLaps(bikePoints, 5000);
  const bikeHrZones = calculateHrZones(bikePoints, 192);

  return [
    {
      id: 'sample-run-10k',
      title: 'Morning 10k Coastal Tempo Run',
      sport: 'running',
      startTime: new Date(runPoints[0].timestamp).toISOString(),
      durationSeconds: Math.round(runDuration),
      distanceMeters: runDist,
      calories: 685,
      avgHeartRate: 161,
      maxHeartRate: 181,
      avgSpeedMps: runDist / runDuration,
      maxSpeedMps: 4.2,
      avgCadence: 174,
      elevationGainMeters: 142,
      elevationLossMeters: 138,
      device: 'Garmin Forerunner 965',
      trackPoints: runPoints,
      laps: runLaps,
      hrZones: runHrZones,
      isFavorite: true,
    },
    {
      id: 'sample-bike-30k',
      title: 'Headlands Sunset Gravel Ride',
      sport: 'cycling',
      startTime: new Date(bikePoints[0].timestamp).toISOString(),
      durationSeconds: Math.round(bikeDuration),
      distanceMeters: bikeDist,
      calories: 820,
      avgHeartRate: 148,
      maxHeartRate: 173,
      avgSpeedMps: bikeDist / bikeDuration,
      maxSpeedMps: 13.8,
      avgCadence: 86,
      elevationGainMeters: 385,
      elevationLossMeters: 380,
      device: 'Garmin Edge 840',
      trackPoints: bikePoints,
      laps: bikeLaps,
      hrZones: bikeHrZones,
      isFavorite: false,
    },
  ];
}
