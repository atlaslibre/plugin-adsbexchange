import { initDb, insertDataFrames, insertPositionFrames } from "./db/commands";
import { getDbInstance } from "./db/duckdb-setup";
import { DbInterfaceMessage } from "./features/types";

const db = await getDbInstance();
const version = await db.getVersion();

//@ts-ignore
window.db = db;

console.log(`DuckDB ready version: ${version}`);

await initDb(db);

chrome.runtime.onMessage.addListener(
  (msg: DbInterfaceMessage, _sender, _sendResponse) => {
    if (msg.target !== "db") return;

    (async () => {
      const conn = await db.connect();

      console.log("Got DB request of type", msg.type, msg);

      if (msg.type === "store-data-frames") {
        await insertDataFrames(msg.frames, conn);
      }

      if (msg.type === "store-position-frames") {
        await insertPositionFrames(msg.frames, conn);
      }

      await conn.close();
    })();
    return !msg.type.startsWith("store-");
  }
);
