# GarminTrack 🏃⚡ | 100% Free Garmin Fitness Analytics PWA

> A modern, private, client-side fitness tracking and analytics application tailored for athletes using Garmin watches. Responsive on desktop and mobile, installable as a Progressive Web App (PWA), and designed to be hosted **100% free forever on GitHub Pages**.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Host: GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen.svg)
![Cost: 100% Free](https://img.shields.io/badge/Cost-Free%20Forever-00F0FF.svg)
![PWA: Installable](https://img.shields.io/badge/PWA-Installable-purple.svg)

---

## ⚡ Highlights & Features

- **100% Free & Private**: No recurring subscription fees (Strava / TrainingPeaks alternatives), zero server maintenance costs, and 100% client-side data privacy (all workouts stored locally in IndexedDB).
- **Direct Garmin File Ingestion**:
  - Drag-and-drop Garmin **`.FIT`** files directly from your watch (via USB: `GARMIN/ACTIVITY/`) or downloaded from Garmin Connect.
  - Full support for **`.GPX`**, **`.TCX`**, and **`.JSON`** exports.
  - Pure in-browser binary decoding with automatic coordinate conversions and sensor extraction.
- **Automated Cloud Sync (GitHub Actions)**:
  - Plug-and-play automated Python sync script (`scripts/sync_garmin.py`) running on a free daily GitHub Action cron schedule (`.github/workflows/garmin-sync.yml`).
  - Automatically fetches recent Garmin Connect activities into your repo without opening a single file!
- **Interactive Route Map**:
  - High-performance Leaflet map using CartoDB Dark Matter tiles (no API keys required).
  - Glowing route polyline, start/finish badges, and synchronized hover waypoint cursor.
- **Sensor Stream Charts**:
  - Responsive SVG stream visualizations: Elevation profile, Heart Rate curves, Pace / Speed gradients.
  - Hover synchronization between the graph and GPS map location.
  - 5-Zone Heart Rate histogram (Z1 Warmup to Z5 VO2 Max) calculated from your athlete profile.
- **Laps & Splits Breakdown**:
  - Auto-calculated 1 km / 1 mi splits with lap durations, paces, fastest split badges, and heart rate metrics.
- **Cross-Platform Responsive UX**:
  - Desktop widescreen multi-panel layout with comprehensive metrics.
  - Mobile bottom navigation bar and touch-friendly controls.
  - PWA installable on iPhone (iOS Safari), Android (Chrome), Windows, and macOS.

---

## 🚀 How to Deploy on GitHub Pages (Free Hosting)

Deploying takes under 2 minutes:

1. **Push this repository to GitHub**:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial commit of GarminTrack PWA"
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** &rarr; **Pages** (under Code and automation).
   - Under **Build and deployment &rarr; Source**, select **GitHub Actions**.

3. **Live App URL**:
   - The included `.github/workflows/deploy.yml` will automatically build the app and deploy it to:
     ```
     https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/
     ```

---

## 🔄 Optional: Enable Automated Daily Garmin Sync

To have GitHub automatically pull your Garmin watch workouts once a day:

1. In your GitHub repository, open **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
2. Click **New repository secret**:
   - Name: `GARMIN_EMAIL` &rarr; Value: *Your Garmin Connect email*
   - Name: `GARMIN_PASSWORD` &rarr; Value: *Your Garmin Connect password*
3. The `.github/workflows/garmin-sync.yml` workflow will automatically run daily at 04:00 UTC, fetch your newest workouts, commit them to `public/data/activities.json`, and publish them directly to your live website!

---

## 🛠 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production bundle
npm run build
```

---

## 📱 Installing on Mobile (PWA)

- **iPhone / iPad**: Open the live site in Safari, tap the **Share** button (box with arrow pointing up), and select **"Add to Home Screen"**.
- **Android**: Open the live site in Chrome, tap the menu (three dots), and select **"Install app"** or **"Add to Home screen"**.
- **Desktop (Chrome/Edge/Brave)**: Click the **"Install App"** button in the top navigation bar or the install icon in the URL bar.

---

## 📄 License

MIT &copy; 2026. Built with React, Vite, Tailwind CSS, Leaflet, and Matt Pocock AI Agent Skills.
