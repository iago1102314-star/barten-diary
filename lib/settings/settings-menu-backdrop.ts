import type { CameraPose } from "@/lib/entrance/counter-camera-poses";
import type { StartLampGlowConfig } from "@/lib/entrance/start-lamp-glows";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";

/** メニュー枠内 — UI を除いたシーン背景 */
export type SettingsMenuBackdrop =
  | { kind: "black" }
  | {
      kind: "home";
      /** 未指定時は START_LAMP_GLOWS */
      steadyLampGlows?: StartLampGlowConfig[];
    }
  | {
      kind: "counter";
      moodCategoryId?: DrinkCategoryId | null;
      cameraPose?: CameraPose;
      drinkImageSrc?: string | null;
      drinkOnCounter?: boolean;
    }
  | {
      kind: "record-counter";
      drinkId?: DrinkId | null;
    }
  | { kind: "memories-shelf" }
  | { kind: "after-night" }
  | { kind: "leaving" };

export const DEFAULT_SETTINGS_MENU_BACKDROP: SettingsMenuBackdrop = {
  kind: "black",
};
