import { setupOffscreenDocument } from "./db/offscreen-setup";
import { executeQuery } from "./features/db-interface";
import { handleLiveUpdate } from "./features/liveupdate";
import { locate } from "./features/locate";
import { handleReplayUpdate } from "./features/replayupdate";
import { updateIcon } from "./shared/utilities";

await setupOffscreenDocument("offscreen.html");

let captureActive = true;

chrome.runtime.onMessageExternal.addListener(function (
  msg,
  _sender,
  sendResponse
) {
  if (msg.type === "locate") locate(msg.center[1], msg.center[0], msg.zoom);
  if (msg.type === "status") {
    if (!captureActive) {
      sendResponse("Capture disabled");
      return;
    }

    executeQuery<any[]>(
      "SELECT COUNT(DISTINCT hex) as c FROM aircraft_positions"
    ).then((r) => {
      sendResponse(`${r[0].c} aircraft discovered`);
    });
  }
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

updateIcon(captureActive);
