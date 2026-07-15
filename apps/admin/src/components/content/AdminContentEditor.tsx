import {
  createContentAssetBaseUrl,
  parseContentAssetScope,
} from "@repo/content/asset-url";
import type { TiptapDocument } from "@repo/content/types";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AdminButton } from "../admin/AdminButton";
import { AdminEditorModeSegmentedControl } from "../admin/AdminEditorMode";
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
import { AdminContentPreview } from "./AdminContentPreview";
import { AdminRawHtmlEditor } from "./AdminRawHtmlEditor";
import { GenerationPendingAssetRegistry } from "./generationPendingAssetRegistry";
import type {
  AdminRichTextCanonicalValue,
  PendingEditorAssetWork,
  UploadedEditorImage,
} from "./AdminRichTextEditor";
import styles from "./AdminContentEditor.module.css";
import { replaceImageSlotSource } from "./rawHtmlImageSlots";

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
  readonly previewContainer?: HTMLElement | null;
  readonly value: ManagedContentFormValue;
};

type RawPreviewImageUpload = {
  readonly generation: string;
  readonly requestId: number;
  readonly slotIndex: number;
  readonly source: string;
};

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
  previewContainer,
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
  const previewImageInputRef = useRef<HTMLInputElement>(null);
  const pendingRawPreviewSlotRef = useRef<Pick<
    RawPreviewImageUpload,
    "generation" | "slotIndex" | "source"
  > | null>(null);
  const nextRawPreviewRequestIdRef = useRef(1);

  const [readyGeneration, setReadyGeneration] = useState<string | null>(null);
  const [richPendingCount, setRichPendingCount] = useState(0);
  const [rawPreviewImageUpload, setRawPreviewImageUpload] =
    useState<RawPreviewImageUpload | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const richPendingRegistryRef = useRef<GenerationPendingAssetRegistry | null>(
    null,
  );
  if (!richPendingRegistryRef.current) {
    richPendingRegistryRef.current = new GenerationPendingAssetRegistry();
  }
  const schemaInvalid =
    parsedScope === null ||
    (value.contentMode !== "text" &&
      value.contentAuthoringMode === "wysiwyg" &&
      value.contentJson === null);
  const canonicalReady =
    value.contentMode === "text" ||
    value.contentAuthoringMode !== "wysiwyg" ||
    readyGeneration === editorGeneration;
  const pendingAssetCount = richPendingCount + (rawPreviewImageUpload ? 1 : 0);
  const busy =
    schemaInvalid ||
    contentError !== null ||
    !canonicalReady ||
    pendingAssetCount > 0;
  const usesExternalPreview = previewContainer !== undefined;

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
    pendingRawPreviewSlotRef.current = null;
    setRawPreviewImageUpload(null);
    setContentError(null);
    setAssetError(null);
  }, [editorGeneration]);

  useEffect(() => {
    onPendingAssetCountChangeRef.current(pendingAssetCount);
  }, [editorGeneration, pendingAssetCount]);

  useEffect(() => {
    onBusyChangeRef.current(busy);
  }, [busy, editorGeneration]);

  const commitValue = useCallback((nextValue: ManagedContentFormValue) => {
    onChangeRef.current(nextValue);
  }, []);

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

  const assetBaseUrl = useMemo(() => {
    if (
      !value.contentAssetBaseEnabled ||
      !parsedScope ||
      supabaseConfig.kind !== "enabled"
    ) {
      return undefined;
    }
    return createContentAssetBaseUrl({
      assetScope: parsedScope,
      entity,
      supabaseUrl: supabaseConfig.url,
    });
  }, [entity, parsedScope, value.contentAssetBaseEnabled]);

  const uploadRawPreviewImage = useCallback(
    async (request: RawPreviewImageUpload, file: File): Promise<void> => {
      try {
        const uploaded = await uploadImage(file);
        const sourceIsCurrent =
          mountedRef.current &&
          activeGenerationRef.current === request.generation &&
          valueRef.current.content === request.source;
        const nextContent = sourceIsCurrent
          ? replaceImageSlotSource(
              request.source,
              request.slotIndex,
              uploaded.url,
            )
          : null;

        if (nextContent === null) {
          await cleanupImage(uploaded);
          if (
            mountedRef.current &&
            activeGenerationRef.current === request.generation
          ) {
            setAssetError(
              "본문이 변경되어 업로드한 이미지를 연결하지 않았습니다. 다시 선택해 주세요.",
            );
          }
          return;
        }

        onChangeRef.current({
          ...valueRef.current,
          content: nextContent,
        });
      } catch (error) {
        if (
          mountedRef.current &&
          activeGenerationRef.current === request.generation
        ) {
          setAssetError(
            failureMessage(
              error,
              "본문 이미지 업로드에 실패했습니다. 다시 시도해 주세요.",
            ),
          );
        }
      } finally {
        if (mountedRef.current) {
          setRawPreviewImageUpload((current) =>
            current?.requestId === request.requestId ? null : current,
          );
        }
      }
    },
    [cleanupImage, uploadImage],
  );

  const selectRawPreviewImageSlot = useCallback(
    (slotIndex: number) => {
      if (disabled || rawPreviewImageUpload !== null) return;
      pendingRawPreviewSlotRef.current = {
        generation: editorGeneration,
        slotIndex,
        source: valueRef.current.content,
      };
      previewImageInputRef.current?.click();
    },
    [disabled, editorGeneration, rawPreviewImageUpload],
  );

  const selectRawPreviewImageFile = useCallback(
    (file: File | null) => {
      const pendingSlot = pendingRawPreviewSlotRef.current;
      pendingRawPreviewSlotRef.current = null;
      if (
        !file ||
        !pendingSlot ||
        activeGenerationRef.current !== pendingSlot.generation
      ) {
        return;
      }
      const request: RawPreviewImageUpload = {
        ...pendingSlot,
        requestId: nextRawPreviewRequestIdRef.current,
      };
      nextRawPreviewRequestIdRef.current += 1;
      setRawPreviewImageUpload(request);
      void uploadRawPreviewImage(request, file);
    },
    [uploadRawPreviewImage],
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
    setReadyGeneration(null);
    commitValue(switchRawToWysiwyg(valueRef.current, "restore_previous"));
  };

  const requestWysiwygToRaw = () => {
    if (busy || disabled) return;
    commitValue(switchWysiwygToRaw(valueRef.current, "generated"));
  };

  const requestLegacyConversion = (target: "raw_html" | "wysiwyg") => {
    if (busy || disabled) return;
    const isRaw = target === "raw_html";
    if (!isRaw) setReadyGeneration(null);
    commitValue(
      isRaw
        ? convertLegacyTextToRaw(valueRef.current)
        : convertLegacyTextToWysiwyg(valueRef.current),
    );
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

  const renderEditorWorkspace = (editor: ReactNode) => {
    const preview = (
      <AdminContentPreview
        assetBaseUrl={assetBaseUrl}
        disabled={disabled || rawPreviewImageUpload !== null}
        html={value.content}
        interactiveImages={value.contentAuthoringMode === "raw_html"}
        onSelectImage={selectRawPreviewImageSlot}
        uploadingSlot={rawPreviewImageUpload?.slotIndex ?? null}
      />
    );

    return (
      <>
        <div
          className={
            usesExternalPreview
              ? styles.editorWorkspaceExternalPreview
              : styles.editorWorkspace
          }
        >
          <div className={styles.editorColumn}>{editor}</div>
          {!usesExternalPreview ? preview : null}
        </div>
        {usesExternalPreview && previewContainer
          ? createPortal(preview, previewContainer)
          : null}
      </>
    );
  };

  return (
    <section className={styles.root}>
      {value.contentMode === "text" ? (
        renderLegacyEditor()
      ) : (
        <>
          <AdminEditorModeSegmentedControl
            disabled={disabled || busy}
            fullWidth
            id="managed-content-mode"
            label="본문 작성 방식"
            name="managed-content-mode"
            onChange={(mode) => {
              if (mode === value.contentAuthoringMode) return;
              if (mode === "wysiwyg") requestRawToWysiwyg();
              else requestWysiwygToRaw();
            }}
            value={value.contentAuthoringMode}
          />
          {schemaInvalid ? (
            <p className={styles.error} role="alert">
              {managedContentSchemaErrorMessage}
            </p>
          ) : contentError ? (
            <p className={styles.error} role="alert">
              {contentError}
            </p>
          ) : value.contentAuthoringMode === "raw_html" ? (
            <>
              {renderEditorWorkspace(
                <AdminRawHtmlEditor
                  disabled={disabled}
                  documentKey={documentKey}
                  onChange={commitValue}
                  value={value}
                />,
              )}
              <input
                accept="image/png,image/jpeg,image/webp"
                aria-label="HTML 이미지 파일 선택"
                className={styles.visuallyHiddenInput}
                disabled={disabled || rawPreviewImageUpload !== null}
                onChange={(event) =>
                  selectRawPreviewImageFile(
                    event.currentTarget.files?.[0] ?? null,
                  )
                }
                ref={previewImageInputRef}
                type="file"
              />
              {assetError ? (
                <p className={styles.error} role="alert">
                  {assetError}
                </p>
              ) : null}
            </>
          ) : (
            renderEditorWorkspace(renderWysiwygEditor())
          )}
        </>
      )}
    </section>
  );
}
