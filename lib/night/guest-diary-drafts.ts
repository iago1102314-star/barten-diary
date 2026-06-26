import type { DiaryListItem } from "@/components/diaries/diary-list";
import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import type { NightSavePayload } from "@/lib/night/night-pipeline-types";

export const GUEST_DIARY_DRAFTS_STORAGE_KEY = "barten-guest-diary-drafts";
const LEGACY_PENDING_STORAGE_KEY = "barten-pending-guest-diary";

export const GUEST_DIARY_LIST_ID_PREFIX = "guest:";

export type GuestDiaryDraft = {
  clientId: string;
  title: string;
  body: string;
  bottleTag: string;
  drinkName: string;
  drinkNote: string;
  masterComment: string;
  transcript: string;
  createdAt: string;
  continuedFromDiaryId: string | null;
  continuedFromBottleTag: string | null;
  /** ログイン後の保存が完了した Supabase id（重複保存防止） */
  savedDiaryId?: string;
};

export type GuestDiaryDraftInput = Omit<
  GuestDiaryDraft,
  "clientId" | "createdAt" | "savedDiaryId"
> & {
  clientId?: string;
  createdAt?: string;
};

const GUEST_DRAFTS_CHANGED_EVENT = "guest-diary-drafts-changed";

function isGuestDiaryDraft(value: unknown): value is GuestDiaryDraft {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<GuestDiaryDraft>;
  return (
    typeof record.clientId === "string" &&
    typeof record.title === "string" &&
    typeof record.body === "string" &&
    typeof record.bottleTag === "string" &&
    typeof record.drinkName === "string" &&
    typeof record.drinkNote === "string" &&
    typeof record.masterComment === "string" &&
    typeof record.transcript === "string" &&
    typeof record.createdAt === "string" &&
    (record.continuedFromDiaryId === null ||
      typeof record.continuedFromDiaryId === "string") &&
    (record.continuedFromBottleTag === null ||
      typeof record.continuedFromBottleTag === "string") &&
    (record.savedDiaryId === undefined ||
      typeof record.savedDiaryId === "string")
  );
}

function notifyGuestDiaryDraftsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GUEST_DRAFTS_CHANGED_EVENT));
}

function writeGuestDiaryDrafts(drafts: GuestDiaryDraft[]): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      GUEST_DIARY_DRAFTS_STORAGE_KEY,
      JSON.stringify(drafts),
    );
    notifyGuestDiaryDraftsChanged();
  } catch {
    // quota / private mode
  }
}

function migrateLegacyPendingDraft(drafts: GuestDiaryDraft[]): GuestDiaryDraft[] {
  if (typeof window === "undefined") return drafts;

  try {
    const raw = window.sessionStorage.getItem(LEGACY_PENDING_STORAGE_KEY);
    if (!raw) return drafts;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      window.sessionStorage.removeItem(LEGACY_PENDING_STORAGE_KEY);
      return drafts;
    }

    const legacy = parsed as Partial<
      NightSavePayload & { createdAt?: string }
    >;
    if (
      typeof legacy.bottleTag !== "string" ||
      typeof legacy.diary !== "string" ||
      typeof legacy.transcript !== "string"
    ) {
      window.sessionStorage.removeItem(LEGACY_PENDING_STORAGE_KEY);
      return drafts;
    }

    const drinkName = parseBottleTag(legacy.bottleTag).drinkName;
    const migrated: GuestDiaryDraft = {
      clientId: crypto.randomUUID(),
      title: legacy.bottleTag,
      body: legacy.diary,
      bottleTag: legacy.bottleTag,
      drinkName,
      drinkNote: legacy.drinkNote ?? "",
      masterComment: legacy.masterComment ?? "",
      transcript: legacy.transcript,
      createdAt: legacy.createdAt ?? new Date().toISOString(),
      continuedFromDiaryId: legacy.continuedFromDiaryId ?? null,
      continuedFromBottleTag: legacy.continuedFromBottleTag ?? null,
    };

    window.sessionStorage.removeItem(LEGACY_PENDING_STORAGE_KEY);
    return [migrated, ...drafts];
  } catch {
    return drafts;
  }
}

export function readGuestDiaryDrafts(): GuestDiaryDraft[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(GUEST_DIARY_DRAFTS_STORAGE_KEY);
    if (!raw) {
      return migrateLegacyPendingDraft([]);
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return migrateLegacyPendingDraft([]);
    }

    const drafts = parsed.filter(isGuestDiaryDraft);
    const migrated = migrateLegacyPendingDraft(drafts);
    if (migrated.length !== drafts.length) {
      writeGuestDiaryDrafts(migrated);
    }
    return sortGuestDiaryDraftsNewestFirst(migrated);
  } catch {
    return [];
  }
}

function sortGuestDiaryDraftsNewestFirst(
  drafts: GuestDiaryDraft[],
): GuestDiaryDraft[] {
  return [...drafts].sort((a, b) => {
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function readGuestDiaryDraftsForFlush(): GuestDiaryDraft[] {
  return [...readGuestDiaryDrafts()]
    .filter((draft) => !draft.savedDiaryId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function subscribeGuestDiaryDrafts(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(GUEST_DRAFTS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(GUEST_DRAFTS_CHANGED_EVENT, listener);
}

export function guestDiaryClientIdToListId(clientId: string): string {
  return `${GUEST_DIARY_LIST_ID_PREFIX}${clientId}`;
}

export function isGuestDiaryListId(id: string): boolean {
  return id.startsWith(GUEST_DIARY_LIST_ID_PREFIX);
}

export function guestListIdToClientId(id: string): string | null {
  if (!isGuestDiaryListId(id)) return null;
  return id.slice(GUEST_DIARY_LIST_ID_PREFIX.length);
}

export function guestDraftToDiaryListItem(draft: GuestDiaryDraft): DiaryListItem {
  return {
    id: guestDiaryClientIdToListId(draft.clientId),
    title: draft.bottleTag,
    body: draft.body,
    drink_note: draft.drinkNote || null,
    transcript: draft.transcript,
    master_comment: draft.masterComment,
    created_at: draft.createdAt,
  };
}

export function listGuestDiaryDraftsAsListItems(): DiaryListItem[] {
  return readGuestDiaryDrafts()
    .filter((draft) => !draft.savedDiaryId)
    .map(guestDraftToDiaryListItem);
}

export function guestDraftToSavePayload(
  draft: GuestDiaryDraft,
): NightSavePayload {
  return {
    bottleTag: draft.bottleTag,
    diary: draft.body,
    drinkNote: draft.drinkNote,
    masterComment: draft.masterComment,
    transcript: draft.transcript,
    continuedFromDiaryId: draft.continuedFromDiaryId,
    continuedFromBottleTag: draft.continuedFromBottleTag,
    createdAt: draft.createdAt,
  };
}

export function buildGuestDiaryDraftFromNightSave(
  payload: NightSavePayload,
): GuestDiaryDraftInput {
  const drinkName = parseBottleTag(payload.bottleTag).drinkName;
  return {
    title: payload.bottleTag,
    body: payload.diary,
    bottleTag: payload.bottleTag,
    drinkName,
    drinkNote: payload.drinkNote,
    masterComment: payload.masterComment,
    transcript: payload.transcript,
    continuedFromDiaryId: payload.continuedFromDiaryId,
    continuedFromBottleTag: payload.continuedFromBottleTag,
  };
}

/** 未ログイン生成完了 — 既存と同じ transcript は追加しない */
export function addGuestDiaryDraft(input: GuestDiaryDraftInput): GuestDiaryDraft {
  const drafts = readGuestDiaryDrafts();
  const duplicate = drafts.find(
    (draft) =>
      draft.transcript === input.transcript && draft.bottleTag === input.bottleTag,
  );
  if (duplicate) {
    return duplicate;
  }

  const draft: GuestDiaryDraft = {
    clientId: input.clientId ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    title: input.title,
    body: input.body,
    bottleTag: input.bottleTag,
    drinkName: input.drinkName,
    drinkNote: input.drinkNote,
    masterComment: input.masterComment,
    transcript: input.transcript,
    continuedFromDiaryId: input.continuedFromDiaryId,
    continuedFromBottleTag: input.continuedFromBottleTag,
  };

  writeGuestDiaryDrafts([...drafts, draft]);
  return draft;
}

export function markGuestDiaryDraftSaved(
  clientId: string,
  savedDiaryId: string,
): void {
  const drafts = readGuestDiaryDrafts();
  const next = drafts.map((draft) =>
    draft.clientId === clientId ? { ...draft, savedDiaryId } : draft,
  );
  writeGuestDiaryDrafts(next);
}

export function updateGuestDiaryDraftBody(clientId: string, body: string): void {
  const drafts = readGuestDiaryDrafts();
  const next = drafts.map((draft) =>
    draft.clientId === clientId ? { ...draft, body } : draft,
  );
  if (next.every((draft, index) => draft.body === drafts[index]?.body)) return;
  writeGuestDiaryDrafts(next);
}

export function removeGuestDiaryDraft(clientId: string): void {
  const drafts = readGuestDiaryDrafts();
  const next = drafts.filter((draft) => draft.clientId !== clientId);
  if (next.length === drafts.length) return;
  writeGuestDiaryDrafts(next);
}

export function removeGuestDiaryDraftByTranscript(transcript: string): void {
  const drafts = readGuestDiaryDrafts();
  const next = drafts.filter((draft) => draft.transcript !== transcript);
  if (next.length === drafts.length) return;
  writeGuestDiaryDrafts(next);
}

export function clearGuestDiaryDrafts(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(GUEST_DIARY_DRAFTS_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_PENDING_STORAGE_KEY);
    notifyGuestDiaryDraftsChanged();
  } catch {
    // ignore
  }
}

export function hasGuestDiaryDrafts(): boolean {
  return listGuestDiaryDraftsAsListItems().length > 0;
}

export function findGuestDiaryDraftByListId(
  listId: string,
): GuestDiaryDraft | null {
  const clientId = guestListIdToClientId(listId);
  if (!clientId) return null;
  return readGuestDiaryDrafts().find((draft) => draft.clientId === clientId) ?? null;
}
