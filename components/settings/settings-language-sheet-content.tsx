"use client";

import styles from "@/components/settings/app-settings-menu.module.css";
import { playMenuAdjustSound } from "@/lib/settings/play-menu-sound";
import {
  getAppLanguage,
  setAppLanguage,
  type AppLanguage,
} from "@/lib/settings/language-preference";
import { useState } from "react";

export function SettingsLanguageSheetContent() {
  const [language, setLanguage] = useState<AppLanguage>(() => getAppLanguage());

  const selectLanguage = (next: AppLanguage) => {
    if (next === "en" || next === language) return;
    setAppLanguage(next);
    setLanguage(next);
    playMenuAdjustSound();
  };

  return (
    <div className={styles.sheetContent}>
      <div className={styles.languageList}>
        <button
          type="button"
          className={`${styles.languageOption} ${
            language === "ja" ? styles.languageOptionActive : ""
          }`}
          aria-current={language === "ja" ? "true" : undefined}
          onClick={() => selectLanguage("ja")}
        >
          <span>日本語</span>
          {language === "ja" ? (
            <span className={styles.languageOptionBadge}>選択中</span>
          ) : null}
        </button>
        <div
          className={`${styles.languageOption} ${styles.languageOptionDisabled}`}
          aria-disabled="true"
        >
          <span>English</span>
          <span className={styles.languageOptionBadgeMuted}>準備中</span>
        </div>
      </div>
    </div>
  );
}
