# Meeting Mute

A Chrome extension that gives you one keyboard shortcut to mute and unmute yourself in Google Meet, Zoom, or Microsoft Teams running in the browser. It works from any app, so you don't have to find the meeting tab first.

## Why

Muting the Mac's microphone at the system level works everywhere, but it has two problems. Google Meet shows a "Microphone muted by system" warning every time. And nobody else on the call sees you as muted, because the meeting app doesn't know.

This extension presses the meeting's own mute button instead. The meeting shows your mute icon to everyone, and Meet's warning never appears.

## How it works

When you press the shortcut, the extension finds your open Meet, Zoom, or Teams tab and clicks the mute button on the page. If several meeting tabs are open, it picks the one playing audio, which is usually the live call. The toolbar icon briefly shows MUTE or LIVE, and if it can't find a mute button you get a notification.

It only runs on Meet, Zoom, and Teams pages, and only when you press the shortcut or click its icon. It collects nothing and sends nothing anywhere.

## Install

The extension isn't in the Chrome Web Store, so you load it yourself:

1. Download this repo (green **Code** button, then **Download ZIP**) and unzip it.
2. In Chrome, go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the unzipped folder.

## Set the shortcut

1. Go to `chrome://extensions/shortcuts`.
2. Find Meeting Mute. Next to **Mute or unmute your meeting**, click the pencil and press **Control+Shift+M**. That's the Control key (⌃), not Command; Cmd+Shift+M is Chrome's profile switcher. Leave "Activate the extension" blank.
3. Change the dropdown next to the shortcut from **In Chrome** to **Global**. This is what makes it work when Chrome isn't the front app.
4. Test it from another app. If nothing happens, quit Chrome completely (Cmd+Q) and reopen it; Chrome sometimes needs a restart before a Global shortcut responds.

## Put it on a single key (Logitech keyboards)

If you have a Logitech keyboard, you can make any spare key send the shortcut through Logi Options+. I use the **Eject** key, since there's nothing left to eject on a modern computer and the key otherwise sits unused.

1. Open Logi Options+ and select your keyboard.
2. Click the key you want to use (for example, Eject).
3. Choose **Keyboard shortcut** as its action and press Control+Shift+M.
4. If that key was set to the system mic-mute action before, this replaces it.

Other keyboard tools that can remap a key to a key combination (Karabiner-Elements, BetterTouchTool, and so on) work the same way.

## Optional: mute status in the menu bar

If you use [SwiftBar](https://swiftbar.app), the extension can show your mute state in the Mac menu bar: a red crossed-out mic while you're muted, a green mic while your mic is on, and nothing when you're not in a meeting. It follows the meeting itself, so it stays right whether you mute with the shortcut or by clicking in the page.

Chrome extensions can't talk to the menu bar directly, so this uses a small helper script that Chrome runs (Chrome calls this "native messaging"). The extension tells the helper your mic state, the helper saves it to a file, and the SwiftBar plugin reads that file.

1. Install SwiftBar (`brew install --cask swiftbar`) and choose a plugin folder when it asks.
2. Copy the extension's ID from the Meeting Mute card in `chrome://extensions`.
3. Run `menubar/install.sh <extension-id>`. It registers the helper with Chrome and adds the plugin to your SwiftBar folder.
4. Reload Meeting Mute in `chrome://extensions`, then reload your meeting tab.

Don't move the folder after installing; the helper is registered by its location. If you move it, run the installer again.

## Supported sites

- Google Meet (`meet.google.com`)
- Zoom web client (`*.zoom.us`)
- Microsoft Teams on the web (`teams.microsoft.com`, `teams.live.com`, `teams.cloud.microsoft`)

Meet has been used on real calls. The Zoom and Teams button lookups are written for their current web layouts but have had less real-world use.

## When it stops working

Meeting sites redesign their pages from time to time. If the extension can't find the mute button, it shows a notification saying so. The button lookups are in `clickMuteButton()` in `background.js`. After editing, click the reload arrow on the extension's card in `chrome://extensions`. Issues and pull requests are welcome.

## License

MIT
