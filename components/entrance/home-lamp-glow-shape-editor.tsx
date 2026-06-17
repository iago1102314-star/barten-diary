"use client";

import { LampGlowShapeEditor } from "@/components/entrance/lamp-glow-shape-editor";
import {
  clearLampGlowOverrides,
  saveLampGlowOverrides,
  type LampGlowShapeFields,
} from "@/lib/entrance/lamp-glow-dev-overrides";
import {
  COUNTER_LAMP_GLOWS,
  type CounterLampGlowConfig,
} from "@/lib/entrance/counter-lamp-glows";
import { formatLampGlowsForCopy } from "@/lib/entrance/lamp-glow-format";

type HomeLampGlowShapeEditorProps = {
  glows: CounterLampGlowConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: Partial<LampGlowShapeFields>) => void;
};

/** カウンター店内 — 光の大きさ・形・強さをライブ調整 */
export function HomeLampGlowShapeEditor(props: HomeLampGlowShapeEditorProps) {
  return (
    <LampGlowShapeEditor
      {...props}
      fileGlows={COUNTER_LAMP_GLOWS}
      targetFile="lib/entrance/counter-lamp-glows.ts"
      targetConstant="COUNTER_LAMP_GLOWS"
      onCopySave={saveLampGlowOverrides}
      onClearOverrides={clearLampGlowOverrides}
      formatForCopy={formatLampGlowsForCopy}
    />
  );
}
