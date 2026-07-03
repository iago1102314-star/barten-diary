"use client";

import styles from "@/components/settings/settings-legal-panel.module.css";
import { PRIVACY_POLICY } from "@/lib/legal/privacy-policy";
import { TERMS_OF_SERVICE } from "@/lib/legal/terms";
import type { LegalDocument } from "@/lib/legal/types";
import { playMenuTapSound } from "@/lib/settings/play-menu-sound";
import { useCallback, useId, useState } from "react";

type LegalTab = "terms" | "privacy";

const LEGAL_TABS: { id: LegalTab; label: string }[] = [
  { id: "terms", label: "利用規約" },
  { id: "privacy", label: "プライバシーポリシー" },
];

function LegalDocumentBody({ document }: { document: LegalDocument }) {
  return (
    <article className={styles.document}>
      <p className={styles.lastUpdated}>
        最終更新: {document.lastUpdated}
      </p>
      {document.sections.map((section) => (
        <section key={section.heading} className={styles.section}>
          <h3 className={styles.sectionHeading}>{section.heading}</h3>
          {section.paragraphs.map((paragraph, index) => (
            <p
              key={`${section.heading}-${index}`}
              className={styles.paragraph}
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

export function SettingsLegalPanel() {
  const [tab, setTab] = useState<LegalTab>("terms");
  const tablistId = useId();
  const termsPanelId = `${tablistId}-terms`;
  const privacyPanelId = `${tablistId}-privacy`;

  const handleTabChange = useCallback((next: LegalTab) => {
    if (next === tab) return;
    playMenuTapSound();
    setTab(next);
  }, [tab]);

  const activeDocument =
    tab === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY;
  const activePanelId = tab === "terms" ? termsPanelId : privacyPanelId;

  return (
    <div className={styles.legalPanel}>
      <h2 className={styles.title}>法的情報</h2>

      <div
        className={styles.tabList}
        role="tablist"
        aria-label="法的情報の種類"
      >
        {LEGAL_TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${tablistId}-${item.id}`}
              className={`${styles.tab} ${selected ? styles.tabActive : ""}`}
              aria-selected={selected}
              aria-controls={
                item.id === "terms" ? termsPanelId : privacyPanelId
              }
              tabIndex={selected ? 0 : -1}
              onClick={() => handleTabChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        key={tab}
        id={activePanelId}
        role="tabpanel"
        aria-labelledby={`${tablistId}-${tab}`}
        className={styles.body}
      >
        <LegalDocumentBody document={activeDocument} />
      </div>
    </div>
  );
}
