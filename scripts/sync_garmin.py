#!/usr/bin/env python3
"""
Automated Garmin Connect Sync Script for GarminTrack PWA.
Fetches recent activities directly from Garmin Connect and outputs them
to public/data/activities.json for automatic static hosting on GitHub Pages.

Requires:
    pip install garminconnect
"""

import os
import sys
import json
from datetime import datetime, timedelta

try:
    from garminconnect import (
        Garmin,
        GarminConnectConnectionError,
        GarminConnectTooManyRequestsError,
        GarminConnectAuthenticationError,
    )
except ImportError:
    print("Please install garminconnect: pip install garminconnect")
    sys.exit(1)

def sync_garmin():
    email = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")

    if not email or not password:
        print("Error: GARMIN_EMAIL and GARMIN_PASSWORD environment variables are required.")
        sys.exit(1)

    print("Connecting to Garmin Connect...")
    try:
        client = Garmin(email, password)
        client.login()
        print("Logged in successfully to Garmin Connect!")
    except (GarminConnectConnectionError, GarminConnectAuthenticationError, GarminConnectTooManyRequestsError) as err:
        print(f"Error authenticating with Garmin: {err}")
        sys.exit(1)

    # Fetch last 30 activities
    print("Fetching recent activities...")
    activities_raw = client.get_activities(0, 30)
    print(f"Retrieved {len(activities_raw)} activities from Garmin.")

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
        else:
            sport = "running"

        duration = act.get("duration", 0)
        distance = act.get("distance", 0)
        start_time = act.get("startTimeLocal", datetime.now().isoformat())

        formatted_activities.append({
            "id": f"garmin-{activity_id}",
            "title": act.get("activityName", "Garmin Workout"),
            "sport": sport,
            "startTime": start_time,
            "durationSeconds": int(duration),
            "distanceMeters": int(distance),
            "calories": int(act.get("calories", 0)),
            "avgHeartRate": act.get("averageHR"),
            "maxHeartRate": act.get("maxHR"),
            "avgSpeedMps": act.get("averageSpeed", 0),
            "maxSpeedMps": act.get("maxSpeed", 0),
            "avgCadence": act.get("averageRunningCadenceInStepsPerMinute"),
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

    print(f"Successfully saved {len(formatted_activities)} activities to {output_path}")

if __name__ == "__main__":
    sync_garmin()
