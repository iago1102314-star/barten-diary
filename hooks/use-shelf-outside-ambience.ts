"use client";

import { useBarAudio } from "@/hooks/use-bar-audio";
import { getBgmMix } from "@/lib/entrance/audio-levels";
import { useEffect } from "react";

/** 日記棚 — 路地 BGM を止めず、未開始時だけ立ち上げる */
export function useShelfOutsideAmbience(enabled = true) {
  const audio = useBarAudio();

  useEffect(() => {
    if (!enabled) return;
    if (audio.hasOutsideSession()) return;
    audio.startOutside(getBgmMix("outsideAlley"));
  }, [audio, enabled]);
}
