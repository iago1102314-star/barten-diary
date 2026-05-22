import {
  INJECTION_PATTERNS,
  OUTPUT_LEAK_PATTERNS,
  type InjectionPattern,
} from "@/lib/ai/security/injection-patterns";

export type InjectionHit = {
  pattern: InjectionPattern;
  excerpt: string;
};

function scanPatterns(
  text: string,
  patterns: InjectionPattern[],
): InjectionHit[] {
  const hits: InjectionHit[] = [];

  for (const pattern of patterns) {
    const match = text.match(pattern.pattern);
    if (match) {
      hits.push({
        pattern,
        excerpt: match[0].slice(0, 40),
      });
    }
  }

  return hits;
}

export function detectInjectionInTranscript(text: string): InjectionHit[] {
  return scanPatterns(text, INJECTION_PATTERNS);
}

export function detectLeakageInOutput(text: string): InjectionHit[] {
  return scanPatterns(text, OUTPUT_LEAK_PATTERNS);
}
