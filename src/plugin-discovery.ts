import { registerPlugin } from "./shared/registration";

registerPlugin({
  type: "actor",
  name: "ADSB Exchange",
  replay: true,
  locate: true
})
