"use client";

import { LampGlowPositionEditor } from "@/components/entrance/lamp-glow-position-editor";
import type { StartLampGlowConfig } from "@/lib/entrance/start-lamp-glows";

type StartLampGlowPositionEditorProps = {
  glows: StartLampGlowConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
  onMove: (id: string, offsetX: number, offsetY: number) => void;
};

/** 雨の路地ホーム — 赤点位置調整 */
export function StartLampGlowPositionEditor(
  props: StartLampGlowPositionEditorProps,
) {
  return (
    <LampGlowPositionEditor
      {...props}
      targetFile="start-lamp-glows.ts → START_LAMP_GLOWS の offsetX/Y"
    />
  );
}
