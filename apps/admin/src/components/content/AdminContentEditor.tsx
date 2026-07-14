import { parseContentAssetScope } from "@repo/content/asset-url";
import type { TiptapDocument } from "@repo/content/types";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AdminButton } from "../admin/AdminButton";
import { AdminFailureError, type AdminFailure } from "../../lib/adminErrors";
import {
  isContentImagePublicUrlOwnedBy,
  removeContentAsset,
  uploadContentAsset,
  type ContentEntity,
} from "../../lib/contentAssetStorage";
import {
  convertLegacyTextToRaw,
  convertLegacyTextToWysiwyg,
  EMPTY_TIPTAP_DOCUMENT,
  managedContentSchemaErrorMessage,
  switchRawToWysiwyg,
  switchWysiwygToRaw,
  type ManagedContentFormValue,
} from "../../lib/managedContent";
import { supabaseConfig } from "../../lib/supabase";
import { AdminChoiceDialog } from "./AdminChoiceDialog";
import { AdminRawHtmlEditor } from "./AdminRawHtmlEditor";
import { GenerationPendingAssetRegistry } from "./generationPendingAssetRegistry";
import type {
  RawAssetCleanupIssue,
  RawPendingAssetWork,
} from "./useRawAssetLifecycle";
import type {
  AdminRichTextCanonicalValue,
  PendingEditorAssetWork,
  UploadedEditorImage,
} from "./AdminRichTextEditor";
import { useGenerationBoundChoiceDialog } from "./useGenerationBoundChoiceDialog";
import styles from "./AdminContentEditor.module.css";

const LazyAdminRichTextEditor = lazy(async () => {
  const module = await import("./AdminRichTextEditor");
  return { default: module.AdminRichTextEditor };
});

export type AdminContentEditorProps = {
  readonly disabled: boolean;
  readonly documentKey: string;
  readonly entity: ContentEntity;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onChange: (value: ManagedContentFormValue) => void;
  readonly onPendingAssetCountChange: (count: number) => void;
  readonly value: ManagedContentFormValue;
};

const modeDescriptions = {
  raw_html:
    "script와 style을 포함한 완성 HTML을 원문 그대로 보존하고 격리된 미리보기로 확인합니다.",
  wysiwyg: "제목, 목록, 링크, 이미지를 편집 도구로 작성합니다.",
} as const;

function canonicalScope(value: string): string | null {
  try {
    return parseContentAssetScope(value);
  } catch {
    return null;
  }
}

function failureError(error: AdminFailure): AdminFailureError {
  return new AdminFailureError(error);
}

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof AdminFailureError ? error.failure.message : fallback;
}

export function AdminContentEditor({
  disabled,
  documentKey,
  entity,
  onBusyChange,
  onChange,
  onPendingAssetCountChange,
  value,
}: AdminContentEditorProps) {
  const parsedScope = useMemo(
    () => canonicalScope(value.contentAssetScope),
    [value.contentAssetScope],
  );
  const editorGeneration = `${documentKey}:scope:${parsedScope ?? "invalid"}`;
  const activeGenerationRef = useRef(editorGeneration);
  activeGenerationRef.current = editorGeneration;
  const previousGenerationRef = useRef(editorGeneration);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onBusyChangeRef = useRef(onBusyChange);
  onBusyChangeRef.current = onBusyChange;
  const onPendingAssetCountChangeRef = useRef(onPendingAssetCountChange);
  onPendingAssetCountChangeRef.current = onPendingAssetCountChange;
  const mountedRef = useRef(false);

  const [readyGeneration, setReadyGeneration] = useState<string | null>(null);
  const [richPendingCount, setRichPendingCount] = useState(0);
  const [rawPendingCount, setRawPendingCount] = useState(0);
  const [contentError, setContentError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [orphanCleanupIssues, setOrphanCleanupIssues] = useState<
    readonly RawAssetCleanupIssue[]
  >([]);
  const richPendingRegistryRef = useRef<GenerationPendingAssetRegistry | null>(
    null,
  );
  if (!richPendingRegistryRef.current) {
    richPendingRegistryRef.current = new GenerationPendingAssetRegistry();
  }
  const rawPendingRegistryRef = useRef<GenerationPendingAssetRegistry | null>(
    null,
  );
  if (!rawPendingRegistryRef.current) {
    rawPendingRegistryRef.current = new GenerationPendingAssetRegistry();
  }
  const {
    cancelDialog,
    openDialog,
    request: dialog,
    selectDialog,
  } = useGenerationBoundChoiceDialog(editorGeneration, disabled);

  const schemaInvalid =
    parsedScope === null ||
    (value.contentMode !== "text" &&
      value.contentAuthoringMode === "wysiwyg" &&
      value.contentJson === null);
  const canonicalReady =
    value.contentMode === "text" ||
    value.contentAuthoringMode !== "wysiwyg" ||
    readyGeneration === editorGeneration;
  const pendingAssetCount = richPendingCount + rawPendingCount;
  const busy =
    schemaInvalid ||
    contentError !== null ||
    !canonicalReady ||
    pendingAssetCount > 0;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      onBusyChangeRef.current(false);
      onPendingAssetCountChangeRef.current(0);
    };
  }, []);

  useEffect(() => {
    if (previousGenerationRef.current === editorGeneration) return;
    previousGenerationRef.current = editorGeneration;
    setContentError(null);
    setAssetError(null);
  }, [editorGeneration]);

  useEffect(() => {
    onPendingAssetCountChangeRef.current(pendingAssetCount);
  }, [pendingAssetCount]);

  useEffect(() => {
    onBusyChangeRef.current(busy);
  }, [busy]);

  const commitValue = useCallback((nextValue: ManagedContentFormValue) => {
    onChangeRef.current(nextValue);
  }, []);

  const onRawPendingAssetWorkChange = useCallback(
    (event: RawPendingAssetWork) => {
      if (!mountedRef.current) return;
      setRawPendingCount(rawPendingRegistryRef.current?.update(event) ?? 0);
    },
    [],
  );

  const onRawOrphanCleanupIssue = useCallback((issue: RawAssetCleanupIssue) => {
    if (!mountedRef.current) return;
    setOrphanCleanupIssues((current) => {
      const existingIndex = current.findIndex(
        (entry) =>
          entry.generation === issue.generation && entry.path === issue.path,
      );
      if (existingIndex < 0) return [...current, issue];
      if (current[existingIndex]?.message === issue.message) return current;
      return current.map((entry, index) =>
        index === existingIndex ? issue : entry,
      );
    });
  }, []);

  const dismissRawOrphanCleanupIssue = useCallback(
    (issue: RawAssetCleanupIssue) => {
      setOrphanCleanupIssues((current) =>
        current.filter(
          (entry) =>
            entry.generation !== issue.generation || entry.path !== issue.path,
        ),
      );
    },
    [],
  );

  const isAllowedImageUrl = useCallback(
    (publicUrl: string) =>
      parsedScope !== null &&
      isContentImagePublicUrlOwnedBy(supabaseConfig, {
        assetScope: parsedScope,
        entity,
        publicUrl,
      }),
    [entity, parsedScope],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<UploadedEditorImage> => {
      if (activeGenerationRef.current === editorGeneration) {
        setAssetError(null);
      }
      if (!parsedScope) throw new Error(managedContentSchemaErrorMessage);
      const result = await uploadContentAsset(supabaseConfig, {
        assetScope: parsedScope,
        entity,
        file,
      });
      if (!result.ok) throw failureError(result.error);
      const uploaded = {
        alt: result.value.alt,
        path: result.value.path,
        url: result.value.publicUrl,
      };
      if (activeGenerationRef.current === editorGeneration) {
        setAssetError(null);
      }
      return uploaded;
    },
    [editorGeneration, entity, parsedScope],
  );

  const cleanupImage = useCallback(
    async (image: UploadedEditorImage): Promise<void> => {
      if (!parsedScope) throw new Error(managedContentSchemaErrorMessage);
      const result = await removeContentAsset(supabaseConfig, {
        assetScope: parsedScope,
        entity,
        path: image.path,
      });
      if (!result.ok) throw failureError(result.error);
    },
    [entity, parsedScope],
  );

  const applyCanonical = useCallback(
    (canonical: AdminRichTextCanonicalValue, markReady: boolean) => {
      if (activeGenerationRef.current !== editorGeneration) return;
      if (markReady) setReadyGeneration(editorGeneration);
      setContentError(null);
      setAssetError(null);
      onChangeRef.current({
        ...valueRef.current,
        content: canonical.html,
        contentAuthoringMode: "wysiwyg",
        contentJson: canonical.document,
        contentMode: "html",
      });
    },
    [editorGeneration],
  );

  const requestRawToWysiwyg = () => {
    if (busy || disabled) return;
    openDialog({
      choices: [
        {
          description:
            "저장해 둔 WYSIWYG 문서를 다시 열고 최초 원문 백업은 유지합니다.",
          id: "restore_previous",
          label: "이전 WYSIWYG 복원",
        },
        {
          description:
            "현재 HTML 원문을 새 백업으로 바꾸고 빈 문서에서 시작합니다.",
          id: "new_from_current_backup",
          label: "현재 원문을 백업하고 새 문서 시작",
          tone: "danger",
        },
      ],
      description:
        "HTML 원문을 WYSIWYG로 자동 변환하지 않습니다. 사용할 초안을 선택해 주세요.",
      onSelect: (choiceId) => {
        if (
          choiceId !== "restore_previous" &&
          choiceId !== "new_from_current_backup"
        ) {
          return;
        }
        setReadyGeneration(null);
        commitValue(switchRawToWysiwyg(valueRef.current, choiceId));
      },
      title: "WYSIWYG 에디터로 전환",
    });
  };

  const requestWysiwygToRaw = () => {
    if (busy || disabled) return;
    openDialog({
      choices: [
        {
          description: "처음 보관한 HTML 원문 초안을 다시 사용합니다.",
          id: "backup",
          label: "이전 원문 복원",
        },
        {
          description: "현재 WYSIWYG 문서가 생성한 HTML을 원문으로 사용합니다.",
          id: "generated",
          label: "현재 생성 HTML 사용",
        },
      ],
      description:
        "WYSIWYG 문서는 그대로 보관됩니다. 원문 편집기에 표시할 소스를 선택해 주세요.",
      onSelect: (choiceId) => {
        if (choiceId !== "backup" && choiceId !== "generated") return;
        commitValue(switchWysiwygToRaw(valueRef.current, choiceId));
      },
      title: "HTML 원문으로 전환",
    });
  };

  const requestLegacyConversion = (target: "raw_html" | "wysiwyg") => {
    if (busy || disabled) return;
    const isRaw = target === "raw_html";
    openDialog({
      choices: [
        {
          description: isRaw
            ? "문자와 따옴표를 안전하게 이스케이프한 HTML 초안을 만듭니다."
            : "기존 문자를 그대로 유지한 WYSIWYG 문서를 만듭니다.",
          id: "convert",
          label: isRaw ? "HTML 원문으로 변환" : "WYSIWYG로 변환",
        },
        {
          description: "기존 TEXT 본문을 바꾸지 않습니다.",
          id: "keep_text",
          label: "기존 TEXT 유지",
        },
      ],
      description: "변환 후에도 안전하게 이스케이프한 원문 백업을 보관합니다.",
      onSelect: (choiceId) => {
        if (choiceId !== "convert") return;
        if (!isRaw) setReadyGeneration(null);
        commitValue(
          isRaw
            ? convertLegacyTextToRaw(valueRef.current)
            : convertLegacyTextToWysiwyg(valueRef.current),
        );
      },
      title: isRaw ? "기존 TEXT를 HTML로 변환" : "기존 TEXT를 WYSIWYG로 변환",
    });
  };

  const renderLegacyEditor = () => (
    <section className={styles.legacySection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>기존 TEXT 본문</h3>
        <p className={styles.description}>
          이 글은 기존 TEXT 형식입니다. 먼저 안전한 작성 방식으로 변환해 주세요.
        </p>
      </div>
      <label className={styles.field} htmlFor="managed-content-legacy-text">
        <span className={styles.label}>TEXT 원문</span>
        <textarea
          className={styles.sourceTextarea}
          disabled={disabled}
          id="managed-content-legacy-text"
          onChange={(event) =>
            commitValue({
              ...valueRef.current,
              content: event.currentTarget.value,
            })
          }
          value={value.content}
        />
      </label>
      <div className={styles.field}>
        <span className={styles.label}>이스케이프 미리보기</span>
        <pre aria-label="기존 TEXT 미리보기" className={styles.legacyPreview}>
          {value.content}
        </pre>
      </div>
      <div className={styles.buttonRow}>
        <AdminButton
          disabled={disabled || busy}
          onClick={() => requestLegacyConversion("raw_html")}
          variant="secondary"
        >
          HTML 원문으로 변환
        </AdminButton>
        <AdminButton
          disabled={disabled || busy}
          onClick={() => requestLegacyConversion("wysiwyg")}
        >
          WYSIWYG로 변환
        </AdminButton>
      </div>
    </section>
  );

  const renderWysiwygEditor = () => {
    const document: TiptapDocument = value.contentJson ?? EMPTY_TIPTAP_DOCUMENT;
    if (schemaInvalid) return null;
    return (
      <div className={styles.modeBody}>
        <Suspense
          fallback={
            <p className={styles.loading} role="status">
              WYSIWYG 에디터를 불러오는 중입니다.
            </p>
          }
        >
          <LazyAdminRichTextEditor
            cleanupOrphanedImage={cleanupImage}
            disabled={disabled || contentError !== null}
            document={document}
            documentKey={editorGeneration}
            isAllowedImageUrl={isAllowedImageUrl}
            key={editorGeneration}
            onChange={(canonical) => applyCanonical(canonical, false)}
            onContentError={() => {
              if (activeGenerationRef.current === editorGeneration) {
                setContentError(managedContentSchemaErrorMessage);
              }
            }}
            onCreate={(canonical) => applyCanonical(canonical, true)}
            onPendingAssetWorkChange={(event: PendingEditorAssetWork) => {
              setRichPendingCount(
                richPendingRegistryRef.current?.update(event) ?? 0,
              );
              if (
                event.count > 0 &&
                activeGenerationRef.current === event.generation
              ) {
                setAssetError(null);
              }
            }}
            onUploadError={(error) => {
              if (activeGenerationRef.current !== editorGeneration) return;
              setAssetError(
                failureMessage(
                  error,
                  "본문 이미지 업로드에 실패했습니다. 다시 시도해 주세요.",
                ),
              );
            }}
            uploadImage={uploadImage}
          />
        </Suspense>
        {assetError ? (
          <p className={styles.error} role="alert">
            {assetError}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <section className={styles.root}>
      {value.contentMode === "text" ? (
        renderLegacyEditor()
      ) : (
        <>
          <fieldset className={styles.modeFieldset}>
            <legend className={styles.modeLegend}>본문 작성 방식</legend>
            <div className={styles.modeCards}>
              {(["raw_html", "wysiwyg"] as const).map((mode) => (
                <label className={styles.modeCard} key={mode}>
                  <input
                    checked={value.contentAuthoringMode === mode}
                    disabled={disabled || busy}
                    name="managed-content-mode"
                    onChange={() => {
                      if (mode === value.contentAuthoringMode) return;
                      if (mode === "wysiwyg") requestRawToWysiwyg();
                      else requestWysiwygToRaw();
                    }}
                    type="radio"
                    value={mode}
                  />
                  <span className={styles.modeCardText}>
                    <span className={styles.modeName}>
                      {mode === "raw_html" ? "HTML 원문" : "WYSIWYG 에디터"}
                    </span>
                    <span className={styles.modeDescription}>
                      {modeDescriptions[mode]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <span aria-hidden="true" className={styles.divider} />
          {schemaInvalid ? (
            <p className={styles.error} role="alert">
              {managedContentSchemaErrorMessage}
            </p>
          ) : contentError ? (
            <p className={styles.error} role="alert">
              {contentError}
            </p>
          ) : value.contentAuthoringMode === "raw_html" && parsedScope ? (
            <AdminRawHtmlEditor
              busy={busy}
              contentAssetScope={parsedScope}
              disabled={disabled}
              documentKey={documentKey}
              editorGeneration={editorGeneration}
              entity={entity}
              onChange={commitValue}
              onOrphanCleanupIssue={onRawOrphanCleanupIssue}
              onPendingAssetWorkChange={onRawPendingAssetWorkChange}
              openDialog={openDialog}
              value={value}
            />
          ) : (
            renderWysiwygEditor()
          )}
        </>
      )}
      {orphanCleanupIssues.map((issue) => (
        <div
          className={styles.operationalAlert}
          key={JSON.stringify([issue.generation, issue.path])}
          role="alert"
        >
          <p className={styles.operationalAlertText}>{issue.message}</p>
          <p
            className={`${styles.operationalAlertText} ${styles.operationalIssuePath}`}
          >
            Storage 관리자에서 수동 정리할 경로: {issue.path}
          </p>
          <AdminButton
            aria-label={`고립 asset 알림 닫기: ${issue.path}`}
            onClick={() => dismissRawOrphanCleanupIssue(issue)}
            size="sm"
            variant="secondary"
          >
            알림 닫기
          </AdminButton>
        </div>
      ))}
      <AdminChoiceDialog
        cancelLabel={dialog?.cancelLabel}
        choices={dialog?.choices ?? []}
        description={dialog?.description ?? ""}
        onCancel={cancelDialog}
        onSelect={selectDialog}
        open={dialog !== null}
        title={dialog?.title ?? ""}
      />
    </section>
  );
}
