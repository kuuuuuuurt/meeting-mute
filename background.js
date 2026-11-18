// Meeting Mute: finds the open Meet / Zoom / Teams tab and clicks its mute button.

const MEETING_URLS = [
  "https://meet.google.com/*",
  "https://*.zoom.us/*",
  "https://teams.microsoft.com/*",
  "https://teams.live.com/*",
  "https://teams.cloud.microsoft/*",
];

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-mute") toggleMute();
});
chrome.action.onClicked.addListener(() => toggleMute());

// relayed = the request came from this extension in another Chrome profile (see connectHelper below).
async function toggleMute(relayed = false) {
  const tabs = await chrome.tabs.query({ url: MEETING_URLS });
  // A tab in a live call is usually playing audio; try those first, then the active tab.
  tabs.sort((a, b) => score(b) - score(a));

  for (const tab of tabs) {
    try {
      const target = { tabId: tab.id, allFrames: true };
      await chrome.scripting.executeScript({ target, files: ["find.js"] });
      const results = await chrome.scripting.executeScript({ target, func: clickMuteButton });
      const hit = results.find((r) => r.result);
      if (hit) {
        showBadge(hit.result);
        return;
      }
    } catch (e) {
      // Tab can't be scripted (still loading, crashed); try the next one.
    }
  }

  if (relayed) return;
  // Chrome gives a global shortcut to only one profile. If the meeting is in another profile, hand it over.
  if (helper) {
    helper.postMessage({ type: "relay-toggle" });
    return;
  }

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "Meeting Mute",
    message: tabs.length
      ? "Found a meeting tab but not its mute button. The site may have changed its layout."
      : "No Meet, Zoom, or Teams tab is open.",
  });
}

function score(tab) {
  return (tab.audible ? 2 : 0) + (tab.active ? 1 : 0);
}

// Runs inside the meeting page, after find.js.
function clickMuteButton() {
  const btn = findMuteButton();
  if (!btn) return null;
  const labelBeforeClick = btn.getAttribute("aria-label") || "clicked";
  btn.click();
  return labelBeforeClick;
}

// Brief toolbar badge: MUTE (red) or LIVE (green), inferred from the button label before the click.
function showBadge(labelBeforeClick) {
  const nowMuted = !/unmute|turn on/i.test(labelBeforeClick);
  chrome.action.setBadgeBackgroundColor({ color: nowMuted ? "#d93025" : "#188038" });
  chrome.action.setBadgeText({ text: nowMuted ? "MUTE" : "LIVE" });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
}

// ---- Optional helper (menubar/): menu bar indicator + shortcut relay between Chrome profiles ----
// Each meeting page reports its mic state; the combined state goes to a small native helper,
// which writes it where the SwiftBar plugin reads it. The same connection relays the shortcut
// between profiles. If the helper isn't installed, all of this does nothing.

let helper = null;

function connectHelper() {
  helper = chrome.runtime.connectNative("com.meetingmute.state");
  helper.onMessage.addListener((msg) => {
    if (msg.type === "toggle") toggleMute(true);
  });
  helper.onDisconnect.addListener(() => {
    const notInstalled = /not found/i.test(chrome.runtime.lastError?.message || "");
    helper = null;
    if (!notInstalled) setTimeout(connectHelper, 5000);
  });
  lastSentState = null; // resend state to a fresh helper
}

const frameStates = new Map(); // "tabId:frameId" -> { state, t }
let lastSentState = null;

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== "mic-state" || !sender.tab) return;
  frameStates.set(`${sender.tab.id}:${sender.frameId}`, { state: msg.state, t: Date.now() });
  report(msg.state !== "none");
});

chrome.tabs.onRemoved.addListener((tabId) => {
  for (const key of frameStates.keys()) if (key.startsWith(`${tabId}:`)) frameStates.delete(key);
  report(false);
});

// Live wins over muted: showing "muted" while you're actually live is the dangerous mistake.
function combinedState() {
  const fresh = [...frameStates.values()].filter((s) => Date.now() - s.t < 30000).map((s) => s.state);
  if (fresh.includes("live")) return "live";
  if (fresh.includes("muted")) return "muted";
  return "none";
}

function report(isHeartbeat) {
  const state = combinedState();
  if (state === lastSentState && !isHeartbeat) return;
  lastSentState = state;
  helper?.postMessage({ type: "state", state });
}

connectHelper();
