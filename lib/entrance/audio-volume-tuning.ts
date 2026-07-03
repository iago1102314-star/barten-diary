import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";

/**
 * 音量最終調整 — このファイルの mix / peakDbfs / sceneScale を編集してください。
 *
 * - BGM mix (0.0–1.0): そのままループ BGM の基準音量。設定メニューの BGM スライダーが乗ります。
 * - SE mix (0.0–1.0): ミックス目標。getSfxPlayVolume で peakDbfs 補正後に 0–1 へ変換されます。
 * - SE peakDbfs: 音源ピーク (ffmpeg volumedetect)。mix だけでは揃いにくい SE のラウドネス補正用。
 * - sceneScale: 特定シーンでの追加倍率（最終 SE 音量 = getSfxPlayVolume × sceneScale × SEスライダー）
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
    /** カウンター店内 — ジャズ（jazz.mp3 ループ） */
    jazzCounter: {
      mix: 0.018,
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

/** bar-audio-engine / entrance-flow 向け — 既存 API 互換 */
export const BAR_AUDIO_LEVELS = {
  outside: {
    alley: AUDIO_VOLUME_TUNING.bgm.outsideAlley.mix,
    leaving: AUDIO_VOLUME_TUNING.bgm.outsideLeaving.mix,
  },
  jazz: {
    counter: AUDIO_VOLUME_TUNING.bgm.jazzCounter.mix,
  },
  sfx: {
    door: AUDIO_VOLUME_TUNING.se.door.mix,
    glassSlide: AUDIO_VOLUME_TUNING.se.glassSlide.mix,
    send: AUDIO_VOLUME_TUNING.se.send.mix,
    click: AUDIO_VOLUME_TUNING.se.click.mix,
    menuOpen: AUDIO_VOLUME_TUNING.se.menuOpen.mix,
    menuClick: AUDIO_VOLUME_TUNING.se.menuClick.mix,
    page: AUDIO_VOLUME_TUNING.se.page.mix,
    think: AUDIO_VOLUME_TUNING.se.think.mix,
  },
} as const;

/** mix 1.0 ≒ 同程度のラウドネス（-6 dBFS 基準） */
const SFX_REFERENCE_PEAK_LINEAR = 10 ** (-6 / 20);

/** 再生直前 — mix × ピーク補正 → 0–1 */
export function getSfxPlayVolume(kind: BarSfxKind): number {
  const { mix, peakDbfs } = AUDIO_VOLUME_TUNING.se[kind];
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
