const COUNTER_FAREWELL_LINES = [
  "……話してくれてありがとう。",
  "……今夜も預かっておく。",
] as const;

export function pickCounterFarewellLine(): string {
  const index = Math.floor(Math.random() * COUNTER_FAREWELL_LINES.length);
  return COUNTER_FAREWELL_LINES[index] ?? COUNTER_FAREWELL_LINES[0];
}
