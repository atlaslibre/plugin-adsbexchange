interface StoreDataFramesMessage {
  type: "store-data-frames";
  target: "db";
  frames: DataFrame[];
}

interface StorePositionFramesMessage {
  type: "store-position-frames";
  target: "db";
  frames: PositionFrame[];
}

export type DbInterfaceMessage =
  | StoreDataFramesMessage
  | StorePositionFramesMessage;

export interface DataFrame {
  ts: number;
  hex: string;
  squawk: string;
  flight?: string;
  reg?: string;
}

export interface PositionFrame {
  ts: number;
  hex: string;
  lat: number;
  lon: number;
  alt: number;
  speed?: number;
  heading?: number;
}
