export function listenFailureMasterLines(count: number): string[] {
  if (count >= 2) {
    return ["……今日は言葉がまとまらない夜みたいだな。"];
  }

  return [
    "……悪い。",
    "少し聞き取りづらかった。",
    "もう少しだけ聞かせてくれないか。",
  ];
}

export function canLeaveWithoutRecord(count: number): boolean {
  return count >= 2;
}
