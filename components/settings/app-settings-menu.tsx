"use client";

import type { CSSProperties, PointerEvent } from "react";
import styles from "@/components/settings/app-settings-menu.module.css";
import { SettingsBottomSheet } from "@/components/settings/settings-bottom-sheet";
import { SettingsLanguageSheetContent } from "@/components/settings/settings-language-sheet-content";
import { SettingsSoundSheetContent } from "@/components/settings/settings-sound-sheet-content";
import {
  SettingsCloseIcon,
  SettingsCommentIcon,
  SettingsHamburgerIcon,
  SettingsInformationIcon,
  SettingsOptionIcon,
  SettingsRuleIcon,
  SettingsSoundIcon,
} from "@/components/settings/settings-menu-icons";
import { EASE_SOFT } from "@/lib/entrance/motion-presets";
import {
  playMenuOpenSound,
  playMenuTapSound,
} from "@/lib/settings/play-menu-sound";
import { useAuthUser } from "@/hooks/use-auth-user";
import { SettingsProfileHeader } from "@/components/settings/settings-profile-header";
import { SettingsMenuBackdropView } from "@/components/settings/settings-menu-backdrop-view";
import { SettingsSignOutButton } from "@/components/settings/settings-sign-out-button";
import { ShebronIcon } from "@/components/ui/shebron-icon";
import {
  buildSettingsMenuCssVars,
  SETTINGS_MENU_ITEMS_TUNING,
} from "@/lib/settings/app-settings-menu-tuning";
import { applyPerfMenuBlurCssOverrides } from "@/lib/layout/perf-feature-flags";
import { useSettingsMenuVisibility } from "@/lib/settings/settings-menu-visibility";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

type SettingsSheet = "sound" | "settings" | null;

type SettingsPanel = "main" | "feedback" | "terms" | "about";

type MenuItem = {
  id: SettingsPanel | "sound" | "settings";
  label: string;
  sub?: string;
  icon: typeof SettingsSoundIcon;
  sheet?: SettingsSheet;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "sound", label: "サウンド", icon: SettingsSoundIcon, sheet: "sound" },
  {
    id: "feedback",
    label: "フィードバック",
    sub: "感想、不具合を送る",
    icon: SettingsCommentIcon,
  },
  { id: "settings", label: "設定", icon: SettingsOptionIcon, sheet: "settings" },
  { id: "terms", label: "利用規約", icon: SettingsRuleIcon },
  { id: "about", label: "このアプリについて", icon: SettingsInformationIcon },
];

function PlaceholderPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div>
      <h2 className={styles.subPanelTitle}>{title}</h2>
      <p className={styles.placeholderText}>{message}</p>
    </div>
  );
}

function AboutPanel() {
  return (
    <div>
      <h2 className={styles.aboutTitle}>このアプリについて</h2>
      <p className={styles.aboutText}>
        バーテン日記は、深夜のバーで
        <br />
        夜の記録を残すためのアプリです。
      </p>
    </div>
  );
}

function SettingsSubPanel({ panel }: { panel: SettingsPanel }) {
  switch (panel) {
    case "feedback":
      return (
        <PlaceholderPanel
          title="フィードバック"
          message={"感想や不具合の送信は\n準備中です。"}
        />
      );
    case "terms":
      return (
        <PlaceholderPanel
          title="利用規約"
          message={"利用規約は\n準備中です。"}
        />
      );
    case "about":
      return <AboutPanel />;
    default:
      return null;
  }
}

export function AppSettingsMenu() {
  const { visible } = useSettingsMenuVisibility();
  const { isLoggedIn } = useAuthUser();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<SettingsPanel>("main");
  const [sheet, setSheet] = useState<SettingsSheet>(null);

  const closeSheet = useCallback(() => {
    playMenuOpenSound();
    setSheet(null);
  }, []);

  const closeAll = useCallback(() => {
    setOpen(false);
    setPanel("main");
    setSheet(null);
  }, []);

  const handleClose = useCallback(() => {
    if (sheet) {
      closeSheet();
      return;
    }
    playMenuTapSound();
    if (panel === "main") {
      closeAll();
      return;
    }
    setPanel("main");
  }, [closeAll, closeSheet, panel, sheet]);

  const handleMenuItemPointerDown = (
    item: MenuItem,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0 || !item.sheet) return;
    playMenuOpenSound();
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.sheet) {
      setSheet(item.sheet);
      return;
    }
    playMenuTapSound();
    setPanel(item.id as SettingsPanel);
  };

  useEffect(() => {
    if (!visible) {
      closeAll();
    }
  }, [closeAll, visible]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, open]);

  if (!visible) return null;

  const menuVars = applyPerfMenuBlurCssOverrides(
    buildSettingsMenuCssVars(),
  ) as CSSProperties;

  return (
    <div style={menuVars}>
      {!open ? (
        <button
          type="button"
          className={styles.fab}
          aria-label="メニューを開く"
          onClick={() => {
            playMenuTapSound();
            setOpen(true);
          }}
        >
          <SettingsHamburgerIcon className={styles.fabIcon} />
        </button>
      ) : null}

      <AnimatePresence>
        {open ? (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_SOFT }}
          >
            <button
              type="button"
              className={styles.backdrop}
              aria-label="メニューを閉じる"
              onClick={closeAll}
            />

            <motion.div
              className={styles.panelFrame}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE_SOFT }}
            >
              <div className={styles.panelBackdrop}>
                <div className={styles.panelBackdropBlur}>
                  <SettingsMenuBackdropView />
                </div>
              </div>
              <div className={styles.panelSurface}>
                <div className={styles.panelHeader}>
                  <button
                    type="button"
                    className={styles.closeButton}
                    aria-label={
                      sheet || panel !== "main" ? "戻る" : "メニューを閉じる"
                    }
                    onClick={handleClose}
                  >
                    <SettingsCloseIcon className={styles.closeIcon} />
                  </button>
                </div>

                <div className={styles.panelBody}>
                  {panel === "main" ? (
                    <div className={styles.panelProfileZone}>
                      <SettingsProfileHeader />
                    </div>
                  ) : null}

                  <div className={styles.panelMenuZone}>
                    <div className={styles.panelMainColumn}>
                      <AnimatePresence mode="wait">
                        {panel === "main" ? (
                          <motion.div
                            key="main"
                            className={styles.panelInner}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.35, ease: EASE_SOFT }}
                          >
                            <div className={styles.menuList}>
                              {MENU_ITEMS.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                  <motion.button
                                    key={item.id}
                                    type="button"
                                    className={styles.menuItem}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      delay: 0.08 + index * 0.07,
                                      duration: 0.38,
                                      ease: EASE_SOFT,
                                    }}
                                    onPointerDown={(event) =>
                                      handleMenuItemPointerDown(item, event)
                                    }
                                    onClick={() => handleMenuItemClick(item)}
                                  >
                                    <Icon className={styles.menuItemIcon} />
                                    <span className={styles.menuItemText}>
                                      <span className={styles.menuItemLabel}>
                                        {item.label}
                                      </span>
                                      {item.sub ? (
                                        <span className={styles.menuItemSub}>
                                          {item.sub}
                                        </span>
                                      ) : null}
                                    </span>
                                    <ShebronIcon
                                      className={`${styles.menuItemChevron} rotate-180`}
                                      sizePx={
                                        SETTINGS_MENU_ITEMS_TUNING.chevronSizePx
                                      }
                                    />
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key={panel}
                            className={styles.panelInner}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.38, ease: EASE_SOFT }}
                          >
                            <SettingsSubPanel panel={panel} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {panel === "main" ? (
                    <div className={styles.panelFooter}>
                      {isLoggedIn ? (
                        <SettingsSignOutButton
                          className={styles.signOutButton}
                          iconClassName={styles.signOutIcon}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>

            <SettingsBottomSheet
              open={sheet === "sound"}
              title="サウンド"
              onClose={closeSheet}
            >
              <SettingsSoundSheetContent />
            </SettingsBottomSheet>

            <SettingsBottomSheet
              open={sheet === "settings"}
              title="設定"
              onClose={closeSheet}
            >
              <SettingsLanguageSheetContent />
            </SettingsBottomSheet>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
