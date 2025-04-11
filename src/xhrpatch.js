// inject a minimal hook for XHR and fetch requests
// and pass them through the isolation bridge to the backend

(function () {
  const dedupArray = (arr) => {
    return [...new Map(arr.map((v) => [`${v.hex}-${v.ts}`, v])).values()];
  };

  const liveHandler = (response) => {
    const bytes = new Uint8Array(response);
    const data = { buffer: zstdDecode(bytes).buffer };
    wqi(data);
    window.postMessage({ type: "live", data: data.aircraft });
  };

  const traceHandler = (url, response) => {
    const o = JSON.parse(response);
    const hex = o.icao;
    const baseTimestamp = o.timestamp;

    let positionUpdates = [];
    let dataUpdates = [];

    let lastSquawk = undefined;
    let lastFlight = undefined;

    for (let i = 0; i < o.trace.length; i++) {
      const t = o.trace[i];

      const timestamp = Math.trunc((t[0] + baseTimestamp) * 1000);

      const lat = t[1];
      const lon = t[2];

      if (lat && lon)
        positionUpdates.push({
          ts: timestamp,
          hex: hex,
          lat: lat,
          lon: lon,
          speed: t[4],
          alt: t[3] === "ground" ? 0 : t[3],
          heading: null,
          source: "trace",
        });

      const squawk = t[8]?.squawk;
      const flight = t[8]?.flight;

      if (t[8] && (flight !== lastFlight || squawk !== lastSquawk)) {
        dataUpdates.push({
          ts: timestamp,
          hex: hex,
          squawk: squawk,
          flight: flight,
          reg: o.r,
          source: "trace",
        });

        lastSquawk = squawk;
        lastFlight = flight;
      }
    }

    positionUpdates = dedupArray(positionUpdates);
    dataUpdates = dedupArray(dataUpdates);

    window.postMessage({
      type: "replay-data",
      key: url,
      data: dataUpdates,
    });

    window.postMessage({
      type: "replay-pos",
      key: url,
      positions: positionUpdates,
    });

    window.postMessage({
      type: "replay-complete",
      key: url,
    });
  };

  const replayRegex =
    /globe_history\/(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})\/heatmap\/(?<chunk>\d{2})\.bin\.ttf$/;

  const replayHandler = (response, depth = 0) => {
    if (depth > 10) {
      console.log(
        "Aborting replay handler, gave up waiting for data to be loaded"
      );
      return;
    }
    const dateTimeExtract = replayRegex.exec(response.url);

    const year = dateTimeExtract.groups["year"];
    const month = dateTimeExtract.groups["month"];
    const day = dateTimeExtract.groups["day"];
    const chunk = dateTimeExtract.groups["chunk"];

    console.log("Processing chunk", year, month, day, chunk);

    setTimeout(() => {
      if (replay.loadedKey !== `${year}/${month}/${day} chunk ${chunk}`) {
        console.log("Retrying, loadedKey does not match request", depth);
        replayHandler(response, depth + 1);
        return;
      }

      let positionUpdates = [];
      let dataUpdates = [];

      let points = replay.points;
      let pointsU = replay.pointsU;

      let ext = currentExtent(1.5);

      for (var index = 0; index < replay.slices.length; index++) {
        let i = replay.slices[index];

        // read out header
        let timestamp =
          replay.pointsU[i + 2] + replay.pointsU[i + 1] * 4294967296;

        // read out body
        i += 4;

        for (; i < points.length && points[i] != 0xe7f7c9d; i += 4) {
          let lat = points[i + 1];
          let lon = points[i + 2];

          if (lat >= 1073741824) {
            let hex = (points[i] & ((1 << 24) - 1))
              .toString(16)
              .padStart(6, "0");

            hex = points[i] & (1 << 24) ? "~" + hex : hex;

            let squawk = (lat & 0xffff).toString(10).padStart(4, "0");
            let data = {
              ts: timestamp,
              hex: hex,
              squawk: squawk,
              reg: null,
              source: "heatmap",
            };

            if (replay.pointsU8[4 * (i + 2)] != 0) {
              data.flight = "";
              for (let j = 0; j < 8; j++) {
                data.flight += String.fromCharCode(
                  replay.pointsU8[4 * (i + 2) + j]
                );
              }
            }
            dataUpdates.push(data);
            continue;
          }

          lat /= 1e6;
          lon /= 1e6;
          pos = [lon, lat];

          // in principle, we can get all data,
          // but since that would yield a lot of useless data
          // we limit to what is in view
          if (!inView(pos, ext)) {
            continue;
          }

          let hex = (pointsU[i] & 0xffffff).toString(16).padStart(6, "0");
          hex = pointsU[i] & 0x1000000 ? "~" + hex : hex;

          let alt = points[i + 3] & 65535;
          if (alt & 32768) alt |= -65536;
          if (alt == -123) alt = 0;
          else if (alt == -124) alt = null;
          else alt *= 25;

          let gs = points[i + 3] >> 16;
          if (gs == -1) gs = null;
          else gs /= 10;

          positionUpdates.push({
            ts: timestamp,
            hex: hex,
            lat: lat,
            lon: lon,
            speed: gs,
            alt: alt,
            heading: null,
            source: "heatmap",
          });
        }
      }

      dataUpdates = dedupArray(dataUpdates);
      positionUpdates = dedupArray(positionUpdates);

      const chunkSize = 1e5;

      for (let i = 0; i < dataUpdates.length / chunkSize; i++) {
        const last = dataUpdates.length / chunkSize === i + 1;
        window.postMessage({
          type: "replay-data",
          key: replay.loadedKey,
          data: dataUpdates.slice(
            i * chunkSize,
            last ? undefined : (i + 1) * chunkSize
          ),
        });
      }

      for (let i = 0; i < positionUpdates.length / chunkSize; i++) {
        const last = positionUpdates.length / chunkSize === i + 1;
        window.postMessage({
          type: "replay-pos",
          key: replay.loadedKey,
          positions: positionUpdates.slice(
            i * chunkSize,
            last ? undefined : (i + 1) * chunkSize
          ),
        });
      }

      window.postMessage({
        type: "replay-complete",
        key: replay.loadedKey,
      });
    }, 1000);
  };

  const originalXhr = window.XMLHttpRequest.prototype.open;

  window.XMLHttpRequest.prototype.open = function () {
    this.addEventListener("load", function () {
      if (
        this.responseURL.startsWith(
          "https://globe.adsbexchange.com/re-api/?binCraft&zstd"
        )
      ) {
        liveHandler(this.response);
      }

      if (
        this.responseURL.startsWith(
          "https://globe.adsbexchange.com/globe_history/"
        ) ||
        this.responseURL.startsWith(
          "https://globe.adsbexchange.com/data/traces/"
        )
      ) {
        traceHandler(this.responseURL, this.response);
      }
    });
    return originalXhr.apply(this, arguments);
  };

  const originalFetch = window.fetch;

  window.fetch = function () {
    const fetchResult = originalFetch.apply(this, arguments);

    if (arguments[0].startsWith("globe_history/"))
      fetchResult.then((response) => {
        replayHandler(response);
      });

    return fetchResult;
  };
})();
