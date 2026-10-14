# Garmin Fitness Tracker PWA - System Specification

## Problem Statement

Athletes and fitness enthusiasts who use Garmin smartwatches want a dedicated, private, and customizable dashboard to track workouts, analyze heart rate zones, view GPS routes, and monitor personal records. Existing commercial platforms (like Strava or TrainingPeaks) lock advanced analytics behind paid subscription tiers, require complex backend servers, and risk vendor lock-in. Furthermore, deploying custom apps typically incurs recurring cloud hosting costs. The user needs a modern, 100% free-to-use, responsive fitness tracking application that works seamlessly on PC and mobile devices, can be hosted completely free on GitHub Pages, and easily connects with Garmin watch data.

## Solution

A high-performance Progressive Web Application (PWA) built with React 18, TypeScript, Tailwind CSS, and Lucide icons, styled in a "Modern Dark Athletic" aesthetic inspired by Garmin Connect and Strava. The application runs 100% client-side with no recurring server costs and stores all data securely in the user's local browser storage (IndexedDB). It provides a hybrid Garmin data integration pipeline:
1. **Instant Client-Side Import**: Direct drag-and-drop or file picker for Garmin `.FIT`, `.GPX`, and `.TCX` files with real-time browser-based decoding.
2. **Automated GitHub Actions Sync**: A plug-and-play GitHub Actions workflow with an open-source Python script that periodically fetches new activities from Garmin Connect and commits them to the repository for automatic deployment.
3. **Multi-device UX**: Responsive layouts tailored for desktop multi-panel widescreen analytics and mobile touch-friendly bottom navigation, with PWA installability on desktop and mobile home screens.
4. **Rich Analytics Suite**: Interactive Leaflet GPS mapping, pace/speed/elevation/heart-rate elevation profiles, HR zone distribution histograms, split lap comparisons, and personal records tracking.

## User Stories

1. As a runner/cyclist, I want to drag and drop a `.FIT` file directly from my Garmin watch or Garmin Connect into the browser, so that my activity is parsed immediately with zero latency and zero privacy exposure.
2. As an athlete, I want to upload `.GPX` and `.TCX` activity files, so that I have broad compatibility with all Garmin export formats.
3. As a mobile user, I want an installable PWA with an app icon on my phone's home screen, so that I can launch and review my workouts like a native mobile app.
4. As a desktop user, I want a wide-screen dashboard layout with high-density metrics, so that I can see the interactive map, heart rate charts, and split tables side by side.
5. As a runner, I want an interactive GPS route map with full zoom, pan, terrain/satellite toggles, and hover-synchronized elevation/pace tracking, so that I can inspect specific segments of my route.
6. As an athlete training by heart rate, I want my time in zones (Zone 1 to Zone 5) visualized as a colored histogram, so that I know whether my workout targeted endurance, tempo, threshold, or anaerobic capacity.
7. As a data-conscious user, I want all my workout data stored persistently in IndexedDB on my device, so that my history survives browser refreshes and functions completely offline.
8. As a user with multiple devices, I want an export/import feature to download all my workouts as a single JSON backup, so that I can transfer my history between my PC and mobile phone.
9. As a user seeking zero-maintenance tracking, I want an automated GitHub Action template that syncs daily Garmin Connect workouts to my GitHub Pages repository without manual file exporting.
10. As a runner, I want a split-by-kilometer/mile breakdown showing pace, average heart rate, and elevation change for each lap, so that I can analyze pacing consistency and negative splits.
11. As a fitness enthusiast, I want a summary stats dashboard (weekly mileage, total active hours, calories burned, average pace, activity counts), so that I can monitor my weekly and monthly training load.
12. As a first-time user, I want preloaded sample activities (e.g. 10k tempo run and scenic gravel ride), so that I can immediately explore all charts, maps, and features before uploading my own data.
13. As a user on GitHub Pages, I want automated CI/CD deployment via GitHub Actions, so that any new release or synced activity automatically publishes to my live URL.

## Implementation Decisions

### 1. Architectural Stack
- **Frontend Framework**: React 18 + Vite + TypeScript. Fast HMR, minimal bundle size, and tree-shaking.
- **Styling**: Tailwind CSS configured with a dark athletic palette (`#0B0E14` deep background, `#121824` card background, `#00F0FF` cyan accents, `#FF3366` heart-rate crimson, `#00E676` pace green, `#FFB300` cadence amber).
- **Icons**: `lucide-react` for crisp athletic symbols (Activity, Heart, Flame, MapPin, Gauge, Award, Upload, etc.).
- **Interactive Maps**: Leaflet + `leaflet/dist/leaflet.css` with OpenStreetMap CartoDB Dark Matter / Positron tiles for an ultra-sleek athletic look.
- **Charts & Graphs**: SVG-based responsive charting for multi-metric streams (Elevation profile, Heart Rate curve, Pace/Speed, Cadence) with synchronized crosshair cursor.
- **PWA Capabilities**: Web App Manifest (`manifest.webmanifest`), theme-color metadata, and offline caching service worker.

### 2. File Ingestion & Parsing Engine
- **Garmin `.FIT` Parser**: Client-side decoding using `fit-file-parser`, reading binary ArrayBuffers directly in the browser and extracting `record` (timestamp, lat, long, heart_rate, speed, cadence, altitude) and `session` (total_distance, total_timer_time, avg_heart_rate, max_heart_rate, total_calories).
- **Garmin `.GPX` / `.TCX` Parser**: Native browser `DOMParser` parsing XML track points `<trkpt lat="..." lon="...">`, `<ele>`, `<time>`, and Garmin TrackPointExtension `<gpxtpx:hr>`.
- **Coordinate Conversion**: Conversion from Garmin semicircles (`degrees = semicircles * (180 / 2^31)`) to standard WGS84 decimal coordinates.

### 3. State & Storage Architecture
- **IndexedDB**: Persistent local database storing the full activity collection, user profile settings (Max HR, resting HR, unit preferences km/miles), and personal records.
- **Backup & Restore**: Single-click JSON export/import of the IndexedDB database.

### 4. Garmin Cloud Sync Architecture (GitHub Actions)
- A standalone Python script `scripts/sync_garmin.py` utilizing `garminconnect`.
- A GitHub Actions workflow `.github/workflows/garmin-sync.yml` running on a cron schedule, logging in with GitHub Repository Secrets (`GARMIN_EMAIL`, `GARMIN_PASSWORD`), saving recent activity JSON payloads into `public/data/activities.json`, and committing to the repo.

### 5. Deployment Pipeline
- `.github/workflows/deploy.yml` compiles the Vite app and deploys the static `dist/` directory to GitHub Pages with relative base path support (`./`).

## Testing & Verification Decisions
- Unit testing for FIT coordinate conversion, pace calculation (m/s to min/km and min/mile), and HR zone computation.
- Functional testing of file upload (FIT, GPX, TCX, JSON).
- Responsive UI verification for mobile screens (375px - 430px) and PC widescreen (1920px).
- Offline capability test via Service Worker / PWA audit.
