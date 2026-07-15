import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ManagedContentFormValue } from "../../lib/managedContent";
import styles from "./AdminContentEditor.module.css";

type LoadedSourceFile = {
  readonly name: string;
  readonly size: number;
};

export type AdminRawHtmlEditorProps = {
  readonly disabled: boolean;
  readonly documentKey: string;
  readonly onChange: (value: ManagedContentFormValue) => void;
  readonly value: ManagedContentFormValue;
};

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KiB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MiB`;
}

function isSupportedHtmlSourceFile(file: File): boolean {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  return (
    file.type === "text/html" || extension === "html" || extension === "htm"
  );
}

export function AdminRawHtmlEditor({
  disabled,
  documentKey,
  onChange,
  value,
}: AdminRawHtmlEditorProps) {
  const activeDocumentKeyRef = useRef(documentKey);
  activeDocumentKeyRef.current = documentKey;
  const mountedRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [sourceFileError, setSourceFileError] = useState<string | null>(null);
  const [loadedSourceFile, setLoadedSourceFile] =
    useState<LoadedSourceFile | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setLoadedSourceFile(null);
    setSourceFileError(null);
  }, [documentKey]);

  const applyLoadedSource = (
    source: string,
    file: File,
    sourceDocumentKey: string,
  ) => {
    if (activeDocumentKeyRef.current !== sourceDocumentKey) return;
    onChangeRef.current({ ...valueRef.current, content: source });
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

    const sourceDocumentKey = documentKey;
    setSourceFileError(null);
    let source: string;
    try {
      source = await file.text();
    } catch {
      if (activeDocumentKeyRef.current === sourceDocumentKey) {
        setSourceFileError("HTML 파일을 읽지 못했습니다. 다시 선택해 주세요.");
      }
      return;
    }
    if (
      !mountedRef.current ||
      activeDocumentKeyRef.current !== sourceDocumentKey
    ) {
      return;
    }

    applyLoadedSource(source, file, sourceDocumentKey);
  };

  return (
    <div className={styles.rawHtmlEditor}>
      <div className={styles.sourceFileRow}>
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
          onChangeRef.current({
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
    </div>
  );
}
