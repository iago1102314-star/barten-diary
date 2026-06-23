/** 日記 PNG 保存 — `barten-diary-YYYY-MM-DD.png` */
export function formatDiaryExportFilename(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "barten-diary.png";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `barten-diary-${year}-${month}-${day}.png`;
}
