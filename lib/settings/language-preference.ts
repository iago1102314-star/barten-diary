export type AppLanguage = "ja" | "en";

const STORAGE_KEY = "barten-language";

export function getAppLanguage(): AppLanguage {
  if (typeof window === "undefined") return "ja";

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "en" ? "en" : "ja";
  } catch {
    return "ja";
  }
}

export function setAppLanguage(language: AppLanguage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, language);
}
