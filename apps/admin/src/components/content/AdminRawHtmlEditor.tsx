import { RawHtmlFrame } from "@repo/content/raw-html-frame";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AdminButton } from "../admin/AdminButton";
import {
  adminContentAssetBaseUrl,
  type ContentEntity,
} from "../../lib/contentAssetStorage";
import {
  rotateRawAssetScope,
  tiptapDocumentHasImage,
  type ManagedContentFormValue,
} from "../../lib/managedContent";
import { supabaseConfig } from "../../lib/supabase";
import type { AdminChoiceRequest } from "./AdminChoiceDialog";
import {
  AdminRawAssetPanel,
  type RawAssetCopyMessage,
} from "./AdminRawAssetPanel";
import {
  isSupportedHtmlSourceFile,
  rawHtmlContainsBaseElement,
} from "./rawAssetReview";
import {
  useRawAssetLifecycle,
  type RawAssetCleanupIssue,
  type RawPendingAssetWork,
} from "./useRawAssetLifecycle";
import styles from "./AdminContentEditor.module.css";

type PreviewSnapshot = {
  readonly assetBaseUrl: string | undefined;
  readonly documentKey: string;
  readonly html: string;
};

type LoadedSourceFile = {
  readonly name: string;
  readonly size: number;
};

export type AdminRawHtmlEditorProps = {
  readonly busy: boolean;
  readonly contentAssetScope: string;
  readonly disabled: boolean;
  readonly documentKey: string;
  readonly editorGeneration: string;
  readonly entity: ContentEntity;
  readonly onChange: (value: ManagedContentFormValue) => void;
  readonly onOrphanCleanupIssue: (issue: RawAssetCleanupIssue) => void;
  readonly onPendingAssetWorkChange: (event: RawPendingAssetWork) => void;
  readonly openDialog: (request: AdminChoiceRequest) => void;
  readonly value: ManagedContentFormValue;
};

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KiB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MiB`;
}

export function AdminRawHtmlEditor({
  busy,
  contentAssetScope,
  disabled,
  documentKey,
  editorGeneration,
  entity,
  onChange,
  onOrphanCleanupIssue,
  onPendingAssetWorkChange,
  openDialog,
  value,
}: AdminRawHtmlEditorProps) {
  const activeGenerationRef = useRef(editorGeneration);
  activeGenerationRef.current = editorGeneration;
  const mountedRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [sourceFileError, setSourceFileError] = useState<string | null>(null);
  const [loadedSourceFile, setLoadedSourceFile] =
    useState<LoadedSourceFile | null>(null);
  const [copyMessage, setCopyMessage] = useState<RawAssetCopyMessage | null>(
    null,
  );

  const commitValue = (nextValue: ManagedContentFormValue) => {
    onChangeRef.current(nextValue);
  };

  const {
    addFiles,
    assetError,
    assets,
    hasPendingWork,
    pendingCount,
    removeAsset,
    requestUploads,
    setRelativePath,
  } = useRawAssetLifecycle({
    contentAssetBaseEnabled: value.contentAssetBaseEnabled,
    contentAssetScope,
    disabled,
    editorGeneration,
    entity,
    onEnableAssetBase: () =>
      commitValue({
        ...valueRef.current,
        contentAssetBaseEnabled: true,
      }),
    onOrphanCleanupIssue,
    onPendingAssetWorkChange,
    openDialog,
  });

  const assetBaseUrl = useMemo(() => {
    try {
      return adminContentAssetBaseUrl(
        supabaseConfig,
        entity,
        contentAssetScope,
      );
    } catch {
      return undefined;
    }
  }, [contentAssetScope, entity]);
  const effectiveAssetBaseUrl = value.contentAssetBaseEnabled
    ? assetBaseUrl
    : undefined;
  const effectiveAssetBaseUrlRef = useRef(effectiveAssetBaseUrl);
  effectiveAssetBaseUrlRef.current = effectiveAssetBaseUrl;
  const [previewSnapshot, setPreviewSnapshot] = useState<PreviewSnapshot>(
    () => ({
      assetBaseUrl: effectiveAssetBaseUrl,
      documentKey,
      html: value.content,
    }),
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCopyMessage(null);
  }, [editorGeneration]);

  useEffect(() => {
    setPreviewSnapshot({
      assetBaseUrl: effectiveAssetBaseUrlRef.current,
      documentKey,
      html: valueRef.current.content,
    });
    setLoadedSourceFile(null);
    setSourceFileError(null);
  }, [documentKey]);

  const applyLoadedSource = (
    source: string,
    file: File,
    generation: string,
  ) => {
    if (activeGenerationRef.current !== generation) return;
    commitValue({ ...valueRef.current, content: source });
    setLoadedSourceFile({ name: file.name, size: file.size });
    setSourceFileError(null);
  };

  const onSourceFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!isSupportedHtmlSourceFile(file)) {
      setSourceFileError("HTML 또는 HTM 파일만 불러올 수 있습니다.");
      return;
    }

    const generation = editorGeneration;
    setSourceFileError(null);
    let source: string;
    try {
      source = await file.text();
    } catch {
      if (activeGenerationRef.current === generation) {
        setSourceFileError("HTML 파일을 읽지 못했습니다. 다시 선택해 주세요.");
      }
      return;
    }
    if (!mountedRef.current || activeGenerationRef.current !== generation)
      return;

    if (valueRef.current.content.length === 0) {
      applyLoadedSource(source, file, generation);
      return;
    }
    openDialog({
      choices: [
        {
          description: "현재 편집 중인 원문을 불러온 파일 내용으로 교체합니다.",
          id: "overwrite",
          label: "불러온 파일로 덮어쓰기",
          tone: "danger",
        },
        {
          description: "현재 원문을 그대로 유지하고 파일을 적용하지 않습니다.",
          id: "keep_current",
          label: "현재 원문 유지",
        },
      ],
      description:
        "현재 HTML 원문이 비어 있지 않습니다. 덮어쓰면 편집 중인 내용이 교체됩니다.",
      onSelect: (choiceId) => {
        if (choiceId === "overwrite") {
          applyLoadedSource(source, file, generation);
        }
      },
      title: "HTML 원문 덮어쓰기",
    });
  };

  const requestScopeRotation = () => {
    if (disabled || busy || pendingCount > 0) return;
    const hasInactiveWysiwygImages = tiptapDocumentHasImage(
      valueRef.current.contentJson,
    );
    openDialog({
      choices: [
        {
          description: hasInactiveWysiwygImages
            ? "이전 WYSIWYG 이미지 초안을 빈 문서로 교체하고 새 UUID scope를 사용합니다. 모든 상대경로 asset을 다시 올려야 합니다."
            : "HTML 원문은 유지하고 새 UUID scope를 사용합니다. 모든 상대경로 asset을 다시 올려야 합니다.",
          id: "rotate",
          label: hasInactiveWysiwygImages
            ? "이전 WYSIWYG 이미지 초안을 폐기하고 새 asset 버전 생성"
            : "새 asset 버전 생성",
          tone: "danger",
        },
        {
          description: "현재 scope와 업로드된 asset을 그대로 유지합니다.",
          id: "keep_scope",
          label: "현재 asset 버전 유지",
        },
      ],
      description: hasInactiveWysiwygImages
        ? "현재 raw 원문은 유지되지만 이전 WYSIWYG 이미지 문서는 폐기됩니다. 원문이 참조하는 전체 상대경로 파일을 새 scope에 다시 업로드했는지 직접 확인해 주세요."
        : "자동으로 asset 목록을 추측하지 않습니다. 원문이 참조하는 전체 상대경로 파일을 새 scope에 다시 업로드했는지 직접 확인해 주세요.",
      onSelect: (choiceId) => {
        if (choiceId !== "rotate" || busy || hasPendingWork()) return;
        const current = valueRef.current;
        const rotated = rotateRawAssetScope(current, {
          discardInactiveWysiwygImages: hasInactiveWysiwygImages,
          nextAssetScope: crypto.randomUUID().toLowerCase(),
        });
        if (rotated) commitValue(rotated);
      },
      title: "새 asset 버전 만들기",
    });
  };

  const requestBackupRestore = () => {
    if (disabled || busy || value.contentSourceBackup === null) return;
    openDialog({
      choices: [
        {
          description:
            "현재 원문을 보관된 최초 원문으로 교체합니다. 백업 자체는 계속 유지합니다.",
          id: "restore",
          label: "원문 백업 복원",
          tone: "danger",
        },
        {
          description: "현재 HTML 원문을 그대로 유지합니다.",
          id: "keep_current",
          label: "현재 원문 유지",
        },
      ],
      description: "복원 후 현재 편집 중인 HTML 원문은 교체됩니다.",
      onSelect: (choiceId) => {
        const current = valueRef.current;
        if (choiceId !== "restore" || current.contentSourceBackup === null) {
          return;
        }
        commitValue({ ...current, content: current.contentSourceBackup });
      },
      title: "보관된 원문 복원",
    });
  };

  const previewDirty =
    previewSnapshot.documentKey !== documentKey ||
    previewSnapshot.html !== value.content ||
    previewSnapshot.assetBaseUrl !== effectiveAssetBaseUrl;

  const copyAssetValue = async (label: string, text: string) => {
    const generation = editorGeneration;
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable.");
      }
      await navigator.clipboard.writeText(text);
      if (activeGenerationRef.current === generation) {
        setCopyMessage({
          kind: "success",
          text: `${label}을 클립보드에 복사했습니다.`,
        });
      }
    } catch {
      if (activeGenerationRef.current === generation) {
        setCopyMessage({
          kind: "error",
          text: "클립보드에 복사하지 못했습니다. 값을 직접 선택해 주세요.",
        });
      }
    }
  };

  return (
    <div className={styles.modeBody}>
      <section className={styles.sourceSection}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>HTML 원문</h3>
            <p className={styles.description}>
              붙여넣거나 불러온 문자열을 공백과 마지막 줄바꿈까지 그대로
              저장합니다.
            </p>
          </div>
          <label className={styles.fileButton} aria-disabled={disabled}>
            <span>HTML 파일 불러오기</span>
            <input
              accept=".html,.htm,text/html"
              className={styles.visuallyHiddenInput}
              disabled={disabled}
              onChange={(event) => void onSourceFileChange(event)}
              type="file"
            />
          </label>
        </div>
        <textarea
          aria-label="HTML 원문"
          className={styles.sourceTextarea}
          disabled={disabled}
          onChange={(event) =>
            commitValue({
              ...valueRef.current,
              content: event.currentTarget.value,
            })
          }
          spellCheck={false}
          value={value.content}
        />
        {loadedSourceFile ? (
          <p className={styles.fileMeta}>
            불러온 파일: {loadedSourceFile.name} ·{" "}
            {formatFileSize(loadedSourceFile.size)}
          </p>
        ) : null}
        {sourceFileError ? (
          <p className={styles.error} role="alert">
            {sourceFileError}
          </p>
        ) : null}
        <div className={styles.buttonRow}>
          <AdminButton
            disabled={disabled}
            onClick={() =>
              setPreviewSnapshot({
                assetBaseUrl: effectiveAssetBaseUrl,
                documentKey,
                html: valueRef.current.content,
              })
            }
            variant="secondary"
          >
            미리보기 새로고침
          </AdminButton>
          {value.contentSourceBackup !== null ? (
            <AdminButton
              disabled={disabled || busy}
              onClick={requestBackupRestore}
              variant="ghost"
            >
              원문 백업 복원
            </AdminButton>
          ) : null}
        </div>
      </section>

      <span aria-hidden="true" className={styles.divider} />

      <AdminRawAssetPanel
        assetBaseUrl={assetBaseUrl}
        assetError={assetError}
        assets={assets}
        busy={busy}
        contentAssetBaseEnabled={value.contentAssetBaseEnabled}
        contentAssetScope={value.contentAssetScope}
        copyMessage={copyMessage}
        disabled={disabled}
        onAddFiles={addFiles}
        onAssetBaseEnabledChange={(enabled) =>
          commitValue({
            ...valueRef.current,
            contentAssetBaseEnabled: enabled,
          })
        }
        onCopyAssetValue={(label, assetValue) =>
          void copyAssetValue(label, assetValue)
        }
        onRemoveAsset={(item) => void removeAsset(item)}
        onRequestScopeRotation={requestScopeRotation}
        onRequestUploads={requestUploads}
        onRelativePathChange={setRelativePath}
        pendingCount={pendingCount}
      />

      <span aria-hidden="true" className={styles.divider} />

      <section className={styles.previewSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>HTML 원문 미리보기</h3>
          {previewDirty ? (
            <p className={styles.previewDirty} role="status">
              편집 내용이 아직 미리보기에 반영되지 않았습니다.
            </p>
          ) : null}
        </div>
        {previewSnapshot.assetBaseUrl ? (
          <div className={styles.warning} role="note">
            {rawHtmlContainsBaseElement(previewSnapshot.html) ? (
              <p className={styles.warningText}>
                원문의 &lt;base&gt;는 Storage 상대경로 기준으로 덮어씁니다.
              </p>
            ) : null}
            <p className={styles.warningText}>
              Storage 기준 URL이 상대경로 해석을 바꿉니다. 페이지 내부 fragment
              링크를 반드시 QA해 주세요.
            </p>
          </div>
        ) : null}
        <RawHtmlFrame
          assetBaseUrl={previewSnapshot.assetBaseUrl}
          html={previewSnapshot.html}
          title="HTML 원문 미리보기"
        />
      </section>
    </div>
  );
}
