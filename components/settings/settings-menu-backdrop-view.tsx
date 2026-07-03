"use client";

import styles from "@/components/settings/settings-menu-backdrop-view.module.css";
import { isPerfMenuBackdropEnabled } from "@/lib/layout/perf-feature-flags";
import { resolveSettingsMenuStaticBackdrop } from "@/lib/settings/settings-menu-static-backdrop";
import { useSettingsMenuBackdropState } from "@/lib/settings/settings-menu-backdrop-context";
import { memo } from "react";

/** メニュー枠内 — 静止背景のみ（本番シーンの二重マウントなし） */
export const SettingsMenuBackdropView = memo(function SettingsMenuBackdropView() {
  const backdrop = useSettingsMenuBackdropState();

  if (!isPerfMenuBackdropEnabled()) {
    return (
      <div className={styles.root} aria-hidden>
        <div className={styles.black} />
      </div>
    );
  }

  const staticBackdrop = resolveSettingsMenuStaticBackdrop(backdrop);

  if (staticBackdrop.type === "black") {
    return (
      <div className={styles.root} aria-hidden>
        <div className={styles.black} />
      </div>
    );
  }

  if (staticBackdrop.type === "memories-paper") {
    return (
      <div className={styles.root} aria-hidden>
        <div className={styles.memoriesPaper} />
        <div className={styles.memoriesPaperTexture} />
        <div className={styles.memoriesPaperVignette} />
      </div>
    );
  }

  return (
    <div className={styles.root} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.staticImage}
        src={staticBackdrop.src}
        alt=""
        decoding="async"
        draggable={false}
      />
      {staticBackdrop.overlayOpacity != null && staticBackdrop.overlayOpacity > 0 ? (
        <div
          className={styles.staticOverlay}
          style={{ opacity: staticBackdrop.overlayOpacity }}
        />
      ) : null}
    </div>
  );
});
