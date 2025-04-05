import { setupOffscreenDocument } from "./db/offscreen-setup";
import { executeQuery } from "./features/db-interface";
import { handleLiveUpdate } from "./features/liveupdate";
import { locate } from "./features/locate";
import { handleReplayUpdate } from "./features/replayupdate";
import { updateIcon } from "./shared/utilities";

await setupOffscreenDocument("offscreen.html");

let captureActive = true;

chrome.runtime.onMessageExternal.addListener(function (msg) {
  if (msg.type === "locate") locate(msg.center[1], msg.center[0], msg.zoom);
});

chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.target !== "background" || !msg.type) return;
  if (!captureActive) return;

  if (msg.type === "live") {
    handleLiveUpdate(msg);
  }

  if (msg.type.startsWith("replay-")) {
    handleReplayUpdate(msg);
  }
});

chrome.action.onClicked.addListener(() => {
  captureActive = !captureActive;
  updateIcon(captureActive);
});

setInterval(async () => {
  const result = await executeQuery<any[]>(
    "SELECT COUNT(*) as c FROM aircraft_positions"
  );
  console.log(result[0].c);
}, 5000);

updateIcon(captureActive);
