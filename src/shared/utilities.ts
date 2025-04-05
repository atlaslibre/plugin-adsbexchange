export const randToken = function () {
  return  Math.random().toString(36).substring(2);
};

const icon = await createImageBitmap(
  await (await fetch(chrome.runtime.getURL("/icons/logo16.png"))).blob()
);

export const updateIcon = (active: boolean) => {
  if (active) {
    const canvas = new OffscreenCanvas(16, 16);
    const context = canvas.getContext("2d")!;
    context.drawImage(icon, 0, 0);
    context.font = "8px Arial";
    context.fillText("🔴", 6, 14);
    const imageData = context.getImageData(0, 0, 16, 16);
    chrome.action.setIcon({ imageData: imageData });
  } else {
    chrome.action.setIcon({ path: "/icons/logo16.png" });
  }
};