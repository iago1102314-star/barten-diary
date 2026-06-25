"use client";

import styles from "@/components/settings/app-settings-menu.module.css";
import {
  SettingsCloseIcon,
  SettingsCommentIcon,
  SettingsHamburgerIcon,
  SettingsInformationIcon,
  SettingsOptionIcon,
  SettingsRuleIcon,
  SettingsSoundIcon,
} from "@/components/settings/settings-menu-icons";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import { EASE_SOFT } from "@/lib/entrance/motion-presets";
import {
  getAudioPreferences,
  setAudioPreferences,
  subscribeAudioPreferences,
  type AudioPreferences,
} from "@/lib/settings/audio-preferences";
import {
  getAppLanguage,
  setAppLanguage,
  type AppLanguage,
} from "@/lib/settings/language-preference";
import { useSettingsMenuVisibility } from "@/lib/settings/settings-menu-visibility";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

type SettingsPanel =
  | "main"
  | "sound"
  | "feedback"
  | "settings"
  | "terms"
  | "about";

type MenuItem = {
  id: SettingsPanel;
  label: string;
  sub?: string;
  icon: typeof SettingsSoundIcon;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "sound", label: "サウンド", icon: SettingsSoundIcon },
  {
    id: "feedback",
    label: "フィードバック",
    sub: "感想、不具合を送る",
    icon: SettingsCommentIcon,
  },
  { id: "settings", label: "設定", icon: SettingsOptionIcon },
  { id: "terms", label: "利用規約", icon: SettingsRuleIcon },
  { id: "about", label: "このアプリについて", icon: SettingsInformationIcon },
];

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function SoundPanel() {
  const [prefs, setPrefs] = useState<AudioPreferences>(() => getAudioPreferences());

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
    <div>
      <h2 className={styles.subPanelTitle}>サウンド</h2>
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
          onChange={(event) =>
            updateBgm(Number.parseInt(event.target.value, 10) / 100)
          }
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
          onChange={(event) =>
            updateSe(Number.parseInt(event.target.value, 10) / 100)
          }
        />
      </div>
    </div>
  );
}

function LanguagePanel() {
  const [language, setLanguage] = useState<AppLanguage>(() => getAppLanguage());

  const selectLanguage = (next: AppLanguage) => {
    setLanguage(next);
    setAppLanguage(next);
  };

  return (
    <div>
      <h2 className={styles.subPanelTitle}>設定</h2>
      <div className={styles.languageList}>
        <button
          type="button"
          className={`${styles.languageOption} ${
            language === "ja" ? styles.languageOptionActive : ""
          }`}
          onClick={() => selectLanguage("ja")}
        >
          <span>日本語</span>
          <span>{language === "ja" ? "選択中" : ""}</span>
        </button>
        <button
          type="button"
          className={`${styles.languageOption} ${
            language === "en" ? styles.languageOptionActive : ""
          }`}
          onClick={() => selectLanguage("en")}
        >
          <span>English</span>
          <span>{language === "en" ? "選択中" : ""}</span>
        </button>
      </div>
    </div>
  );
}

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
    case "sound":
      return <SoundPanel />;
    case "settings":
      return <LanguagePanel />;
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
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<SettingsPanel>("main");

  const closeAll = useCallback(() => {
    setOpen(false);
    setPanel("main");
  }, []);

  const handleClose = useCallback(() => {
    if (panel === "main") {
      closeAll();
      return;
    }
    setPanel("main");
  }, [closeAll, panel]);

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

  return (
    <>
      {!open ? (
        <button
          type="button"
          className={styles.fab}
          aria-label="メニューを開く"
          onClick={() => setOpen(true)}
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
              className={styles.panel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE_SOFT }}
            >
              <div className={styles.panelHeader}>
                <button
                  type="button"
                  className={styles.closeButton}
                  aria-label={panel === "main" ? "メニューを閉じる" : "戻る"}
                  onClick={handleClose}
                >
                  <SettingsCloseIcon className={styles.closeIcon} />
                </button>
              </div>

              <div className={styles.panelBody}>
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
                              onClick={() => setPanel(item.id)}
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
