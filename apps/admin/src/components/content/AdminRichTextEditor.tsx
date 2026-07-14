import type { TiptapDocument } from "@repo/content/types";
import { getSchema, type Editor, type JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminRichTextToolbar } from "./AdminRichTextToolbar";
import styles from "./AdminRichTextEditor.module.css";
import {
  type CleanupOrphanedEditorImage,
  createContentEditorExtensions,
  type OrphanedEditorImageReason,
  type UploadedEditorImage,
  type UploadEditorImage,
} from "./contentEditorExtensions";
import {
  type EditorRuntime,
  ImageUploadLifecycle,
  type PendingEditorAssetWork,
  safelyCall,
} from "./editorImageUploadLifecycle";
import {
  type AdminRichTextCanonicalValue,
  assertSemanticallyValidInitialDocument,
  canonicalFingerprint,
  canonicalValue,
  hasTransientImageState,
} from "./managedEditorDocument";
import { SelectedImagePanel } from "./SelectedImagePanel";

export type AdminRichTextEditorProps = {
  readonly cleanupOrphanedImage: CleanupOrphanedEditorImage;
  readonly disabled: boolean;
  readonly document: TiptapDocument;
  readonly documentKey: string;
  /** Exact storage ownership predicate for this document's entity and scope. */
  readonly isAllowedImageUrl: (url: string) => boolean;
  readonly onChange: (value: AdminRichTextCanonicalValue) => void;
  readonly onContentError: (error: unknown) => void;
  readonly onCreate: (value: AdminRichTextCanonicalValue) => void;
  readonly onPendingAssetWorkChange: (event: PendingEditorAssetWork) => void;
  readonly onUploadError: (error: unknown) => void;
  readonly uploadImage: UploadEditorImage;
};

const uploadFailureMessage =
  "본문 이미지 업로드에 실패했습니다. 다시 시도해 주세요.";

function createEditorAttributes(disabled: boolean, hasContentError: boolean) {
  return {
    "aria-disabled": String(disabled),
    "aria-invalid": String(hasContentError),
    "aria-label": "본문 WYSIWYG 편집기",
    "aria-multiline": "true",
    "aria-readonly": String(disabled || hasContentError),
    role: "textbox",
  };
}

export function AdminRichTextEditor({
  cleanupOrphanedImage,
  disabled,
  document,
  documentKey,
  isAllowedImageUrl,
  onChange,
  onContentError,
  onCreate,
  onPendingAssetWorkChange,
  onUploadError,
  uploadImage,
}: AdminRichTextEditorProps) {
  const [contentErrorRuntimeId, setContentErrorRuntimeId] = useState<
    number | null
  >(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(
    null,
  );
  const mountedRef = useRef(false);
  const nextRuntimeIdRef = useRef(1);
  const runtimeRef = useRef<EditorRuntime | null>(null);
  if (!runtimeRef.current || runtimeRef.current.documentKey !== documentKey) {
    runtimeRef.current = {
      active: true,
      contentErrorReported: false,
      created: false,
      documentKey,
      editor: null,
      id: nextRuntimeIdRef.current,
      initialDocument: document,
      invalidated: false,
      isAllowedImageUrl,
      lastCleanFingerprint: null,
    };
    nextRuntimeIdRef.current += 1;
  }
  const runtime = runtimeRef.current;

  const cleanupOrphanedImageRef = useRef(cleanupOrphanedImage);
  cleanupOrphanedImageRef.current = cleanupOrphanedImage;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onContentErrorRef = useRef(onContentError);
  onContentErrorRef.current = onContentError;
  const onCreateRef = useRef(onCreate);
  onCreateRef.current = onCreate;
  const onPendingAssetWorkChangeRef = useRef(onPendingAssetWorkChange);
  onPendingAssetWorkChangeRef.current = onPendingAssetWorkChange;
  const onUploadErrorRef = useRef(onUploadError);
  onUploadErrorRef.current = onUploadError;
  const uploadImageRef = useRef(uploadImage);
  uploadImageRef.current = uploadImage;

  const lifecycleRef = useRef<ImageUploadLifecycle | null>(null);
  if (!lifecycleRef.current) {
    lifecycleRef.current = new ImageUploadLifecycle({
      clearUploadError: (targetRuntime) => {
        if (mountedRef.current && runtimeRef.current === targetRuntime) {
          setUploadErrorMessage(null);
        }
      },
      emitCanonicalChange: (targetRuntime, editor) => {
        if (
          runtimeRef.current !== targetRuntime ||
          targetRuntime.invalidated ||
          lifecycleRef.current?.reconcileTerminalState(targetRuntime, editor) ||
          hasTransientImageState(editor)
        ) {
          return;
        }
        const value = canonicalValue(editor);
        const fingerprint = canonicalFingerprint(value);
        if (fingerprint === targetRuntime.lastCleanFingerprint) return;
        targetRuntime.lastCleanFingerprint = fingerprint;
        safelyCall(onChangeRef.current, value);
      },
      getCleanupOrphanedImage: () => cleanupOrphanedImageRef.current,
      getCurrentRuntime: () => {
        if (!runtimeRef.current) {
          throw new Error("The editor runtime is unavailable.");
        }
        return runtimeRef.current;
      },
      getOnUploadError: () => onUploadErrorRef.current,
      getUploadImage: () => uploadImageRef.current,
      notifyPendingAssetWork: (event) =>
        onPendingAssetWorkChangeRef.current(event),
      showUploadError: (targetRuntime) => {
        if (mountedRef.current && runtimeRef.current === targetRuntime) {
          setUploadErrorMessage((current) =>
            current === null ? uploadFailureMessage : current,
          );
        }
      },
    });
  }
  const lifecycle = lifecycleRef.current;

  const extensions = useMemo(
    () =>
      createContentEditorExtensions((editor, files, position) => {
        lifecycle.start(runtime, editor, files, position);
      }),
    [lifecycle, runtime],
  );
  const initialContent = useMemo(() => {
    try {
      assertSemanticallyValidInitialDocument(
        runtime.initialDocument,
        runtime.isAllowedImageUrl,
      );
      const node = getSchema(extensions).nodeFromJSON(
        runtime.initialDocument as JSONContent,
      );
      node.check();
      return {
        content: runtime.initialDocument as JSONContent,
        error: null,
      };
    } catch (error) {
      return {
        content: {
          type: "doc",
          content: [{ type: "paragraph" }],
        } satisfies JSONContent,
        error,
      };
    }
  }, [extensions, runtime]);
  const invalidEditorsRef = useRef(new WeakSet<Editor>());
  const createdEditorsRef = useRef(new WeakSet<Editor>());

  const reportContentError = (editor: Editor, error: unknown) => {
    invalidEditorsRef.current.add(editor);
    editor.setOptions({ editable: false });
    if (runtime.contentErrorReported) return;
    runtime.contentErrorReported = true;
    queueMicrotask(() => {
      if (mountedRef.current) setContentErrorRuntimeId(runtime.id);
      safelyCall(onContentErrorRef.current, error);
    });
  };

  const editor = useEditor(
    {
      content: initialContent.content,
      editable: !disabled,
      enableContentCheck: true,
      editorProps: {
        attributes: createEditorAttributes(disabled, false),
      },
      extensions,
      onBeforeCreate: ({ editor: currentEditor }) => {
        runtime.editor = currentEditor;
        if (initialContent.error) {
          reportContentError(currentEditor, initialContent.error);
        }
      },
      onContentError: ({ editor: currentEditor, error }) => {
        reportContentError(currentEditor, error);
      },
      onCreate: ({ editor: currentEditor }) => {
        if (
          runtime.created ||
          createdEditorsRef.current.has(currentEditor)
        ) {
          return;
        }
        createdEditorsRef.current.add(currentEditor);
        runtime.editor = currentEditor;
        if (
          invalidEditorsRef.current.has(currentEditor) ||
          hasTransientImageState(currentEditor)
        ) {
          if (!invalidEditorsRef.current.has(currentEditor)) {
            reportContentError(
              currentEditor,
              new Error("Stored editor content contains a pending image."),
            );
          }
          return;
        }
        runtime.created = true;
        const value = canonicalValue(currentEditor);
        runtime.lastCleanFingerprint = canonicalFingerprint(value);
        onCreateRef.current(value);
      },
      onUpdate: ({ editor: currentEditor }) => {
        if (
          runtimeRef.current !== runtime ||
          runtime.invalidated ||
          !runtime.created ||
          invalidEditorsRef.current.has(currentEditor)
        ) {
          return;
        }
        if (lifecycle.reconcileTerminalState(runtime, currentEditor)) return;
        if (
          lifecycle.hasPending(runtime) ||
          hasTransientImageState(currentEditor)
        ) {
          return;
        }
        const value = canonicalValue(currentEditor);
        const fingerprint = canonicalFingerprint(value);
        if (fingerprint === runtime.lastCleanFingerprint) return;
        runtime.lastCleanFingerprint = fingerprint;
        onChangeRef.current(value);
      },
    },
    [runtime],
  );

  const hasContentError = contentErrorRuntimeId === runtime.id;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    runtime.active = true;
    return () => {
      runtime.active = false;
      queueMicrotask(() => {
        if (!runtime.active) lifecycle.invalidate(runtime);
      });
    };
  }, [lifecycle, runtime]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setOptions({
      editorProps: {
        attributes: createEditorAttributes(disabled, hasContentError),
      },
    });
    editor.setEditable(!disabled && !hasContentError, false);
  }, [disabled, editor, hasContentError]);

  return (
    <div className={styles.root}>
      <div
        className={styles.editorFrame}
        data-disabled={disabled || undefined}
        data-invalid={hasContentError || undefined}
      >
        {editor ? (
          <AdminRichTextToolbar
            disabled={disabled || hasContentError}
            editor={editor}
            onImage={(file) => {
              const { from, to } = editor.state.selection;
              lifecycle.start(runtime, editor, [file], { from, to });
            }}
          />
        ) : null}
        <EditorContent
          className={`${styles.editorContent} rich-content`}
          editor={editor}
        />
      </div>
      {editor ? (
        <SelectedImagePanel
          disabled={disabled || hasContentError}
          editor={editor}
        />
      ) : null}
      <p aria-live="polite" className={styles.uploadError} role="status">
        {uploadErrorMessage}
      </p>
    </div>
  );
}

export type {
  AdminRichTextCanonicalValue,
  CleanupOrphanedEditorImage,
  OrphanedEditorImageReason,
  PendingEditorAssetWork,
  UploadedEditorImage,
  UploadEditorImage,
};
