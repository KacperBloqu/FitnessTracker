import { Activity, UserProfile } from '../types/activity';
import { getInitialSampleActivities } from './sampleData';

const DB_NAME = 'GarminFitnessDB';
const DB_VERSION = 1;
const STORE_ACTIVITIES = 'activities';
const STORE_SETTINGS = 'settings';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete',
  maxHeartRate: 190,
  restingHeartRate: 54,
  unitPreference: 'metric',
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this browser.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
        db.createObjectStore(STORE_ACTIVITIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllActivities(): Promise<Activity[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_ACTIVITIES], 'readonly');
      const store = transaction.objectStore(STORE_ACTIVITIES);
      const request = store.getAll();

      request.onsuccess = async () => {
        let activities: Activity[] = request.result || [];
        if (activities.length === 0) {
          // Initialize with sample activities
          const initial = getInitialSampleActivities();
          await saveActivities(initial);
          activities = initial;
        }

        // Sort descending by start time
        activities.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        resolve(activities);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Falling back to local storage for activities:', error);
    const local = localStorage.getItem('garmintrack_activities');
    if (local) {
      return JSON.parse(local);
    }
    const initial = getInitialSampleActivities();
    localStorage.setItem('garmintrack_activities', JSON.stringify(initial));
    return initial;
  }
}

export async function getActivityById(id: string): Promise<Activity | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_ACTIVITIES], 'readonly');
      const store = transaction.objectStore(STORE_ACTIVITIES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    const activities = await getAllActivities();
    return activities.find(a => a.id === id) || null;
  }
}

export async function saveActivity(activity: Activity): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_ACTIVITIES], 'readwrite');
      const store = transaction.objectStore(STORE_ACTIVITIES);
      const request = store.put(activity);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const activities = await getAllActivities();
    const existingIndex = activities.findIndex(a => a.id === activity.id);
    if (existingIndex >= 0) {
      activities[existingIndex] = activity;
    } else {
      activities.unshift(activity);
    }
    localStorage.setItem('garmintrack_activities', JSON.stringify(activities));
  }
}

export async function saveActivities(activities: Activity[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_ACTIVITIES], 'readwrite');
      const store = transaction.objectStore(STORE_ACTIVITIES);

      activities.forEach(activity => store.put(activity));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    localStorage.setItem('garmintrack_activities', JSON.stringify(activities));
  }
}

export async function deleteActivity(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_ACTIVITIES], 'readwrite');
      const store = transaction.objectStore(STORE_ACTIVITIES);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const activities = (await getAllActivities()).filter(a => a.id !== id);
    localStorage.setItem('garmintrack_activities', JSON.stringify(activities));
  }
}

export async function clearAllActivities(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_ACTIVITIES], 'readwrite');
      const store = transaction.objectStore(STORE_ACTIVITIES);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    localStorage.removeItem('garmintrack_activities');
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_SETTINGS], 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('profile');

      request.onsuccess = () => resolve(request.result || DEFAULT_PROFILE);
      request.onerror = () => resolve(DEFAULT_PROFILE);
    });
  } catch {
    const saved = localStorage.getItem('garmintrack_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.put(profile, 'profile');

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    localStorage.setItem('garmintrack_profile', JSON.stringify(profile));
  }
}

export async function exportAllDataAsJson(): Promise<string> {
  const activities = await getAllActivities();
  const profile = await getUserProfile();
  const exportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    activities,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export async function importAllDataFromJson(jsonStr: string): Promise<number> {
  const parsed = JSON.parse(jsonStr);
  const activitiesToImport: Activity[] = Array.isArray(parsed) ? parsed : (parsed.activities || []);

  if (!Array.isArray(activitiesToImport)) {
    throw new Error('Invalid JSON format: missing activities array.');
  }

  await saveActivities(activitiesToImport);

  if (parsed.profile) {
    await saveUserProfile(parsed.profile);
  }

  return activitiesToImport.length;
}

/**
 * Checks for GitHub Actions synced activity JSON in public/data/activities.json
 */
export async function syncFromGitHubRepoData(): Promise<number> {
  try {
    const response = await fetch('./data/activities.json');
    if (!response.ok) return 0;
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      await saveActivities(data);
      return data.length;
    }
    return 0;
  } catch {
    return 0;
  }
}
