import { LiveAircraft } from "../adsbexchange/types";
import { storeDataFrames, storePositionFrames } from "./db-interface";
import { DataFrame, PositionFrame } from "./types";

let lastLiveUpdate = 0;

export const handleLiveUpdate = (msg: any) => {
  const now = Date.now() / 1000;
  if (now - lastLiveUpdate < 3) return;

  const dataFrames: DataFrame[] = [];
  const positionFrames: PositionFrame[] = [];

  for (let i = 0; i < msg.data.length; i++) {
    const frame = msg.data[i] as LiveAircraft;
    
    if (frame.lat === undefined || frame.lon === undefined) continue;
    if (frame.type === "adsb_icao_nt" && frame.alt_baro == "ground") continue;

    const altitude = frame.alt_baro == "ground" ? 0 : frame.alt_baro;

    if (altitude === undefined) continue;

    dataFrames.push({
      ts: Math.trunc(now - frame.seen_pos),
      hex: frame.hex,
      squawk: frame.squawk ?? null,
      flight: frame.flight ?? null,
      reg: frame.r ?? null,
      source: "live",
    });

    positionFrames.push({
      ts: Math.trunc(now - frame.seen_pos),
      hex: frame.hex,
      lat: frame.lat,
      lon: frame.lon,
      alt: altitude ?? null,
      speed: frame.gs ?? null,
      heading: frame.true_heading ?? frame.track ?? null,
      source: "live",
    });
  }

  storeDataFrames(dataFrames);
  storePositionFrames(positionFrames);

  lastLiveUpdate = now;
};
