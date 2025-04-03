export type AdsbCategory =
  | "A0"
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "A5"
  | "A6"
  | "A7"
  | "B0"
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "B5"
  | "B6"
  | "B7"
  | "C0"
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "C5"
  | "C6"
  | "C7";

// these properties are only present on type adsb_icao aircraft
export interface LiveAdsbProps {
  type: "adsb_icao";
  alt_geom: number;
  category: AdsbCategory;
  emergency: number;
  geom_rate: number;
  gva: number;
  nac_p: number;
  nac_v: number;
  nav_heading: number;
  nic_a: number;
  nic_baro: number;
  oat: number;
  roll: number;
  sda: number;
  sil: number;
  tas: number;
  tat: number;
  track_rate: number;
  version: number;
  wd: number;
  ws: number;
}

// these properties are only present on type adsb_icao_nt aircraft
export interface LiveAdsbNtProps {
  type: "adsb_icao_nt";
  category: AdsbCategory;
  nac_p: number;
  sil: number;
  version: number;
}

export interface LiveAircraft {
  type:
    | "adsb_icao"
    | "adsb_icao_nt"
    | "adsr_icao"
    | "tisb_icao"
    | "adsc"
    | "mlat"
    | "other"
    | "mode_s"
    | "adsb_other"
    | "adsr_other"
    | "tisb_other"
    | "tisb_trackfile";
  adsb_version: number;
  adsr_version: number;
  airground: number;
  alert1: number;
  alt_baro: number | "ground";
  baro_rate: number;
  dbFlags: number;
  extraFlags: number;
  flight: string;
  gs: number;
  hex: string;
  ias: number;
  lat?: number;
  lon?: number;
  mach: number;
  mag_heading: number;
  messageRate: number;
  nav_altitude_fms: number;
  nav_altitude_mcp: number;
  nav_qnh: number;
  nic: number;
  nogps: number;
  r: string;
  rc: number;
  receiverCount: number;
  rId: string;
  rssi: number;
  seen_pos: number;
  seen: number;
  sil_type: number;
  spi: number;
  squawk: string;
  t: string;
  tisb_version: number;
  track: number;
  true_heading?: number;
}

export interface ReplayAircraftData {
    ts: number;
    hex: string;
    squawk: string;
    flight?: string;
}

export interface ReplayAircraftPosition {
    ts: number;
    hex: string;
    lat: number;
    lon: number;
    alt: number;
    gs?: number;
}

export interface ReplayPositionMsg {
    type: "replay-pos";
    key: string,
    positions: ReplayAircraftPosition[];
}

export interface ReplayDataMsg {
    type: "replay-data";
    key: string,
    data: ReplayAircraftData[];
}

export interface ReplayCompleteMsg {
    type: "replay-complete";
    key: string,
}