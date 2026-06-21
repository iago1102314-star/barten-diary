import {
  getPastBottleDividerMetrics,
  MOOD_ORNAMENTAL_DIVIDER_TUNING,
  ornamentalDiamondPath,
} from "@/lib/entrance/mood-ornamental-divider-tuning";

type MoodOrnamentalDividerProps = {
  variant: "pastBottle" | "moodFooter";
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** 気分選択画面 — 装飾ライン SVG */
export function MoodOrnamentalDivider({
  variant,
  color = "currentColor",
  className,
  style,
}: MoodOrnamentalDividerProps) {
  const { viewBoxWidth, viewBoxHeight, centerY } = MOOD_ORNAMENTAL_DIVIDER_TUNING;

  const svgProps = {
    width: "100%" as const,
    height: viewBoxHeight,
    viewBox: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    className,
    style: { color, display: "block", ...style },
    "aria-hidden": true as const,
  };

  if (variant === "pastBottle") {
    const { viewBoxMinX, viewBoxWidth, lineStartX, lineEndX, strokeWidth, diamond } =
      getPastBottleDividerMetrics();
    return (
      <svg
        {...svgProps}
        viewBox={`${viewBoxMinX} 0 ${viewBoxWidth} ${viewBoxHeight}`}
      >
        <line
          x1={lineStartX}
          y1={centerY}
          x2={lineEndX}
          y2={centerY}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path
          d={ornamentalDiamondPath(
            diamond.centerX,
            centerY,
            diamond.halfWidth,
            diamond.halfHeight,
          )}
          fill="currentColor"
        />
      </svg>
    );
  }

  const { line, diamond } = MOOD_ORNAMENTAL_DIVIDER_TUNING.moodFooter;
  return (
    <svg {...svgProps}>
      <line
        x1={line.leftLineStartX}
        y1={centerY}
        x2={line.leftLineEndX}
        y2={centerY}
        stroke="currentColor"
        strokeWidth={line.strokeWidth}
      />
      <line
        x1={line.rightLineStartX}
        y1={centerY}
        x2={line.rightLineEndX}
        y2={centerY}
        stroke="currentColor"
        strokeWidth={line.strokeWidth}
      />
      <path
        d={ornamentalDiamondPath(
          diamond.centerX,
          centerY,
          diamond.halfWidth,
          diamond.halfHeight,
        )}
        fill="currentColor"
      />
    </svg>
  );
}
