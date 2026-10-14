import { StructuredWorkout } from '../types/workoutPlan';

/**
 * Calculates standard Garmin CRC-16 (table lookup)
 */
function calculateCrc16(data: Uint8Array, start: number = 0, length?: number): number {
  const crcTable = [
    0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
    0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
  ];

  let crc = 0;
  const len = length !== undefined ? length : data.length - start;

  for (let i = start; i < start + len; i++) {
    const byte = data[i];
    // compute lower nibble
    let tmp = crcTable[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ tmp ^ crcTable[byte & 0xF];

    // compute upper nibble
    tmp = crcTable[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ tmp ^ crcTable[(byte >> 4) & 0xF];
  }

  return crc;
}

/**
 * Encodes a StructuredWorkout into a valid binary Garmin .FIT Workout file
 * ready to be dropped into the GARMIN/WORKOUTS/ folder on any Garmin watch!
 */
export function encodeWorkoutToFit(workout: StructuredWorkout): Uint8Array {
  const buffer: number[] = [];

  // Helper to push uint8, uint16, uint32, string
  const pushU8 = (val: number) => buffer.push(val & 0xFF);
  const pushU16 = (val: number) => {
    buffer.push(val & 0xFF);
    buffer.push((val >> 8) & 0xFF);
  };
  const pushU32 = (val: number) => {
    buffer.push(val & 0xFF);
    buffer.push((val >> 8) & 0xFF);
    buffer.push((val >> 16) & 0xFF);
    buffer.push((val >> 24) & 0xFF);
  };
  const pushString = (str: string, maxLen: number) => {
    const encoded = new TextEncoder().encode(str);
    for (let i = 0; i < maxLen; i++) {
      if (i < encoded.length) buffer.push(encoded[i]);
      else buffer.push(0x00);
    }
  };

  // 1. FILE_ID DEFINITION (Local Mesg 0, Global Mesg 0)
  pushU8(0x40); // Definition header, local msg 0
  pushU8(0x00); // Reserved
  pushU8(0x00); // Architecture: Little Endian
  pushU16(0);   // Global Mesg: file_id (0)
  pushU8(4);    // Number of fields
  // Field 0: type (enum, 1 byte)
  pushU8(0); pushU8(1); pushU8(0);
  // Field 1: manufacturer (uint16, 2 bytes)
  pushU8(1); pushU8(2); pushU8(132);
  // Field 2: product (uint16, 2 bytes)
  pushU8(2); pushU8(2); pushU8(132);
  // Field 4: time_created (uint32, 4 bytes)
  pushU8(4); pushU8(4); pushU8(134);

  // 1. FILE_ID DATA
  pushU8(0x00); // Data header, local msg 0
  pushU8(5);    // Type: 5 = workout file
  pushU16(1);   // Manufacturer: 1 = Garmin
  pushU16(1);   // Product: 1
  pushU32(Math.floor(Date.now() / 1000) - 631065600); // Garmin epoch (1989-12-31)

  // 2. WORKOUT DEFINITION (Local Mesg 1, Global Mesg 26)
  pushU8(0x41); // Definition header, local msg 1
  pushU8(0x00); // Reserved
  pushU8(0x00); // Little Endian
  pushU16(26);  // Global Mesg: workout (26)
  pushU8(3);    // Number of fields
  // Field 4: wkt_name (string, 16 bytes)
  pushU8(4); pushU8(16); pushU8(7);
  // Field 5: sport (sport enum, 1 byte)
  pushU8(5); pushU8(1); pushU8(0);
  // Field 6: num_valid_steps (uint16, 2 bytes)
  pushU8(6); pushU8(2); pushU8(132);

  // Determine sport enum: 1 = running, 2 = cycling, 5 = swimming, 10 = training/fitness
  let sportId = 1;
  if (workout.sport === 'swimming') sportId = 5;
  if (workout.sport === 'gym') sportId = 10;

  const stepsCount = workout.steps?.length || workout.gymExercises?.length || workout.swimSteps?.length || 1;

  // 2. WORKOUT DATA
  pushU8(0x01); // Data header, local msg 1
  pushString(workout.title.slice(0, 15), 16);
  pushU8(sportId);
  pushU16(stepsCount);

  // 3. WORKOUT_STEP DEFINITION (Local Mesg 2, Global Mesg 27)
  pushU8(0x42); // Definition header, local msg 2
  pushU8(0x00); // Reserved
  pushU8(0x00); // Little Endian
  pushU16(27);  // Global Mesg: workout_step (27)
  pushU8(5);    // Number of fields
  // Field 254: message_index (uint16, 2 bytes)
  pushU8(254); pushU8(2); pushU8(132);
  // Field 0: wkt_step_name (string, 16 bytes)
  pushU8(0); pushU8(16); pushU8(7);
  // Field 1: duration_type (enum, 1 byte)
  pushU8(1); pushU8(1); pushU8(0);
  // Field 2: duration_value (uint32, 4 bytes)
  pushU8(2); pushU8(4); pushU8(134);
  // Field 3: target_type (enum, 1 byte)
  pushU8(3); pushU8(1); pushU8(0);

  // 3. WORKOUT_STEP DATA (One message per step)
  let stepIndex = 0;

  if (workout.sport === 'running' && workout.steps) {
    for (const s of workout.steps) {
      pushU8(0x02); // Data header, local msg 2
      pushU16(stepIndex++);
      pushString(s.name.slice(0, 15), 16);
      
      if (s.distanceMeters) {
        pushU8(1); // duration_type: 1 = distance
        pushU32(s.distanceMeters * 100); // cm
      } else {
        pushU8(0); // duration_type: 0 = time
        pushU32((s.durationSeconds || 300) * 1000); // ms
      }
      pushU8(s.targetPaceSecPerKm ? 1 : 0); // target_type: 1 = speed, 0 = open
    }
  } else if (workout.sport === 'gym' && workout.gymExercises) {
    for (const ex of workout.gymExercises) {
      pushU8(0x02);
      pushU16(stepIndex++);
      pushString(`${ex.name}`.slice(0, 15), 16);
      pushU8(2); // duration_type: 2 = repetitions
      pushU32(ex.reps);
      pushU8(0); // open target
    }
  } else if (workout.sport === 'swimming' && workout.swimSteps) {
    for (const sw of workout.swimSteps) {
      pushU8(0x02);
      pushU16(stepIndex++);
      pushString(`${sw.stroke}`.slice(0, 15), 16);
      pushU8(1); // distance
      pushU32(sw.distanceMeters * 100);
      pushU8(0);
    }
  }

  // Construct final binary array with 14-byte FIT header + Data + 2-byte CRC
  const dataBytes = new Uint8Array(buffer);
  const dataSize = dataBytes.length;

  const header = new Uint8Array(14);
  header[0] = 14;     // Header size
  header[1] = 0x20;   // Protocol version: 2.0 (0x20)
  header[2] = 0x54;   // Profile version: 21.32 (0x0854 LE)
  header[3] = 0x08;
  header[4] = dataSize & 0xFF;         // Data size uint32 LE
  header[5] = (dataSize >> 8) & 0xFF;
  header[6] = (dataSize >> 16) & 0xFF;
  header[7] = (dataSize >> 24) & 0xFF;
  header[8] = 0x2E;   // '.'
  header[9] = 0x46;   // 'F'
  header[10] = 0x49;  // 'I'
  header[11] = 0x54;  // 'T'

  // Header CRC
  const headerCrc = calculateCrc16(header, 0, 12);
  header[12] = headerCrc & 0xFF;
  header[13] = (headerCrc >> 8) & 0xFF;

  // File CRC over data
  const fileCrc = calculateCrc16(dataBytes, 0, dataSize);

  // Combine header + data + file CRC
  const finalFit = new Uint8Array(14 + dataSize + 2);
  finalFit.set(header, 0);
  finalFit.set(dataBytes, 14);
  finalFit[14 + dataSize] = fileCrc & 0xFF;
  finalFit[14 + dataSize + 1] = (fileCrc >> 8) & 0xFF;

  return finalFit;
}

/**
 * Downloads the workout as a Garmin .FIT file
 */
export function downloadWorkoutFit(workout: StructuredWorkout): void {
  const fitBytes = encodeWorkoutToFit(workout);
  const blob = new Blob([fitBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = workout.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  a.download = `${cleanTitle}.fit`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Downloads the workout as JSON format
 */
export function downloadWorkoutJson(workout: StructuredWorkout): void {
  const jsonStr = JSON.stringify(workout, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = workout.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  a.download = `${cleanTitle}_workout.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
