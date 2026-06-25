export type MemoShelfLoadPhase = "fetch" | "render" | "images";

export type MemoShelfLoadSample = {
  phase: MemoShelfLoadPhase;
  ms: number;
  detail?: string;
};

export type MemoShelfLoadProfile = {
  label: string;
  samples: MemoShelfLoadSample[];
  totalMs: number;
};

const profiles: MemoShelfLoadProfile[] = [];

export function recordMemoShelfLoadSample(
  label: string,
  sample: MemoShelfLoadSample,
): void {
  if (process.env.NODE_ENV === "production") return;

  let profile = profiles.find((entry) => entry.label === label);
  if (!profile) {
    profile = { label, samples: [], totalMs: 0 };
    profiles.push(profile);
  }

  profile.samples.push(sample);
  profile.totalMs = profile.samples.reduce((sum, item) => sum + item.ms, 0);
}

export function flushMemoShelfLoadProfile(label: string): MemoShelfLoadProfile | null {
  if (process.env.NODE_ENV === "production") return null;

  const profile = profiles.find((entry) => entry.label === label);
  if (!profile) return null;

  return profile;
}

export function clearMemoShelfLoadProfiles(): void {
  profiles.length = 0;
}
