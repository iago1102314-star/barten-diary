import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import type { SettingsMenuBackdrop } from "@/lib/settings/settings-menu-backdrop";

/** メニュー枠内 — 静止画1枚＋任意の暗幕（軽量） */
export type SettingsMenuStaticBackdrop =
  | { type: "black" }
  | { type: "image"; src: string; overlayOpacity?: number }
  | { type: "memories-paper" };

/** シーン種別 → 静止背景（パララックス・灯り・二重シーンなし） */
export function resolveSettingsMenuStaticBackdrop(
  backdrop: SettingsMenuBackdrop,
): SettingsMenuStaticBackdrop {
  switch (backdrop.kind) {
    case "black":
      return { type: "black" };
    case "home":
      return { type: "image", src: ENTRANCE_ASSETS.start, overlayOpacity: 0.12 };
    case "counter":
      return {
        type: "image",
        src: ENTRANCE_ASSETS.counterBack,
        overlayOpacity: 0.38,
      };
    case "record-counter":
      return {
        type: "image",
        src: ENTRANCE_ASSETS.backRecord,
        overlayOpacity: 0.32,
      };
    case "memories-shelf":
      return { type: "memories-paper" };
    case "after-night":
      return { type: "image", src: ENTRANCE_ASSETS.afterNight, overlayOpacity: 0.18 };
    case "leaving":
      return { type: "image", src: ENTRANCE_ASSETS.leaving, overlayOpacity: 0.35 };
    default:
      return { type: "black" };
  }
}
