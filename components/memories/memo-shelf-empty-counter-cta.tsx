"use client";

import styles from "@/components/memories/memo-shelf-grid.module.css";
import { ShebronIcon } from "@/components/ui/shebron-icon";
import { prepareCounterEntryAudioOnUserGesture } from "@/hooks/use-bar-audio";
import { markCounterLaunchFromShelf } from "@/lib/entrance/counter-launch-from-shelf";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { MEMORIES_EXIT_FADE_SEC } from "@/lib/entrance/start-entry-timing";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MemoShelfEmptyCounterCtaProps = {
  /** 路地内の記録画面からカウンターへ — 暗転後に親が入店演出を開始 */
  onLaunchCounter?: () => void;
  /** 暗転前 — 1日上限など。false なら暗転・入店を開始しない */
  onValidateLaunch?: () => Promise<boolean>;
};

/** 記録が一枚もない棚 — カウンター入店への導線 */
export function MemoShelfEmptyCounterCta({
  onLaunchCounter,
  onValidateLaunch,
}: MemoShelfEmptyCounterCtaProps) {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleLaunch = () => {
    if (fading || checking) return;
    prepareCounterEntryAudioOnUserGesture();
    void (async () => {
      if (onValidateLaunch) {
        setChecking(true);
        const allowed = await onValidateLaunch();
        setChecking(false);
        if (!allowed) return;
      }
      setFading(true);
    })();
  };

  const handleFadeComplete = () => {
    if (onLaunchCounter) {
      onLaunchCounter();
      return;
    }

    markCounterLaunchFromShelf();
    router.push("/diaries");
  };

  return (
    <>
      <div className={styles.emptyShelfCta}>
        <p className={styles.empty}>
          まだ記録はありません。
          <br />
          今夜の一枚を残しませんか？
        </p>
        <button
          type="button"
          className={styles.emptyShelfLaunchButton}
          onPointerDown={() => {
            if (fading || checking) return;
            prepareCounterEntryAudioOnUserGesture();
          }}
          onClick={handleLaunch}
          disabled={fading || checking}
        >
          <span className={styles.emptyShelfLaunchLabel}>カウンターへ</span>
          <span className={styles.emptyShelfLaunchIconSlot} aria-hidden>
            <ShebronIcon className="rotate-180 opacity-90" sizePx={16} />
          </span>
        </button>
      </div>

      {fading ? (
        <motion.div
          className="fixed inset-0 z-[200] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MEMORIES_EXIT_FADE_SEC, ease: EASE_DRIFT }}
          onAnimationComplete={handleFadeComplete}
        />
      ) : null}
    </>
  );
}
