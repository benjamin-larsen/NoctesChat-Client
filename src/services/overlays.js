import { ref } from "noctes.jsx";

export const currentOverlay = ref(null);

const overlayQueue = [];
let hasOverlay = false;

export function setOverlay(overlay) {
  if (hasOverlay) {
    overlayQueue.push(overlay);
  } else {
    currentOverlay.value = overlay;
    hasOverlay = true;
  }
}

export function closeOverlay() {
  const next = overlayQueue.shift();

  if (next) {
    currentOverlay.value = next;
  } else {
    currentOverlay.value = null;
    hasOverlay = false;
  }
}