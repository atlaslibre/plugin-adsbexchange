import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

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
        alt FLOAT,
        speed INT,
        heading INT,
        PRIMARY KEY (ts, hex)
    );`;

export const initDb = async (db: AsyncDuckDB) => {
  const conn = await db.connect();
  await conn.query(DataFrameCreateCommand);
  await conn.query(PositionFrameCreateCommand);
  await conn.close();
};
