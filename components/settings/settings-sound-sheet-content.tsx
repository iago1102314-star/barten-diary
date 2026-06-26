"use client";

import styles from "@/components/settings/app-settings-menu.module.css";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import { playMenuAdjustSound } from "@/lib/settings/play-menu-sound";
import {
  getAudioPreferences,
  setAudioPreferences,
  subscribeAudioPreferences,
  type AudioPreferences,
} from "@/lib/settings/audio-preferences";
import { useEffect, useRef, useState } from "react";

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

type SliderDragState = {
  moved: boolean;
};

function useSliderReleaseClick() {
  const dragRef = useRef<SliderDragState>({ moved: false });

  const onPointerDown = () => {
    dragRef.current.moved = false;
  };

  const onInput = () => {
    dragRef.current.moved = true;
  };

  const onPointerUp = () => {
    if (!dragRef.current.moved) return;
    dragRef.current.moved = false;
    playMenuAdjustSound();
  };

  return { onPointerDown, onInput, onPointerUp };
}

export function SettingsSoundSheetContent() {
  const [prefs, setPrefs] = useState<AudioPreferences>(() => getAudioPreferences());
  const bgmSlider = useSliderReleaseClick();
  const seSlider = useSliderReleaseClick();

  useEffect(() => {
    return subscribeAudioPreferences(setPrefs);
  }, []);

  const updateBgm = (value: number) => {
    setAudioPreferences({ bgm: value });
    barAudioEngine.reapplyUserBgmVolume();
  };

  const updateSe = (value: number) => {
    setAudioPreferences({ se: value });
  };

  return (
    <div className={styles.sheetContent}>
      <div className={styles.sliderBlock}>
        <div className={styles.sliderLabelRow}>
          <span className={styles.sliderLabel}>BGM</span>
          <span className={styles.sliderValue}>{formatPercent(prefs.bgm)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(prefs.bgm * 100)}
          className={styles.slider}
          aria-label="BGMの音量"
          onPointerDown={bgmSlider.onPointerDown}
          onInput={(event) => {
            bgmSlider.onInput();
            updateBgm(Number.parseInt(event.currentTarget.value, 10) / 100);
          }}
          onPointerUp={bgmSlider.onPointerUp}
          onPointerCancel={bgmSlider.onPointerUp}
        />
      </div>
      <div className={styles.sliderBlock}>
        <div className={styles.sliderLabelRow}>
          <span className={styles.sliderLabel}>SE</span>
          <span className={styles.sliderValue}>{formatPercent(prefs.se)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(prefs.se * 100)}
          className={styles.slider}
          aria-label="SEの音量"
          onPointerDown={seSlider.onPointerDown}
          onInput={(event) => {
            seSlider.onInput();
            updateSe(Number.parseInt(event.currentTarget.value, 10) / 100);
          }}
          onPointerUp={seSlider.onPointerUp}
          onPointerCancel={seSlider.onPointerUp}
        />
      </div>
    </div>
  );
}
