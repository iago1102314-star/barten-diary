"use client";

import { LampGlowPositionEditor } from "@/components/entrance/lamp-glow-position-editor";
import {
  START_BOKEH_BACKGROUND_OPACITY,
  type StartBokehLampGlowConfig,
} from "@/lib/entrance/start-bokeh-lamp-glows";

type StartBokehOnlyLampGlowPositionEditorProps = {
  glows: StartBokehLampGlowConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
  onMove: (id: string, offsetX: number, offsetY: number) => void;
  backgroundOpacity: number;
  onBackgroundOpacityChange: (value: number) => void;
};

/** ボケ専用光 — 赤点位置調整（定常には存在しない 15 点） */
export function StartBokehOnlyLampGlowPositionEditor({
  backgroundOpacity,
  onBackgroundOpacityChange,
  ...props
}: StartBokehOnlyLampGlowPositionEditorProps) {
  return (
    <LampGlowPositionEditor
      {...props}
      targetFile="start-bokeh-lamp-glows.ts → START_BOKEH_ONLY_LAMP_GLOWS の offsetX/Y"
      backgroundOpacity={backgroundOpacity}
      onBackgroundOpacityChange={onBackgroundOpacityChange}
      backgroundOpacityConstant="START_BOKEH_BACKGROUND_OPACITY"
      backgroundOpacityFileValue={START_BOKEH_BACKGROUND_OPACITY}
    />
  );
}
