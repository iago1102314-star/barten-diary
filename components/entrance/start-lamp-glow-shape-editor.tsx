"use client";

import { LampGlowShapeEditor } from "@/components/entrance/lamp-glow-shape-editor";
import type { LampGlowShapeFields } from "@/lib/entrance/lamp-glow-types";
import {
  clearStartLampGlowOverrides,
  saveStartLampGlowOverrides,
} from "@/lib/entrance/start-lamp-glow-dev-overrides";
import { formatStartLampGlowsForCopy } from "@/lib/entrance/lamp-glow-format";
import {
  START_LAMP_GLOWS,
  type StartLampGlowConfig,
} from "@/lib/entrance/start-lamp-glows";

type StartLampGlowShapeEditorProps = {
  glows: StartLampGlowConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: Partial<LampGlowShapeFields>) => void;
};

/** 雨の路地ホーム — 光の大きさ・形・強さをライブ調整 */
export function StartLampGlowShapeEditor(props: StartLampGlowShapeEditorProps) {
  return (
    <LampGlowShapeEditor
      {...props}
      fileGlows={START_LAMP_GLOWS}
      targetFile="lib/entrance/start-lamp-glows.ts"
      targetConstant="START_LAMP_GLOWS"
      onCopySave={saveStartLampGlowOverrides}
      onClearOverrides={clearStartLampGlowOverrides}
      formatForCopy={formatStartLampGlowsForCopy}
    />
  );
}
