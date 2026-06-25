"use client";

import { MasterIntroPanel } from "@/components/entrance/master-intro-panel";
import { BarButton } from "@/components/ui/bar-button";
import { MASTER_DRINK_SERVED } from "@/lib/entrance/master-greetings";
import {
  getMicAvailability,
  micBlockedHintText,
} from "@/lib/recorder/mic-availability";
import { Reveal } from "@/components/motion/reveal";
import { useEffect, useMemo, useState } from "react";

type DrinkRecordIntroPanelProps = {
  onSip: () => void;
  /** grass 経由の提供演出 — セリフを飛ばして口をつけるへ */
  skipToSip?: boolean;
};

/** 明転後 — マスター吹き出し → 口をつける（同一画面） */
export function DrinkRecordIntroPanel({
  onSip,
  skipToSip = false,
}: DrinkRecordIntroPanelProps) {
  const [showSip, setShowSip] = useState(false);
  const micBlock = useMemo(() => {
    if (!showSip) return null;
    const availability = getMicAvailability();
    return availability.available ? null : availability.reason ?? "unsupported";
  }, [showSip]);

  useEffect(() => {
    if (!skipToSip || showSip) return;
    setShowSip(true);
  }, [showSip, skipToSip]);

  if (!showSip) {
    return (
      <MasterIntroPanel
        lines={MASTER_DRINK_SERVED}
        onComplete={() => setShowSip(true)}
        onSkipToEnd={() => setShowSip(true)}
        bubbleDelayMs={0}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-end px-5 pb-[12%]">
      {micBlock && (
        <p className="mx-auto mb-4 max-w-sm whitespace-pre-line text-center font-serif-jp text-[12px] leading-relaxed text-amber-100/75">
          {micBlockedHintText(micBlock)}
        </p>
      )}
      <Reveal delay={0.1} className="mx-auto w-full max-w-[220px]">
        <BarButton variant="primary" onClick={onSip} disabled={Boolean(micBlock)}>
          口をつける
        </BarButton>
      </Reveal>
    </div>
  );
}
