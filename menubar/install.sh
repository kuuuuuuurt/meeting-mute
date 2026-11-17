#!/bin/bash
# Installs the menu bar indicator: registers the Chrome helper and adds the plugin to SwiftBar.
# Usage: ./install.sh <extension-id>   (copy the ID from the Meeting Mute card in chrome://extensions)
set -e
EXT_ID="$1"
if [ -z "$EXT_ID" ]; then
  echo "Usage: ./install.sh <extension-id>  (find it on the Meeting Mute card in chrome://extensions)"
  exit 1
fi
HERE="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$HERE/host.py" "$HERE/meeting-mute.15s.py"

# Chrome can't run scripts inside protected folders like Documents or Desktop, so the helper gets copied out.
HELPER_DIR="$HOME/Library/Application Support/meeting-mute"
mkdir -p "$HELPER_DIR"
cp "$HERE/host.py" "$HELPER_DIR/host.py"
chmod +x "$HELPER_DIR/host.py"

HOSTS_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
mkdir -p "$HOSTS_DIR"
cat > "$HOSTS_DIR/com.meetingmute.state.json" <<JSON
{
  "name": "com.meetingmute.state",
  "description": "Meeting Mute menu bar indicator",
  "path": "$HELPER_DIR/host.py",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$EXT_ID/"]
}
JSON
echo "Registered the Chrome helper."

PLUGIN_DIR="$(defaults read com.ameba.SwiftBar PluginDirectory 2>/dev/null || true)"
if [ -n "$PLUGIN_DIR" ]; then
  ln -sf "$HERE/meeting-mute.15s.py" "$PLUGIN_DIR/meeting-mute.15s.py"
  echo "Added the plugin to SwiftBar ($PLUGIN_DIR)."
else
  echo "SwiftBar's plugin folder isn't set. Install SwiftBar, choose a plugin folder, then run this again."
fi
echo "Last step: reload Meeting Mute in chrome://extensions, then reload your meeting tab."
