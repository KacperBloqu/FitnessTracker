#!/usr/bin/env python3
"""
Interactive Local Garmin Connect Sync Tool
Run this on your PC to authenticate with Garmin (supports MFA/2FA),
download your real workouts, and publish them to your GitHub Pages site.
"""

import os
import sys
import json
import getpass
import subprocess
from datetime import datetime

try:
    from garminconnect import (
        Garmin,
        GarminConnectConnectionError,
        GarminConnectTooManyRequestsError,
        GarminConnectAuthenticationError,
    )
except ImportError:
    print("Installing garminconnect...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "garminconnect"])
    from garminconnect import Garmin

TOKEN_DIR = os.path.expanduser("~/.garminconnect_tokens")

def main():
    print("=" * 60)
    print("🏃 GarminTrack - Garmin Connect Sync & Diagnostics Tool")
    print("=" * 60)
    print()

    email = os.environ.get("GARMIN_EMAIL")
    if not email:
        email = input("Enter your Garmin Connect Email: ").strip()

    password = os.environ.get("GARMIN_PASSWORD")
    if not password:
        password = getpass.getpass("Enter your Garmin Connect Password: ").strip()

    if not email or not password:
        print("❌ Error: Both email and password are required.")
        sys.exit(1)

    print()
    print(f"Connecting to Garmin Connect as {email}...")

    try:
        os.makedirs(TOKEN_DIR, exist_ok=True)
        client = Garmin(email, password)
        # Login with token persistence; prompts for MFA if enabled on account
        client.login(TOKEN_DIR)
        print("✅ Successfully authenticated with Garmin Connect!")

    except GarminConnectAuthenticationError as err:
        print()
        print("❌ Authentication Failed:")
        print(f"   {err}")
        print()
        print("Possible causes:")
        print("  1. Incorrect email or password (double-check typos).")
        print("  2. If Garmin sent a 2FA code to your email/phone, you must enter it when prompted.")
        print("  3. Account temporarily locked due to too many attempts (check connect.garmin.com in browser).")
        sys.exit(1)

    except GarminConnectTooManyRequestsError:
        print()
        print("❌ Garmin rate limit reached (HTTP 429).")
        print("   Garmin is temporarily blocking requests from this IP. Please wait 10-15 minutes and try again.")
        sys.exit(1)

    except Exception as err:
        print()
        print(f"❌ Connection Error: {err}")
        sys.exit(1)

    print("Fetching your recent activities from Garmin Connect...")
    try:
        activities_raw = client.get_activities(0, 50)
        print(f"✅ Found {len(activities_raw)} activities!")
    except Exception as err:
        print(f"❌ Error downloading activity list: {err}")
        sys.exit(1)

    formatted_activities = []
    for act in activities_raw:
        activity_id = str(act.get("activityId"))
        sport_type = act.get("activityType", {}).get("typeKey", "running").lower()
        if "cycl" in sport_type or "bike" in sport_type:
            sport = "cycling"
        elif "walk" in sport_type:
            sport = "walking"
        elif "swim" in sport_type:
            sport = "swimming"
        elif "hike" in sport_type:
            sport = "hiking"
        elif "fitness" in sport_type or "train" in sport_type:
            sport = "workout"
        else:
            sport = "running"

        duration = act.get("duration", 0)
        distance = act.get("distance", 0)
        start_time = act.get("startTimeLocal", datetime.now().isoformat())

        formatted_activities.append({
            "id": f"garmin-{activity_id}",
            "title": act.get("activityName", f"Garmin {sport.capitalize()}"),
            "sport": sport,
            "startTime": start_time,
            "durationSeconds": int(duration),
            "distanceMeters": int(distance),
            "calories": int(act.get("calories", 0)),
            "avgHeartRate": act.get("averageHR"),
            "maxHeartRate": act.get("maxHR"),
            "avgSpeedMps": act.get("averageSpeed", 0),
            "maxSpeedMps": act.get("maxSpeed", 0),
            "avgCadence": act.get("averageRunningCadenceInStepsPerMinute") or act.get("averageBikingCadenceInRevPerMinute"),
            "elevationGainMeters": int(act.get("elevationGain", 0)),
            "elevationLossMeters": int(act.get("elevationLoss", 0)),
            "device": act.get("deviceName", "Garmin Watch"),
            "trackPoints": [],
            "laps": [],
            "hrZones": {
                "z1Sec": 0,
                "z2Sec": 0,
                "z3Sec": 0,
                "z4Sec": 0,
                "z5Sec": 0
            }
        })

    os.makedirs("public/data", exist_ok=True)
    output_path = os.path.join("public", "data", "activities.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(formatted_activities, f, indent=2)

    print(f"✅ Successfully wrote {len(formatted_activities)} activities to {output_path}")

    # Commit and push to GitHub Pages
    print()
    push_choice = input("Do you want to push these activities to GitHub Pages now? (Y/n): ").strip().lower()
    if push_choice in ("", "y", "yes"):
        print("Committing and pushing to origin main...")
        subprocess.run(["git", "add", "public/data/activities.json"], check=False)
        subprocess.run(["git", "commit", "-m", f"sync: updated {len(formatted_activities)} Garmin activities"], check=False)
        subprocess.run(["git", "push", "origin", "main"], check=False)
        print()
        print("🎉 Published to GitHub Pages! Refresh your live app in 1 minute:")
        print("👉 https://kacperbloqu.github.io/FitnessTracker/")
    else:
        print("Skipped git push. File is saved locally in public/data/activities.json.")

if __name__ == "__main__":
    main()
