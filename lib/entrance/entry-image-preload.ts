import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { preloadImage } from "@/lib/entrance/preload-image";

let entryImagePreloaded = false;
let entryImagePreloadPromise: Promise<void> | null = null;

/** Loading Gate Phase — 入口背景を fetch + decode まで完了させる */
export function preloadEntryImage(): Promise<void> {
  if (entryImagePreloaded) {
    return Promise.resolve();
  }

  if (entryImagePreloadPromise) {
    return entryImagePreloadPromise;
  }

  entryImagePreloadPromise = preloadImage(ENTRANCE_ASSETS.start)
    .then(() => {
      entryImagePreloaded = true;
    })
    .catch((error) => {
      entryImagePreloadPromise = null;
      throw error;
    });

  return entryImagePreloadPromise;
}

/** Gate 完了後 — NightEntryScreen が二重 priority fetch しないための参照 */
export function isEntryImagePreloaded(): boolean {
  return entryImagePreloaded;
}
