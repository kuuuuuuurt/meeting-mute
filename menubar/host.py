#!/usr/bin/python3 -I
"""Chrome native messaging helper for Meeting Mute.

Chrome starts one copy per Chrome profile and keeps it running. Each copy:
- saves its profile's mic state for the SwiftBar plugin (live wins across profiles), and
- relays the mute shortcut between profiles: a profile that gets the shortcut but has no
  meeting open writes a request file, and the other profiles' copies pass it to their extension.
"""
import fcntl
import json
import os
import select
import struct
import subprocess
import sys
import time

DIR = os.environ.get("MEETING_MUTE_DIR") or os.path.expanduser("~/Library/Application Support/meeting-mute")
STATE_FILE = os.path.join(DIR, "state.json")
TOGGLE_FILE = os.path.join(DIR, "toggle.json")
LOCK_FILE = os.path.join(DIR, ".lock")
STALE_AFTER = 30
ME = str(os.getpid())

os.makedirs(DIR, exist_ok=True)


def combined(profiles):
    now = time.time()
    fresh = [p["state"] for p in profiles.values() if now - p["t"] < STALE_AFTER]
    return "live" if "live" in fresh else "muted" if "muted" in fresh else "none"


def save_state(state):
    with open(LOCK_FILE, "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            with open(STATE_FILE) as f:
                profiles = json.load(f).get("profiles", {})
        except (OSError, ValueError, AttributeError):
            profiles = {}
        before = combined(profiles)
        profiles = {k: v for k, v in profiles.items() if time.time() - v["t"] < STALE_AFTER}
        profiles[ME] = {"state": state, "t": time.time()}
        tmp = STATE_FILE + ".tmp"
        with open(tmp, "w") as f:
            json.dump({"profiles": profiles}, f)
        os.replace(tmp, STATE_FILE)
    # Redraw the menu bar right away instead of waiting for the plugin's next scheduled run.
    if combined(profiles) != before:
        subprocess.run(["open", "-g", "swiftbar://refreshplugin?name=meeting-mute"])


def request_toggle():
    with open(TOGGLE_FILE + ".tmp", "w") as f:
        json.dump({"from": ME, "t": time.time()}, f)
    os.replace(TOGGLE_FILE + ".tmp", TOGGLE_FILE)


def read_toggle():
    try:
        with open(TOGGLE_FILE) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def send(msg):
    data = json.dumps(msg).encode()
    sys.stdout.buffer.write(struct.pack("<I", len(data)) + data)
    sys.stdout.buffer.flush()


def read_exact(n):
    # Unbuffered reads, so select() keeps seeing messages that arrive back to back.
    data = b""
    while len(data) < n:
        chunk = os.read(0, n - len(data))
        if not chunk:
            sys.exit(0)  # Chrome closed the connection
        data += chunk
    return data


def read_message():
    return json.loads(read_exact(struct.unpack("<I", read_exact(4))[0]))


last_toggle = (read_toggle() or {}).get("t", 0)

while True:
    readable, _, _ = select.select([0], [], [], 0.2)
    if readable:
        msg = read_message()
        if msg.get("type") == "state":
            save_state(msg.get("state", "none"))
        elif msg.get("type") == "relay-toggle":
            request_toggle()
    toggle = read_toggle()
    if toggle and toggle["t"] > last_toggle:
        last_toggle = toggle["t"]
        if toggle["from"] != ME and time.time() - toggle["t"] < 3:
            send({"type": "toggle"})
