#!/usr/bin/python3 -I
"""Chrome native messaging helper: receives the mic state from the extension and saves it for the menu bar plugin."""
import json
import os
import struct
import subprocess
import sys
import time

STATE_DIR = os.path.expanduser("~/Library/Application Support/meeting-mute")
STATE_FILE = os.path.join(STATE_DIR, "state.json")

length = struct.unpack("<I", sys.stdin.buffer.read(4))[0]
state = json.loads(sys.stdin.buffer.read(length)).get("state", "none")

try:
    with open(STATE_FILE) as f:
        previous = json.load(f).get("state")
except (OSError, ValueError):
    previous = None

os.makedirs(STATE_DIR, exist_ok=True)
tmp = STATE_FILE + ".tmp"
with open(tmp, "w") as f:
    json.dump({"state": state, "t": time.time()}, f)
os.replace(tmp, STATE_FILE)

# Redraw the menu bar right away instead of waiting for the plugin's next scheduled run.
if state != previous:
    subprocess.run(["open", "-g", "swiftbar://refreshplugin?name=meeting-mute"])

reply = json.dumps({"ok": True}).encode()
sys.stdout.buffer.write(struct.pack("<I", len(reply)) + reply)
sys.stdout.buffer.flush()
