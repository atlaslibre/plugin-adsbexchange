import { storeDataFrames, storePositionFrames } from "./db-interface";
import { DataFrame, PositionFrame } from "./types";

export const handleReplayUpdate = (msg: any) => {

    if(msg.type === "replay-pos") {
      const frames = msg.positions as PositionFrame[];
      storePositionFrames(frames);
    }

    if(msg.type === "replay-data") {
      const frames = msg.data as DataFrame[];
      storeDataFrames(frames);
    }  
};
