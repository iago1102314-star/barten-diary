import { tokenizeDiaryDateLine } from "@/lib/diary-paper/diary-date-line";

type DiaryDateLineProps = {
  dateLine: string;
  className?: string;
  slashClassName?: string;
  handwritingClassName?: string;
};

export function DiaryDateLine({
  dateLine,
  className,
  slashClassName,
  handwritingClassName,
}: DiaryDateLineProps) {
  const tokens = tokenizeDiaryDateLine(dateLine);

  return (
    <p className={className}>
      {tokens.map((token, index) => {
        if (token.kind === "handwriting") {
          return (
            <span key={index} className={handwritingClassName}>
              {token.text}
            </span>
          );
        }

        if (token.kind === "slash") {
          return (
            <span key={index} className={slashClassName}>
              {token.text}
            </span>
          );
        }

        return <span key={index}>{token.text}</span>;
      })}
    </p>
  );
}
