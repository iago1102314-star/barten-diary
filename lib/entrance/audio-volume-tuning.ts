import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";

/**
 * 音量最終調整 — このファイルの mix / peakDbfs / sceneScale を編集してください。
 *
 * - BGM mix (0.0–1.0): そのままループ BGM の基準音量。設定メニューの BGM スライダーが乗ります。
 * - SE mix (0.0–1.0): ミックス目標。getSfxPlayVolume で peakDbfs 補正後に 0–1 へ変換されます。
 * - SE peakDbfs: 音源ピーク (ffmpeg volumedetect)。mix だけでは揃いにくい SE のラウドネス補正用。
 * - sceneScale: 特定シーンでの追加倍率（最終 SE 音量 = getSfxPlayVolume × sceneScale × SEスライダー）
 *
 * 実機で即試す: 開発パネル (?audioTune=1) かコンソール
 *   window.__bartenAudioVol.set({ bgm: { jazzCounter: 0.008 } })
 *   window.__bartenAudioVol.apply()
 */
export const AUDIO_VOLUME_TUNING = {
  bgm: {
    /** ホーム入場・記録棚 — 雨の路地（outside.mp3 ループ） */
    outsideAlley: {
      mix: 0.27,
      asset: ENTRANCE_SOUNDS.outside,
    },
    /** 録音終了後の帰り道 — 路地 BGM（outside.mp3 ループ・低め） */
    outsideLeaving: {
      mix: 0.15,
      asset: ENTRANCE_SOUNDS.outside,
    },
    /** カウンター店内 — ジャズ（jazz.mp3 ループ）※ 0.018（1.8%）であり 0.18 ではない */
    jazzCounter: {
      mix: 0.0,
      asset: ENTRANCE_SOUNDS.jazz,
      /**
       * 店内ジャズの呼吸・ループ継ぎ目（体感の明滅に影響）
       * multiplier は targetVolume に掛ける係数（0〜1）
       */
      ambient: {
        breathCyclesPerLoop: 3,
        breathDepth: 0.35,
        loopFadeOutSec: 1.2,
        loopFadeInSec: 2,
        loopFloorRatio: 0.3,
      },
    },
  },

  se: {
    /** 扉を開ける — 入店・退店（door.mp4） */
    door: {
      mix: 0.15,
      peakDbfs: 0,
      asset: ENTRANCE_SOUNDS.door,
      sceneScale: {
        /** 録音終了〜退店時（通常入店より静かに） */
        postRecordExit: 0.5,
      },
    },
    /** グラスをカウンター手前へスライド（grass.mp4） */
    glassSlide: {
      mix: 0.48,
      peakDbfs: -0.2,
      asset: ENTRANCE_SOUNDS.glassSlide,
    },
    /** 気分確定 — ボタンが中央へ（send.mp4） */
    send: {
      mix: 0.35,
      peakDbfs: -6,
      asset: ENTRANCE_SOUNDS.send,
    },
    /** 吹き出し・UI タップ全般（click.mp4）— メニュー項目タップ等 */
    click: {
      mix: 0.3,
      peakDbfs: -5.9,
      asset: ENTRANCE_SOUNDS.click,
    },
    /** 設定メニューを開く（menu-open.mp4） */
    menuOpen: {
      mix: 0.32,
      peakDbfs: -5.9,
      asset: ENTRANCE_SOUNDS.menuOpen,
    },
    /** 設定シート内の操作 — 音量スライダー等（menu-click.mp4） */
    menuClick: {
      mix: 0.28,
      peakDbfs: -5.9,
      asset: ENTRANCE_SOUNDS.menuClick,
    },
    /** 記録棚 — ページめくり（page.mp4） */
    page: {
      mix: 0.4,
      peakDbfs: -6,
      asset: ENTRANCE_SOUNDS.page,
    },
    /** 気分選択の幕（think.mp4） */
    think: {
      mix: 0.6,
      peakDbfs: -15.5,
      asset: ENTRANCE_SOUNDS.think,
    },
  },
} as const;

export type BarSfxKind = keyof typeof AUDIO_VOLUME_TUNING.se;
export type BgmMixKey = keyof typeof AUDIO_VOLUME_TUNING.bgm;

const OVERRIDE_STORAGE_KEY = "barten-audio-volume-overrides";

export type AudioVolumeOverrides = {
  bgm?: Partial<Record<BgmMixKey, number>>;
  se?: Partial<Record<BarSfxKind, number>>;
};

function clampMix(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** localStorage の mix 上書き（開発・実機チューニング用） */
export function readAudioVolumeOverrides(): AudioVolumeOverrides {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(OVERRIDE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AudioVolumeOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAudioVolumeOverrides(overrides: AudioVolumeOverrides): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
}

export function clearAudioVolumeOverrides(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OVERRIDE_STORAGE_KEY);
}

/** 実行時 mix — コード定数 + localStorage オーバーライド */
export function getBgmMix(key: BgmMixKey): number {
  const override = readAudioVolumeOverrides().bgm?.[key];
  if (typeof override === "number" && Number.isFinite(override)) {
    return clampMix(override);
  }
  return AUDIO_VOLUME_TUNING.bgm[key].mix;
}

/** 実行時 SE mix — peakDbfs 補正前の目標値 */
export function getSeMix(kind: BarSfxKind): number {
  const override = readAudioVolumeOverrides().se?.[kind];
  if (typeof override === "number" && Number.isFinite(override)) {
    return clampMix(override);
  }
  return AUDIO_VOLUME_TUNING.se[kind].mix;
}

/** bar-audio-engine 向け — 実行時にオーバーライドを反映 */
export function readBarAudioLevels() {
  return {
    outside: {
      alley: getBgmMix("outsideAlley"),
      leaving: getBgmMix("outsideLeaving"),
    },
    jazz: {
      counter: getBgmMix("jazzCounter"),
    },
    sfx: {
      door: getSeMix("door"),
      glassSlide: getSeMix("glassSlide"),
      send: getSeMix("send"),
      click: getSeMix("click"),
      menuOpen: getSeMix("menuOpen"),
      menuClick: getSeMix("menuClick"),
      page: getSeMix("page"),
      think: getSeMix("think"),
    },
  };
}

/** @deprecated readBarAudioLevels() / getBgmMix / getSeMix を使う */
export const BAR_AUDIO_LEVELS = {
  get outside() {
    return readBarAudioLevels().outside;
  },
  get jazz() {
    return readBarAudioLevels().jazz;
  },
  get sfx() {
    return readBarAudioLevels().sfx;
  },
};

/** mix 1.0 ≒ 同程度のラウドネス（-6 dBFS 基準） */
const SFX_REFERENCE_PEAK_LINEAR = 10 ** (-6 / 20);

/** 再生直前 — mix × ピーク補正 → 0–1 */
export function getSfxPlayVolume(kind: BarSfxKind): number {
  const { peakDbfs } = AUDIO_VOLUME_TUNING.se[kind];
  const mix = getSeMix(kind);
  const peakLinear = 10 ** (peakDbfs / 20);
  return Math.max(0, Math.min(1, mix * (SFX_REFERENCE_PEAK_LINEAR / peakLinear)));
}

/** シーン別 SE 倍率 — door.postRecordExit 等 */
export function getSfxSceneVolumeScale(
  kind: BarSfxKind,
  scene: string,
): number {
  const entry = AUDIO_VOLUME_TUNING.se[kind];
  if (!("sceneScale" in entry) || !entry.sceneScale) return 1;
  const scale = entry.sceneScale[scene as keyof typeof entry.sceneScale];
  return typeof scale === "number" ? scale : 1;
}

/** 店内ジャズの呼吸・ループ継ぎ目 — BAR_AUDIO_TIMING.jazzAmbient へ渡す */
export const JAZZ_BGM_AMBIENT_TUNING =
  AUDIO_VOLUME_TUNING.bgm.jazzCounter.ambient;

export function isAudioVolumeDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUDIO_VOLUME_DEBUG === "true";
}

export function logAudioVolumeDebug(
  label: string,
  data: Record<string, unknown>,
): void {
  if (!isAudioVolumeDebugEnabled()) return;
  console.info(`[audio-vol] ${label}`, data);
}

type AudioVolumeDevApi = {
  get: () => {
    tuning: typeof AUDIO_VOLUME_TUNING;
    overrides: AudioVolumeOverrides;
    effective: ReturnType<typeof readBarAudioLevels>;
  };
  set: (patch: AudioVolumeOverrides) => void;
  clear: () => void;
  apply: () => void;
  log: () => void;
};

/** 開発コンソール — window.__bartenAudioVol */
export function installAudioVolumeDevApi(applyTuning: () => void): void {
  if (typeof window === "undefined") return;

  const api: AudioVolumeDevApi = {
    get() {
      return {
        tuning: AUDIO_VOLUME_TUNING,
        overrides: readAudioVolumeOverrides(),
        effective: readBarAudioLevels(),
      };
    },
    set(patch) {
      const current = readAudioVolumeOverrides();
      saveAudioVolumeOverrides({
        bgm: { ...current.bgm, ...patch.bgm },
        se: { ...current.se, ...patch.se },
      });
    },
    clear() {
      clearAudioVolumeOverrides();
    },
    apply() {
      applyTuning();
    },
    log() {
      console.table(api.get().effective);
    },
  };

  (window as Window & { __bartenAudioVol?: AudioVolumeDevApi }).__bartenAudioVol =
    api;
}

export function isAudioVolumeTunePanelEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_AUDIO_VOLUME_TUNING_PANEL === "true") {
    return true;
  }
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("audioTune");
}
