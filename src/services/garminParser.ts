// @ts-ignore
import FitParserPackage from 'fit-file-parser';
import { Activity, ActivityLap, SportType, TrackPoint } from '../types/activity';
import { calculateHrZones, generateAutoLaps, semicirclesToDegrees } from '../utils/formatters';

const FitParser = (FitParserPackage as any).default || FitParserPackage;

export async function parseActivityFile(file: File): Promise<Activity> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'fit':
      return parseFitFile(file);
    case 'gpx':
      return parseGpxFile(file);
    case 'tcx':
      return parseTcxFile(file);
    case 'json':
      return parseJsonFile(file);
    default:
      throw new Error(`Unsupported file format: .${extension}. Please upload a Garmin .FIT, .GPX, .TCX, or .JSON file.`);
  }
}

/**
 * Parses Garmin binary .FIT file
 */
export async function parseFitFile(file: File): Promise<Activity> {
  const arrayBuffer = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: 'm/s',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list',
    });

    parser.parse(arrayBuffer, (error: any, data: any) => {
      if (error) {
        return reject(new Error(`Failed to parse Garmin FIT file: ${error.message || error}`));
      }

      try {
        const activity = convertFitDataToActivity(data, file.name);
        resolve(activity);
      } catch (err: any) {
        reject(new Error(`Error interpreting FIT data: ${err.message}`));
      }
    });
  });
}

function convertFitDataToActivity(fitData: any, fileName: string): Activity {
  const records = fitData.records || [];
  const sessions = fitData.sessions || [];
  const fitLaps = fitData.laps || [];

  const firstSession = sessions[0] || {};

  // Extract track points
  const trackPoints: TrackPoint[] = [];
  let minElev = Infinity;
  let maxElev = -Infinity;
  let elevGain = 0;
  let elevLoss = 0;
  let prevElev: number | undefined;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    let lat: number | undefined;
    let lon: number | undefined;

    if (r.position_lat !== undefined && r.position_long !== undefined) {
      lat = Math.abs(r.position_lat) > 180 ? semicirclesToDegrees(r.position_lat) : r.position_lat;
      lon = Math.abs(r.position_long) > 180 ? semicirclesToDegrees(r.position_long) : r.position_long;
    }

    const alt = r.altitude !== undefined ? Number(r.altitude) : undefined;
    if (alt !== undefined && isFinite(alt)) {
      if (alt < minElev) minElev = alt;
      if (alt > maxElev) maxElev = alt;

      if (prevElev !== undefined) {
        const diff = alt - prevElev;
        if (diff > 0.5) elevGain += diff;
        else if (diff < -0.5) elevLoss += Math.abs(diff);
      }
      prevElev = alt;
    }

    const timestamp = r.timestamp ? new Date(r.timestamp).getTime() : Date.now();

    if (lat !== undefined && lon !== undefined) {
      trackPoints.push({
        timestamp,
        lat,
        lon,
        altitude: alt,
        heartRate: r.heart_rate,
        speed: r.speed,
        cadence: r.cadence,
        distance: r.distance,
      });
    }
  }

  // Determine sport
  let sport: SportType = 'running';
  const rawSport = (firstSession.sport || '').toLowerCase();
  if (rawSport.includes('cycling') || rawSport.includes('bike') || rawSport.includes('biking')) {
    sport = 'cycling';
  } else if (rawSport.includes('walk')) {
    sport = 'walking';
  } else if (rawSport.includes('swim')) {
    sport = 'swimming';
  } else if (rawSport.includes('hike')) {
    sport = 'hiking';
  } else if (rawSport.includes('fitness') || rawSport.includes('training')) {
    sport = 'workout';
  }

  // Calculate metrics
  const totalDuration = firstSession.total_timer_time || firstSession.total_elapsed_time || 
    (trackPoints.length > 1 ? (trackPoints[trackPoints.length - 1].timestamp - trackPoints[0].timestamp) / 1000 : 0);

  const totalDistance = firstSession.total_distance || 
    (trackPoints.length > 0 && trackPoints[trackPoints.length - 1].distance ? trackPoints[trackPoints.length - 1].distance! : 0);

  const avgSpeed = firstSession.avg_speed || (totalDistance && totalDuration ? totalDistance / totalDuration : 0);
  const maxSpeed = firstSession.max_speed || 0;
  const calories = firstSession.total_calories || Math.round((totalDuration / 60) * 11);

  // Extract laps
  let laps: ActivityLap[] = [];
  if (fitLaps.length > 0) {
    laps = fitLaps.map((l: any, index: number) => {
      const dur = l.total_timer_time || l.total_elapsed_time || 1;
      const dist = l.total_distance || 0;
      const paceSec = dist > 0 ? (dur / dist) * 1000 : 0;
      return {
        lapIndex: index + 1,
        startTime: l.start_time ? new Date(l.start_time).toISOString() : new Date().toISOString(),
        durationSeconds: Math.round(dur),
        distanceMeters: Math.round(dist),
        avgPaceSecPerKm: Math.round(paceSec),
        avgHeartRate: l.avg_heart_rate,
        maxHeartRate: l.max_heart_rate,
      };
    });
  } else if (trackPoints.length > 0) {
    laps = generateAutoLaps(trackPoints, 1000);
  }

  const startTime = firstSession.start_time ? new Date(firstSession.start_time).toISOString() : 
    (trackPoints.length > 0 ? new Date(trackPoints[0].timestamp).toISOString() : new Date().toISOString());

  const hrZones = calculateHrZones(trackPoints);

  const device = firstSession.creator || firstSession.manufacturer || 'Garmin Watch';

  return {
    id: `fit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Workout`,
    sport,
    startTime,
    durationSeconds: Math.round(totalDuration),
    distanceMeters: Math.round(totalDistance),
    calories: Math.round(calories),
    avgHeartRate: firstSession.avg_heart_rate || undefined,
    maxHeartRate: firstSession.max_heart_rate || undefined,
    avgSpeedMps: avgSpeed,
    maxSpeedMps: maxSpeed,
    avgCadence: firstSession.avg_cadence || undefined,
    elevationGainMeters: Math.round(firstSession.total_ascent || elevGain),
    elevationLossMeters: Math.round(firstSession.total_descent || elevLoss),
    device,
    trackPoints,
    laps,
    hrZones,
    sourceFile: fileName,
  };
}

/**
 * Parses Garmin .GPX file (XML)
 */
export async function parseGpxFile(file: File): Promise<Activity> {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');

  const trkpts = xml.getElementsByTagName('trkpt');
  const trackPoints: TrackPoint[] = [];

  let elevGain = 0;
  let elevLoss = 0;
  let prevElev: number | undefined;
  let totalDistance = 0;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');

    const eleElem = pt.getElementsByTagName('ele')[0];
    const ele = eleElem ? parseFloat(eleElem.textContent || '0') : undefined;

    const timeElem = pt.getElementsByTagName('time')[0];
    const timestamp = timeElem && timeElem.textContent ? new Date(timeElem.textContent).getTime() : Date.now();

    // Garmin TrackPointExtension for Heart Rate and Cadence
    let hr: number | undefined;
    let cad: number | undefined;

    const hrElem = pt.getElementsByTagName('gpxtpx:hr')[0] || pt.getElementsByTagName('hr')[0];
    if (hrElem && hrElem.textContent) hr = parseInt(hrElem.textContent, 10);

    const cadElem = pt.getElementsByTagName('gpxtpx:cad')[0] || pt.getElementsByTagName('cad')[0];
    if (cadElem && cadElem.textContent) cad = parseInt(cadElem.textContent, 10);

    if (ele !== undefined && isFinite(ele)) {
      if (prevElev !== undefined) {
        const diff = ele - prevElev;
        if (diff > 0.5) elevGain += diff;
        else if (diff < -0.5) elevLoss += Math.abs(diff);
      }
      prevElev = ele;
    }

    if (trackPoints.length > 0) {
      const prev = trackPoints[trackPoints.length - 1];
      const dist = calculateDistance(prev.lat, prev.lon, lat, lon);
      totalDistance += dist;
    }

    trackPoints.push({
      timestamp,
      lat,
      lon,
      altitude: ele,
      heartRate: hr,
      cadence: cad,
      distance: totalDistance,
    });
  }

  const durationSeconds = trackPoints.length > 1 ? (trackPoints[trackPoints.length - 1].timestamp - trackPoints[0].timestamp) / 1000 : 0;
  const avgSpeed = durationSeconds > 0 ? totalDistance / durationSeconds : 0;

  const hrValues = trackPoints.map(p => p.heartRate).filter((hr): hr is number => hr !== undefined && hr > 0);
  const avgHr = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : undefined;
  const maxHr = hrValues.length ? Math.max(...hrValues) : undefined;

  const laps = generateAutoLaps(trackPoints, 1000);
  const hrZones = calculateHrZones(trackPoints);

  const titleElem = xml.getElementsByTagName('name')[0];
  const title = titleElem && titleElem.textContent ? titleElem.textContent : 'Garmin GPX Activity';

  return {
    id: `gpx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    sport: 'running',
    startTime: trackPoints.length > 0 ? new Date(trackPoints[0].timestamp).toISOString() : new Date().toISOString(),
    durationSeconds: Math.round(durationSeconds),
    distanceMeters: Math.round(totalDistance),
    calories: Math.round((durationSeconds / 60) * 10),
    avgHeartRate: avgHr,
    maxHeartRate: maxHr,
    avgSpeedMps: avgSpeed,
    maxSpeedMps: avgSpeed * 1.4,
    elevationGainMeters: Math.round(elevGain),
    elevationLossMeters: Math.round(elevLoss),
    device: 'Garmin GPX Device',
    trackPoints,
    laps,
    hrZones,
    sourceFile: file.name,
  };
}

/**
 * Parses Garmin .TCX file (XML)
 */
export async function parseTcxFile(file: File): Promise<Activity> {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');

  const trackpoints = xml.getElementsByTagName('Trackpoint');
  const trackPoints: TrackPoint[] = [];

  let totalDistance = 0;
  let elevGain = 0;
  let elevLoss = 0;
  let prevElev: number | undefined;

  for (let i = 0; i < trackpoints.length; i++) {
    const tp = trackpoints[i];
    const pos = tp.getElementsByTagName('Position')[0];
    if (!pos) continue;

    const latElem = pos.getElementsByTagName('LatitudeDegrees')[0];
    const lonElem = pos.getElementsByTagName('LongitudeDegrees')[0];
    if (!latElem || !lonElem) continue;

    const lat = parseFloat(latElem.textContent || '0');
    const lon = parseFloat(lonElem.textContent || '0');

    const timeElem = tp.getElementsByTagName('Time')[0];
    const timestamp = timeElem && timeElem.textContent ? new Date(timeElem.textContent).getTime() : Date.now();

    const altElem = tp.getElementsByTagName('AltitudeMeters')[0];
    const alt = altElem ? parseFloat(altElem.textContent || '0') : undefined;

    const distElem = tp.getElementsByTagName('DistanceMeters')[0];
    if (distElem && distElem.textContent) {
      totalDistance = parseFloat(distElem.textContent);
    }

    const hrElem = tp.getElementsByTagName('HeartRateBpm')[0]?.getElementsByTagName('Value')[0];
    const hr = hrElem && hrElem.textContent ? parseInt(hrElem.textContent, 10) : undefined;

    const cadElem = tp.getElementsByTagName('Cadence')[0];
    const cad = cadElem && cadElem.textContent ? parseInt(cadElem.textContent, 10) : undefined;

    if (alt !== undefined && isFinite(alt)) {
      if (prevElev !== undefined) {
        const diff = alt - prevElev;
        if (diff > 0.5) elevGain += diff;
        else if (diff < -0.5) elevLoss += Math.abs(diff);
      }
      prevElev = alt;
    }

    trackPoints.push({
      timestamp,
      lat,
      lon,
      altitude: alt,
      heartRate: hr,
      cadence: cad,
      distance: totalDistance,
    });
  }

  const durationSeconds = trackPoints.length > 1 ? (trackPoints[trackPoints.length - 1].timestamp - trackPoints[0].timestamp) / 1000 : 0;
  const avgSpeed = durationSeconds > 0 ? totalDistance / durationSeconds : 0;

  const hrValues = trackPoints.map(p => p.heartRate).filter((hr): hr is number => hr !== undefined && hr > 0);
  const avgHr = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : undefined;
  const maxHr = hrValues.length ? Math.max(...hrValues) : undefined;

  const laps = generateAutoLaps(trackPoints, 1000);
  const hrZones = calculateHrZones(trackPoints);

  const sportAttr = xml.getElementsByTagName('Activity')[0]?.getAttribute('Sport')?.toLowerCase() || 'running';
  const sport: SportType = sportAttr.includes('biking') ? 'cycling' : 'running';

  return {
    id: `tcx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: `Garmin ${sport.charAt(0).toUpperCase() + sport.slice(1)}`,
    sport,
    startTime: trackPoints.length > 0 ? new Date(trackPoints[0].timestamp).toISOString() : new Date().toISOString(),
    durationSeconds: Math.round(durationSeconds),
    distanceMeters: Math.round(totalDistance),
    calories: Math.round((durationSeconds / 60) * 11),
    avgHeartRate: avgHr,
    maxHeartRate: maxHr,
    avgSpeedMps: avgSpeed,
    maxSpeedMps: avgSpeed * 1.3,
    elevationGainMeters: Math.round(elevGain),
    elevationLossMeters: Math.round(elevLoss),
    device: 'Garmin TCX Watch',
    trackPoints,
    laps,
    hrZones,
    sourceFile: file.name,
  };
}

/**
 * Parses JSON backup or sync file
 */
export async function parseJsonFile(file: File): Promise<Activity> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed)) {
    throw new Error('This JSON file contains multiple activities. Please use the "Import All Activities" button in Settings.');
  }

  if (!parsed.id || !parsed.startTime) {
    throw new Error('Invalid activity JSON format.');
  }

  return parsed as Activity;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
