import { DataFrame, DbInterfaceMessage, PositionFrame } from "./types";

const dbRequest = (msg: DbInterfaceMessage) => {
    chrome.runtime.sendMessage(msg);
}


export const storeDataFrames = (frames: DataFrame[]) => {
    dbRequest({
        "type": "store-data-frames",
        "target": "db",
        "frames": frames
    });
};

export const storePositionFrames = (frames: PositionFrame[]) => {
    dbRequest({
        "type": "store-position-frames",
        "target": "db",
        "frames": frames
    });
};
