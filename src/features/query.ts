import { ActorPosition } from "../shared/types";

export interface PositionQueryRow {
  hex: string;
  lat: number;
  lon: number;
  alt?: number;
  heading?: number;
  speed?: number;
  flight?: string;
  reg?: string;
  squawk?: string;
  pts: number;
  dts: number;
  delta: number;
}

interface AircraftActor {
  type: "aircraft";
  id: string;
  name: string;
  pos: ActorPosition;
  hex: string;
  reg?: string;
  flight?: string;
  squawk?: string;
}

export function transformToActor(row: PositionQueryRow): AircraftActor {
  
  row.flight = row.flight?.trim()

  if(row.flight === "")
    row.flight = undefined

  return {
    type: "aircraft",
    id: `adsbx-${row.hex}`,
    name: row.flight ?? row.reg ?? row.hex,
    pos: {
      ts: row.pts,
      lat: row.lat,
      lon: row.lon,
      alt: row.alt !== undefined && row.alt < 0 ? 0 : row.alt, // todo convert ft
      heading: row.heading,
      speed: row.speed, // todo convert knots
    },
    hex: row.hex,
    reg: row.reg,
    flight: row.flight,
    squawk: row.squawk,
  };
}

export function generatePositionQuery(
  ts: number,
  delta: number,
  latmin: number,
  latmax: number,
  lonmin: number,
  lonmax: number,
  limit: number
) {
  return `SELECT
    DISTINCT ON (aircraft_positions.hex) aircraft_positions.hex,
    lat,
    lon,
    alt,
    heading,
    speed,
    squawk,
    flight,
    reg,
    aircraft_positions.ts as pts,
    aircraft_data.ts as dts,
    abs(${ts} - CAST(aircraft_positions.ts AS REAL)) as delta
FROM
    aircraft_positions
    LEFT JOIN (
        SELECT
            DISTINCT ON (hex) 
            ts,
            hex,
            squawk,
            flight,
            reg,
        FROM
            aircraft_data
        WHERE
            ts < ${ts}
        ORDER BY
            ts DESC
    ) as aircraft_data ON aircraft_positions.hex = aircraft_data.hex
WHERE
    delta < ${delta} AND
    lat > ${latmin-2} AND
    lat < ${latmax+2} AND
    lon > ${lonmin-2} AND
    lon < ${lonmax+2}
ORDER BY
    delta
LIMIT ${limit}`;
}
