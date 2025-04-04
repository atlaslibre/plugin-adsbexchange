import { setupOffscreenDocument } from "./db/offscreen-setup";
import { handleLiveUpdate } from "./features/liveupdate";
import { locate } from "./features/locate";
import { handleReplayUpdate } from "./features/replayupdate";

await setupOffscreenDocument("offscreen.html");

chrome.runtime.onMessageExternal.addListener(function (msg) {
  if (msg.type === "locate") locate(msg.center[1], msg.center[0], msg.zoom);
});

chrome.runtime.onMessage.addListener(function (msg) {
  if(msg.target !== "background" || !msg.type) return;

  if (msg.type === "live") {
    handleLiveUpdate(msg);
  }

  if (msg.type.startsWith("replay-")) {
    handleReplayUpdate(msg);
  }
});
