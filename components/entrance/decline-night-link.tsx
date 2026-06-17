import {
  declineLinkTextStyle,
  DECLINE_NIGHT_LINK_TUNING,
} from "@/lib/entrance/decline-night-link-tuning";

type DeclineNightLinkProps = {
  onDecline: () => void;
  disabled?: boolean;
};

/** 夜が始まる前だけ — 路地へ戻る逃げ道 */
export function DeclineNightLink({
  onDecline,
  disabled = false,
}: DeclineNightLinkProps) {
  const { text, back } = DECLINE_NIGHT_LINK_TUNING;
  const textStyle = declineLinkTextStyle(text);

  return (
    <button
      type="button"
      onClick={onDecline}
      disabled={disabled}
      className="group mx-auto flex items-center justify-center py-2 font-serif-jp transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      style={{ gap: back.gapPx }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={back.sizePx}
        height={back.sizePx}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 transition-opacity duration-500"
        style={{
          color: text.color,
          opacity: back.opacity,
          transform: `translate(${back.offsetXpx}px, ${back.offsetYpx}px)`,
        }}
        aria-hidden
      >
        <path d="M6 8L2 12L6 16" />
        <path d="M2 12H22" />
      </svg>
      <span
        className="group-hover:opacity-90"
        style={textStyle}
      >
        また今度にする
      </span>
    </button>
  );
}
