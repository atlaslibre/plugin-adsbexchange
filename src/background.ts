import { setupOffscreenDocument } from "./db/offscreen-setup";
import { executeQuery } from "./features/db-interface";
import { handleLiveUpdate } from "./features/liveupdate";
import { locate } from "./features/locate";
import {
  generatePositionQuery,
  PositionQueryRow,
  transformToActor,
} from "./features/query";
import { handleReplayUpdate } from "./features/replayupdate";
import {
  generateTrackQuery,
  TrackQueryRow,
  transformToTrack,
} from "./features/track";
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

  if (msg.type === "query") {
    executeQuery<PositionQueryRow[]>(
      generatePositionQuery(
        msg.ts * 1000,
        msg.maxDelta,
        msg.bounds[0][1],
        msg.bounds[1][1],
        msg.bounds[0][0],
        msg.bounds[1][0],
        msg.limit
      )
    ).then((positionResult) => {
      if (msg.tracks === undefined) msg.tracks = [];

      const hexs = msg.tracks.map((s: string): string => s.split("-")[1]);

      const trackPromise =
        hexs.length > 0
          ? executeQuery<TrackQueryRow[]>(
              generateTrackQuery(
                hexs,
                msg.ts * 1000,
                msg.maxDeltaTrack ?? msg.maxDelta
              )
            )
          : Promise.resolve([]);

      trackPromise.then((trackResult) => {
        const tracks = [];
        for (let i = 0; i < msg.tracks.length; i++) {
          const hex = msg.tracks[i].split("-")[1] as string;
          const tracksForHex = trackResult.filter((a) => a.hex == hex);
          if (tracksForHex.length > 0) {
            tracks.push(transformToTrack(tracksForHex));
          }
        }
        sendResponse({
          version: 1,
          actors: positionResult.map((a) => transformToActor(a)),
          tracks: tracks,
        });
      });
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
