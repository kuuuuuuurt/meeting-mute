#!/usr/bin/python3 -I
# <swiftbar.title>Meeting Mute</swiftbar.title>
# <swiftbar.hideAbout>true</swiftbar.hideAbout>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
# <swiftbar.hideDisappearPlugin>true</swiftbar.hideDisappearPlugin>
"""Menu bar mute indicator for the Meeting Mute Chrome extension. Shows nothing when you're not in a meeting."""
import base64
import json
import os
import time

ICONS = os.path.join(os.path.dirname(os.path.realpath(__file__)), "icons")
STATE_FILE = os.path.expanduser("~/Library/Application Support/meeting-mute/state.json")
STALE_AFTER = 30  # seconds; the extension re-reports every 10s during a call, so older means Chrome or the call is gone

try:
    with open(STATE_FILE) as f:
        data = json.load(f)
except (OSError, ValueError):
    data = {}



def icon(name):
    with open(os.path.join(ICONS, name + ".png"), "rb") as f:
        return "image=" + base64.b64encode(f.read()).decode()


# One entry per Chrome profile. Live wins: showing "muted" while you're actually live is the dangerous mistake.
fresh = [p["state"] for p in data.get("profiles", {}).values() if time.time() - p["t"] < STALE_AFTER]
state = "live" if "live" in fresh else "muted" if "muted" in fresh else "none"

if state == "muted":
    print("| " + icon("mic-muted"))
    print("---")
    print("You're muted in your meeting")
elif state == "live":
    print("| " + icon("mic-live"))
    print("---")
    print("Your mic is on in your meeting")
# No meeting: print nothing, and SwiftBar hides the item.
