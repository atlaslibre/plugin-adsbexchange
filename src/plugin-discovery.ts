import { registerPlugin } from "./shared/registration";

registerPlugin({
  type: "actor",
  name: "ADSB Exchange",
  attribution: "Aircraft data by ADSBExchange.com",
  replay: true,
  locate: true,
  status: true
})
