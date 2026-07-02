"use client";

import { DiaryExportNoticePanel } from "@/components/diary-paper/diary-export-notice";
import { DiaryPaperExportHost } from "@/components/diary-paper/diary-paper-export-host";
import { DiaryPaper } from "@/components/diary-paper/diary-paper";
import paperStyles from "@/components/diary-paper/diary-paper.module.css";
import screenStyles from "@/components/diary-paper/diary-paper-screen.module.css";
import { MemoShelfRecordBottomBar } from "@/components/memories/memo-shelf-detail-bar";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import { useDiaryBodyEdit } from "@/hooks/use-diary-body-edit";
import { useDiaryDelete } from "@/hooks/use-diary-delete";
import { useGuestDiaryBodyEdit } from "@/hooks/use-guest-diary-body-edit";
import { useDiaryPaperExport } from "@/hooks/use-diary-paper-export";
import { useShelfOutsideAmbience } from "@/hooks/use-shelf-outside-ambience";
import type { DiaryListRow } from "@/lib/diaries/fetch-diaries";
import { mapDiaryListRowToDiaryPaper } from "@/lib/diary-paper/map-diary-to-paper";
import {
  guestListIdToClientId,
  isGuestDiaryListId,
} from "@/lib/night/guest-diary-drafts";
import { useSettingsMenuHidden } from "@/lib/settings/settings-menu-visibility";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

type MemoDetailPanelProps = {
  diary: DiaryListRow;
  onPersisted?: () => void;
  layout?: "embedded" | "screen";
  backHref?: string;
  backLabel?: string;
  exportRef?: RefObject<HTMLDivElement | null>;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const DISCARD_EDIT_CONFIRM_MESSAGE = "変更を破棄しますか？";

export function MemoDetailPanel({
  layout = "embedded",
  ...props
}: MemoDetailPanelProps) {
  if (layout === "screen") {
    return <MemoDetailPanelScreen {...props} />;
  }

  return <MemoDetailPanelEmbedded {...props} />;
}

function useDetailEditing(
  editingProp: boolean | undefined,
  onEditingChange: ((editing: boolean) => void) | undefined,
) {
  const [internalEditing, setInternalEditing] = useState(false);
  const editingControlled = editingProp !== undefined;
  const editing = editingControlled ? editingProp : internalEditing;
  const setEditing = useCallback(
    (next: boolean) => {
      if (editingControlled) {
        onEditingChange?.(next);
        return;
      }
      setInternalEditing(next);
    },
    [editingControlled, onEditingChange],
  );

  return { editing, setEditing };
}

function useMemoDetailBodyEdit({
  diary,
  editing,
  setEditing,
  onPersisted,
  onDirtyChange,
}: {
  diary: DiaryListRow;
  editing: boolean;
  setEditing: (next: boolean) => void;
  onPersisted?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const isGuest = isGuestDiaryListId(diary.id);
  const guestClientId = guestListIdToClientId(diary.id) ?? "";

  const handleSaved = useCallback(() => {
    setEditing(false);
    onPersisted?.();
  }, [onPersisted, setEditing]);

  const serverBodyEdit = useDiaryBodyEdit({
    diaryId: isGuest ? "" : diary.id,
    initialBody: diary.body,
    onSaved: isGuest ? undefined : handleSaved,
  });

  const guestBodyEdit = useGuestDiaryBodyEdit({
    clientId: guestClientId,
    initialBody: diary.body,
    onSaved: isGuest ? handleSaved : undefined,
  });

  const bodyEdit = isGuest ? guestBodyEdit : serverBodyEdit;

  useEffect(() => {
    if (editing) return;
    bodyEdit.resetDraft();
  }, [editing, bodyEdit.resetDraft]);

  useEffect(() => {
    onDirtyChange?.(editing && bodyEdit.dirty);
  }, [editing, bodyEdit.dirty, onDirtyChange]);

  const handleCancelEdit = useCallback(() => {
    bodyEdit.resetDraft();
    setEditing(false);
  }, [bodyEdit.resetDraft, setEditing]);

  const bodyEditProps = useMemo(
    () =>
      editing
        ? {
            diaryId: diary.id,
            value: bodyEdit.draftBody,
            onChange: bodyEdit.setDraftBody,
            onCancel: handleCancelEdit,
            formAction: bodyEdit.formAction,
            error: bodyEdit.error,
          }
        : undefined,
    [
      bodyEdit.draftBody,
      bodyEdit.error,
      bodyEdit.formAction,
      bodyEdit.setDraftBody,
      diary.id,
      editing,
      handleCancelEdit,
    ],
  );

  return {
    bodyEditProps,
    saveNotice: bodyEdit.saveNotice,
    dismissSaveNotice: bodyEdit.dismissSaveNotice,
    dirty: bodyEdit.dirty,
    resetDraft: bodyEdit.resetDraft,
    handleCancelEdit,
  };
}

function MemoDetailPanelEmbedded({
  diary,
  onPersisted,
  exportRef: exportRefProp,
  editing: editingProp,
  onEditingChange,
  onDirtyChange,
}: Omit<MemoDetailPanelProps, "layout" | "backHref" | "backLabel">) {
  const internalExportRef = useRef<HTMLDivElement>(null);
  const exportRef = exportRefProp ?? internalExportRef;
  const { editing, setEditing } = useDetailEditing(editingProp, onEditingChange);
  const paperData = useMemo(() => mapDiaryListRowToDiaryPaper(diary), [diary]);
  const { bodyEditProps, saveNotice, dismissSaveNotice } = useMemoDetailBodyEdit({
    diary,
    editing,
    setEditing,
    onPersisted,
    onDirtyChange,
  });

  return (
    <>
      <DiaryPaperExportHost ref={exportRef} className={styles.detailPaperExportHost}>
        <DiaryPaper
          data={paperData}
          className={paperStyles.paperFullscreen}
          stretchToViewport
          bodyEdit={bodyEditProps}
        />
      </DiaryPaperExportHost>
      <DiaryExportNoticePanel
        notice={saveNotice}
        onDismiss={dismissSaveNotice}
      />
    </>
  );
}

function MemoDetailPanelScreen({
  diary,
  onPersisted,
  backHref = "/memories",
  backLabel = "一覧に戻る",
  editing: editingProp,
  onEditingChange,
  onDirtyChange,
}: Omit<MemoDetailPanelProps, "layout" | "exportRef">) {
  useShelfOutsideAmbience();
  const router = useRouter();
  const exportRef = useRef<HTMLDivElement>(null);
  const { editing, setEditing } = useDetailEditing(editingProp, onEditingChange);
  const paperData = useMemo(() => mapDiaryListRowToDiaryPaper(diary), [diary]);
  const {
    bodyEditProps,
    saveNotice,
    dismissSaveNotice,
    dirty,
    resetDraft,
  } = useMemoDetailBodyEdit({
    diary,
    editing,
    setEditing,
    onPersisted,
    onDirtyChange,
  });
  const diaryExport = useDiaryPaperExport({
    captureRef: exportRef,
    createdAt: diary.created_at,
  });
  const diaryDelete = useDiaryDelete({
    diaryId: diary.id,
    onDeleted: () => {
      router.push(backHref);
    },
  });

  useSettingsMenuHidden("diary-detail", true);

  const handleBack = useCallback(() => {
    if (editing && dirty) {
      if (!window.confirm(DISCARD_EDIT_CONFIRM_MESSAGE)) return;
      resetDraft();
      setEditing(false);
    }
    router.push(backHref);
  }, [backHref, dirty, editing, resetDraft, router, setEditing]);

  return (
    <>
      <div className={screenStyles.screen}>
        <div className={screenStyles.body} data-diary-paper-scroll>
          <DiaryPaperExportHost
            ref={exportRef}
            className={styles.detailPaperExportHost}
          >
            <DiaryPaper
              data={paperData}
              className={paperStyles.paperFullscreen}
              stretchToViewport
              bodyEdit={bodyEditProps}
            />
          </DiaryPaperExportHost>
        </div>
        <MemoShelfRecordBottomBar
          backLabel={backLabel}
          onBack={handleBack}
          detailActions={
            !editing
              ? {
                  onEdit: () => setEditing(true),
                    onShare: diaryExport.exportDiary,
                    shareDisabled: diaryExport.exporting || diaryDelete.deleting,
                    onDelete: diaryDelete.deleteDiary,
                    deleteDisabled: diaryDelete.deleting || diaryExport.exporting,
                }
              : undefined
          }
        />
      </div>
      <DiaryExportNoticePanel
        notice={diaryExport.notice}
        onDismiss={diaryExport.dismissNotice}
      />
      <DiaryExportNoticePanel
        notice={saveNotice}
        onDismiss={dismissSaveNotice}
      />
      <DiaryExportNoticePanel
        notice={diaryDelete.notice}
        onDismiss={diaryDelete.dismissNotice}
      />
    </>
  );
}
