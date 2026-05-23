/** 導入フロー用アセットパス（public/assets/） */
export const ENTRANCE_ASSETS = {
  /** 入店前 — 雨の路地（入口） */
  start: "/assets/start/rain-alley.webp",
  /** 見送り後 — 夜が終わった帰り道 */
  afterNight: "/assets/alley/after-night.webp",
  counterBack: "/assets/bar/counter-back.webp",
  counterFront: "/assets/bar/counter-front.webp",
  masterIdle: "/assets/master/master-idle.webp",
  leaving: "/assets/bar/leaving.webp",
} as const;

export const ENTRANCE_SOUNDS = {
  rain: "/sounds/rain.mp3",
  door: "/sounds/door.mp3",
  bell: "/sounds/bell.mp3",
} as const;
