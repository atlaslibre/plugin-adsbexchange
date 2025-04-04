import { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { DataFrame, PositionFrame } from "../features/types";

export const DataFrameCreateCommand = `
    CREATE TABLE IF NOT EXISTS aircraft_data (
        ts UBIGINT, 
        hex VARCHAR NOT NULL,
        squawk VARCHAR,
        flight VARCHAR,
        reg VARCHAR,
        PRIMARY KEY (ts, hex)
    );`;

export const PositionFrameCreateCommand = `
    CREATE TABLE IF NOT EXISTS aircraft_positions (
        ts UBIGINT, 
        hex VARCHAR NOT NULL,
        lat FLOAT NOT NULL,
        lon FLOAT NOT NULL,
        alt FLOAT NOT NULL,
        speed SMALLINT,
        heading SMALLINT,
        PRIMARY KEY (ts, hex)
    );`;

export const initDb = async (db: AsyncDuckDB) => {
  const conn = await db.connect();
  await conn.query(DataFrameCreateCommand);
  await conn.query(PositionFrameCreateCommand);
  await conn.close();
};

export const insertDataFrames = async (
  frames: DataFrame[],
  conn: AsyncDuckDBConnection
) => {
  const now = Date.now();
  await conn.query("BEGIN TRANSACTION;");
  const stmt = await conn.prepare(`
        INSERT INTO aircraft_data VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING;
    `);
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    await stmt.query(
      frame.ts,
      frame.hex,
      frame.squawk,
      frame.flight,
      frame.reg
    );
  }
  await stmt.close();
  await conn.query("COMMIT;");
  console.log("insertDataFrame complete", Date.now() - now);
};

export const insertPositionFrames = async (
  frames: PositionFrame[],
  conn: AsyncDuckDBConnection
) => {
  const now = Date.now();

  await conn.query("BEGIN TRANSACTION;");
  const stmt = await conn.prepare(`
        INSERT INTO aircraft_positions VALUES (?,?,?,?,?,?,?) ON CONFLICT DO NOTHING;
    `);

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    await stmt.query(
      frame.ts,
      frame.hex,
      frame.lat,
      frame.lon,
      frame.alt,
      frame.speed,
      frame.heading
    );
  }
  await stmt.close();
  await conn.query("COMMIT;");
  console.log("insertDataFrame complete", Date.now() - now);
};
