import {
  LiveAircraft,
  ReplayCompleteMsg,
  ReplayDataMsg,
  ReplayPositionMsg,
} from "./adsbexchange/types";

chrome.runtime.onMessageExternal.addListener(function (msg) {
  if (msg.type === "locate")
    chrome.tabs.query({ url: "https://globe.adsbexchange.com/*" }).then((r) => {
      if (r.length === 0) {
        chrome.tabs.create({
          url: `https://globe.adsbexchange.com/?lat=${msg.center[1]}&lon=${msg.center[0]}&zoom=${msg.zoom}`,
        });
        return;
      }

      const tab = r[0];

      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: (long, lat, zoom) => {
          // @ts-ignore
          const view = OLMap.getView();
          // @ts-ignore
          const proj = ol.proj.transform([long, lat], "EPSG:4326", "EPSG:3857");
          view.setCenter(proj);
          view.setZoom(zoom);
        },
        args: [msg.center[0], msg.center[1], msg.zoom],
        // @ts-ignore
        world: "MAIN",
      });

      chrome.windows.update(tab.windowId, { focused: true }, (window) => {
        chrome.tabs.update(tab.id!, { active: true });
      });
    });
});

chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.type === "live") {
    const update = [];
    for (let i = 0; i < msg.data.length; i++) {
      const frame = msg.data[i] as LiveAircraft;

      if (frame.lat === undefined || frame.lon === undefined) continue;
      if (frame.type === "adsb_icao_nt" && frame.alt_baro == "ground") continue;

      const altitude = frame.alt_baro == "ground" ? 0 : frame.alt_baro;

      const ac = {
        hex: frame.hex,
        lat: frame.lat,
        lon: frame.lon,
        head: frame.true_heading ?? frame.track,
        speed: frame.gs,
        alt: altitude,
        age: frame.seen_pos,
      };

      update.push(ac);
    }
  }

  if (msg.type === "replay-data") {
  }

  if (msg.type === "replay-pos") {
  }

  if (msg.type === "replay-complete") {
  }
});
