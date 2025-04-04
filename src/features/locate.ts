export const locate = (lat: number, lon: number, zoom: number) => {
  chrome.tabs.query({ url: "https://globe.adsbexchange.com/*" }).then((r) => {
    if (r.length === 0) {
      chrome.tabs.create({
        url: `https://globe.adsbexchange.com/?lat=${lat}&lon=${lon}&zoom=${zoom}`,
      });
      return;
    }

    const tab = r[0];

    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: (long, lat, zoom) => {
        // @ts-ignore
        const view = OLMap.getView();
        // @ts-ignore
        const proj = ol.proj.transform([long, lat], "EPSG:4326", "EPSG:3857");
        view.setCenter(proj);
        view.setZoom(zoom);
      },
      args: [lon, lat, zoom],
      // @ts-ignore
      world: "MAIN",
    });

    chrome.windows.update(tab.windowId, { focused: true }, (window) => {
      chrome.tabs.update(tab.id!, { active: true });
    });
  });
};
