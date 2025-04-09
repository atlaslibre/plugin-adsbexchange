import { ActorPosition, ActorTrack } from "../shared/types";

export interface TrackQueryRow {
  ts: number;
  hex: string;
  lat: number;
  lon: number;
  alt?: number;
  heading?: number;
  speed?: number;
  delta: number;
}

export function transformToTrack(rows: TrackQueryRow[]): ActorTrack {
  const pos = rows.map(
    (row): ActorPosition => ({
      ts: Math.trunc(row.ts / 1000),
      lat: row.lat,
      lon: row.lon,
      alt: row.alt !== undefined && row.alt < 0 ? 0 : row.alt, // todo convert ft
      heading: row.heading,
      speed: row.speed, // todo convert knots
    })
  );

  return {
    id: `adsbx-${rows[0].hex}`,
    track: pos,
  };
}

export function generateTrackQuery(hexs: string[], ts: number, delta: number) {
  const hexsPart =
    hexs.length > 0
      ? `AND hex IN (${hexs.map((hex) => `'${hex}'`).join(",")})`
      : "";

  return `SELECT
    ts,
    hex,
    lat,
    lon,
    alt,
    heading,
    speed,
    abs(${ts} - CAST(ts AS REAL)) as delta
FROM
    aircraft_positions
WHERE
    delta < ${delta}
    ${hexsPart}
ORDER BY
    ts`;
}
