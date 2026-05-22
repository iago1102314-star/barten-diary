type DeclineNightLinkProps = {
  onDecline: () => void;
  disabled?: boolean;
};

/** 夜が始まる前だけ — 路地へ戻る逃げ道 */
export function DeclineNightLink({
  onDecline,
  disabled = false,
}: DeclineNightLinkProps) {
  return (
    <button
      type="button"
      onClick={onDecline}
      disabled={disabled}
      className="mx-auto block py-2 text-[11px] tracking-[0.16em] text-stone-600/85 transition-colors hover:text-stone-500/90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      また今度にする
    </button>
  );
}
