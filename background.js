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

async function toggleMute() {
  const tabs = await chrome.tabs.query({ url: MEETING_URLS });
  // A tab in a live call is usually playing audio; try those first, then the active tab.
  tabs.sort((a, b) => score(b) - score(a));

  for (const tab of tabs) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: clickMuteButton,
      });
      const hit = results.find((r) => r.result);
      if (hit) {
        showBadge(hit.result);
        return;
      }
    } catch (e) {
      // Tab can't be scripted (still loading, crashed); try the next one.
    }
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

// Runs inside the meeting page. Must be self-contained.
function clickMuteButton() {
  const selectors = [
    '[data-is-muted][aria-label*="microphone" i]', // Google Meet
    "#microphone-button",                          // Teams
    '[data-tid="toggle-mute"]',                    // Teams (older)
    'button[aria-label*="mute my microphone" i]',  // Zoom web client
  ];
  const labelPattern = /turn (on|off) microphone|\b(un)?mute (my )?(mic|microphone)\b/i;
  const usable = (el) => el.getClientRects().length > 0 && !el.disabled;

  let btn = null;
  for (const s of selectors) {
    btn = [...document.querySelectorAll(s)].find(usable);
    if (btn) break;
  }
  if (!btn) {
    btn = [...document.querySelectorAll('button, [role="button"]')].find(
      (el) => usable(el) && labelPattern.test(el.getAttribute("aria-label") || "")
    );
  }
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
