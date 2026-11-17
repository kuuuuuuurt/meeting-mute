// Watches the meeting's mic button and reports mute state to the extension, for the optional menu bar indicator.
var lastState = null;
var lastSent = 0;

setInterval(() => {
  const state = micState();
  const heartbeatDue = state !== "none" && Date.now() - lastSent > 10000;
  if (state !== lastState || heartbeatDue) {
    lastState = state;
    lastSent = Date.now();
    chrome.runtime.sendMessage({ type: "mic-state", state }).catch(() => {});
  }
}, 1000);
