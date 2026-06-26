"use client";

import { AfterNightBackdrop } from "@/components/entrance/after-night-backdrop";
import { CounterScene } from "@/components/entrance/counter-scene";
import { LampGlow } from "@/components/entrance/atmosphere";
import { RecordCounterScene } from "@/components/entrance/record-counter-scene";
import { StartEntryAlleyLayer } from "@/components/entrance/start-entry-alley-layer";
import styles from "@/components/settings/settings-menu-backdrop-view.module.css";
import shelfStyles from "@/components/memories/memo-shelf-grid.module.css";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { START_LAMP_GLOWS } from "@/lib/entrance/start-lamp-glows";
import {
  START_BOKEH_LAMP_GLOWS,
  START_BOKEH_ONLY_LAMP_GLOWS,
} from "@/lib/entrance/start-bokeh-lamp-glows";
import { memoShelfPaperStyle } from "@/lib/memories/memo-shelf-tuning";
import { useSettingsMenuBackdropState } from "@/lib/settings/settings-menu-backdrop-context";
import Image from "next/image";

const STEADY_KEN_BURNS = {
  initial: false as const,
  animate: { scale: 1, x: 0 },
};

/** メニュー枠内 — 各画面の背景のみ（UI なし） */
export function SettingsMenuBackdropView() {
  const backdrop = useSettingsMenuBackdropState();

  return (
    <div className={styles.root} aria-hidden>
      {backdrop.kind === "black" ? <div className={styles.black} /> : null}

      {backdrop.kind === "home" ? (
        <StartEntryAlleyLayer
          backgroundOpacity={1}
          entranceProgress={1}
          bokehOnlyFade={0}
          steadyLampGlows={backdrop.steadyLampGlows ?? START_LAMP_GLOWS}
          bokehLampGlows={START_BOKEH_LAMP_GLOWS}
          bokehOnlyLampGlows={START_BOKEH_ONLY_LAMP_GLOWS}
          kenBurnsMotion={STEADY_KEN_BURNS}
          showBokehOnlyOrbs={false}
        />
      ) : null}

      {backdrop.kind === "counter" ? (
        <CounterScene
          priority
          settle={false}
          masterMode="idle"
          showLampGlowLight
          backgroundOnly
          moodCategoryId={backdrop.moodCategoryId}
          cameraPose={backdrop.cameraPose ?? "neutral"}
          drinkImageSrc={backdrop.drinkImageSrc}
          drinkOnCounter={backdrop.drinkOnCounter}
        />
      ) : null}

      {backdrop.kind === "record-counter" ? (
        <RecordCounterScene
          drinkId={backdrop.drinkId}
          backgroundOnly
        />
      ) : null}

      {backdrop.kind === "memories-shelf" ? (
        <div
          className={shelfStyles.screen}
          style={memoShelfPaperStyle()}
        >
          <div className={shelfStyles.screenPaperOverlay} />
          <div className={shelfStyles.screenPaperDarken} />
        </div>
      ) : null}

      {backdrop.kind === "after-night" ? (
        <AfterNightBackdrop
          motionProps={{
            initial: false,
            animate: { opacity: 1, scale: 1.02 },
            transition: { duration: 0 },
          }}
        />
      ) : null}

      {backdrop.kind === "leaving" ? (
        <div className={styles.leaving}>
          <Image
            src={ENTRANCE_ASSETS.leaving}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            draggable={false}
            unoptimized
          />
          <LampGlow x={72} y={38} tone="warm" size={9} intensity={0.22} speed="10s" />
          <div className="absolute inset-0 bg-black/35" />
        </div>
      ) : null}
    </div>
  );
}
