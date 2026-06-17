import type { CounterLampGlowConfig } from "@/lib/entrance/counter-lamp-glows";
import type { StartBokehLampGlowConfig } from "@/lib/entrance/start-bokeh-lamp-glows";
import type { StartLampGlowConfig } from "@/lib/entrance/start-lamp-glows";

function formatGlowEntry(
  glow: CounterLampGlowConfig | StartLampGlowConfig,
): string {
  const ratioLine = glow.ratio === 1 ? "" : `\n    ratio: ${glow.ratio},`;
  const colorLine = glow.colorRgb ? `\n    colorRgb: "${glow.colorRgb}",` : "";
  return `  {
    id: "${glow.id}",
    label: "${glow.label}",
    anchor: "${glow.anchor}",
    offsetX: ${glow.offsetX},
    offsetY: ${glow.offsetY},
    size: ${glow.size},${ratioLine}
    tone: "${glow.tone}",${colorLine}
    intensity: ${glow.intensity},
    speed: "${glow.speed}",
  }`;
}

export function formatLampGlowsForCopy(
  glows: CounterLampGlowConfig[],
): string {
  const lines = glows.map(formatGlowEntry);
  return `export const COUNTER_LAMP_GLOWS: CounterLampGlowConfig[] = [\n${lines.join(",\n")},\n];`;
}

export function formatStartLampGlowsForCopy(glows: StartLampGlowConfig[]): string {
  const lines = glows.map(formatGlowEntry);
  return `export const START_LAMP_GLOWS: StartLampGlowConfig[] = [\n${lines.join(",\n")},\n];`;
}

function formatBokehGlowEntry(glow: StartBokehLampGlowConfig): string {
  const ratioLine = glow.ratio === 1 ? "" : `\n    ratio: ${glow.ratio},`;
  const colorLine = glow.colorRgb ? `\n    colorRgb: "${glow.colorRgb}",` : "";
  return `  {
    id: "${glow.id}",
    label: "${glow.label}",
    offsetX: ${glow.offsetX},
    offsetY: ${glow.offsetY},
    size: ${glow.size},${ratioLine}
    tone: "${glow.tone}",${colorLine}
    intensity: ${glow.intensity},
  }`;
}

export function formatStartBokehLampGlowsForCopy(
  glows: StartBokehLampGlowConfig[],
): string {
  const lines = glows.map(formatBokehGlowEntry);
  return `export const START_BOKEH_LAMP_GLOWS: StartBokehLampGlowConfig[] = [\n${lines.join(",\n")},\n];`;
}

export function formatStartBokehOnlyLampGlowsForCopy(
  glows: StartBokehLampGlowConfig[],
): string {
  const lines = glows.map(formatBokehGlowEntry);
  return `export const START_BOKEH_ONLY_LAMP_GLOWS: StartBokehLampGlowConfig[] = [\n${lines.join(",\n")},\n];`;
}
