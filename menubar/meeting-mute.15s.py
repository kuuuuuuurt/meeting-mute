#!/usr/bin/python3 -I
# <swiftbar.title>Meeting Mute</swiftbar.title>
# <swiftbar.hideAbout>true</swiftbar.hideAbout>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
# <swiftbar.hideDisappearPlugin>true</swiftbar.hideDisappearPlugin>
"""Menu bar mute indicator for the Meeting Mute Chrome extension. Shows nothing when you're not in a meeting."""
import json
import os
import time

STATE_FILE = os.path.expanduser("~/Library/Application Support/meeting-mute/state.json")
STALE_AFTER = 30  # seconds; the extension re-reports every 10s during a call, so older means Chrome or the call is gone

try:
    with open(STATE_FILE) as f:
        data = json.load(f)
except (OSError, ValueError):
    data = {}

state = data.get("state") if time.time() - data.get("t", 0) < STALE_AFTER else "none"

if state == "muted":
    print("MUTED | sfimage=mic.slash.fill sfcolor=#FF3B30 color=#FF3B30")
    print("---")
    print("You're muted in your meeting")
elif state == "live":
    print("LIVE | sfimage=mic.fill sfcolor=#34C759 color=#34C759")
    print("---")
    print("Your mic is on in your meeting")
# No meeting: print nothing, and SwiftBar hides the item.
