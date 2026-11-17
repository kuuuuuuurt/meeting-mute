// Finds the meeting's microphone button. Shared by the shortcut (background.js) and the state watcher (content.js).
function findMuteButton() {
  const selectors = [
    '[data-is-muted][aria-label*="microphone" i]', // Google Meet
    "#microphone-button",                          // Teams
    '[data-tid="toggle-mute"]',                    // Teams (older)
    'button[aria-label*="mute my microphone" i]',  // Zoom web client
  ];
  const labelPattern = /turn (on|off) microphone|\b(un)?mute (my )?(mic|microphone)\b/i;
  const usable = (el) => el.getClientRects().length > 0 && !el.disabled;

  for (const s of selectors) {
    const btn = [...document.querySelectorAll(s)].find(usable);
    if (btn) return btn;
  }
  return [...document.querySelectorAll('button, [role="button"]')].find(
    (el) => usable(el) && labelPattern.test(el.getAttribute("aria-label") || "")
  ) || null;
}

// "muted", "live", or "none" (no meeting controls on this page).
function micState() {
  const btn = findMuteButton();
  if (!btn) return "none";
  const flag = btn.getAttribute("data-is-muted");
  if (flag !== null) return flag === "true" ? "muted" : "live";
  // The label names the action the button will take: "Unmute" means you're muted now.
  return /unmute|turn on/i.test(btn.getAttribute("aria-label") || "") ? "muted" : "live";
}
