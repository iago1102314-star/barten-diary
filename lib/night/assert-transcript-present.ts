/** 日記生成へ渡す前の最低限チェック — 空文字のみ拒否（内容品質は判定しない） */
export function assertTranscriptPresentForGeneration(transcript: string): void {
  if (!transcript.trim()) {
    throw new Error("文字起こし結果が空でした。");
  }
}
