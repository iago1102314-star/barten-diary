"use client";

import styles from "@/components/settings/app-settings-menu.module.css";
import { EASE_SOFT } from "@/lib/entrance/motion-presets";
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from "motion/react";
import type { PointerEvent, ReactNode } from "react";

type SettingsBottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const DISMISS_OFFSET_PX = 72;
const DISMISS_VELOCITY = 420;

function shouldDismissSheet({ offset, velocity }: PanInfo): boolean {
  return offset.y > DISMISS_OFFSET_PX || velocity.y > DISMISS_VELOCITY;
}

function isInteractiveSheetTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, button, a, label"));
}

export function SettingsBottomSheet({
  open,
  title,
  onClose,
  children,
}: SettingsBottomSheetProps) {
  const dragControls = useDragControls();

  const handleSheetPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isInteractiveSheetTarget(event.target)) return;
    dragControls.start(event);
  };

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    if (shouldDismissSheet(info)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className={styles.sheetScrim}
            aria-label="シートを閉じる"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_SOFT }}
            onClick={onClose}
          />
          <motion.div
            className={styles.sheetRoot}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onPointerDown={handleSheetPointerDown}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.44, ease: EASE_SOFT }}
          >
            <div className={styles.sheetDragZone}>
              <div className={styles.sheetHandle} aria-hidden />
              <h2 className={styles.sheetTitle}>{title}</h2>
            </div>
            <div className={styles.sheetBody}>{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
