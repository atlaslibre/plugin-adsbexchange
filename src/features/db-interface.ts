import { bearing } from "../shared/utilities";
import { DataFrame, DbInterfaceMessage, PositionFrame } from "./types";

const dbRequest = (msg: DbInterfaceMessage) => {
  chrome.runtime.sendMessage(msg);
};

const dbRequestWithReponse = async <T>(msg: DbInterfaceMessage) => {
  return new Promise<T>((resolve, reject) => {
    let faulted = false;
    const timeoutTimer = setTimeout(() => {
      faulted = true;
      reject("timeout from db");
    }, 10_000);

    chrome.runtime.sendMessage(msg, (response) => {
      clearTimeout(timeoutTimer);
      if (!faulted) resolve(response as T);
    });
  });
};

export const storeDataFrames = (frames: DataFrame[]) => {
  dbRequest({
    type: "store-data-frames",
    target: "db",
    frames: frames,
  });
};

export const storePositionFrames = (frames: PositionFrame[]) => {

  let fixedCount = 0;

  const aircraftWithoutHeading = new Set(frames
    .filter((f) => !f.heading)
    .map((f) => f.hex));

  aircraftWithoutHeading.forEach(hex => {
    const acf = frames.filter(f => f.hex == hex);
    acf.sort((a, b) => a.ts - b.ts);
    for (let i = 1; i < acf.length; i++) {
      const next = acf[i];
      const prev = acf[i - 1];

      if(next.heading)
        continue;

      next.heading = bearing([prev.lat, prev.lon, next.lat, next.lon]);
      fixedCount++;
    }
  });

  console.debug(`Fixed headings for ${fixedCount} frames - out of ${aircraftWithoutHeading.size} aircraft`);

  dbRequest({
    type: "store-position-frames",
    target: "db",
    frames: frames,
  });
};

export const executeQuery = async <T>(query: string): Promise<T> => {
  return await dbRequestWithReponse<T>({
    type: "query",
    target: "db",
    query: query,
  });
};
