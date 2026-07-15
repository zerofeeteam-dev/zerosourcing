import { useState, type DragEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { AdminButton } from "./AdminButton";
import { AdminFolderUpIcon, AdminTrashIcon, AdminUploadIcon } from "./icons";
import styles from "./AdminUpload.module.css";

type AdminUploadControlProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "className" | "id" | "type"
> & {
  readonly acceptLabel: string;
  readonly description?: string;
  readonly errorMessage?: string;
  readonly fileName?: string;
  readonly id: string;
  readonly label: string;
  readonly labelHidden?: boolean;
  readonly onFiles?: (files: FileList | null) => void;
  readonly onRemove?: () => void;
  readonly preview?: ReactNode;
  readonly previewFullBleed?: boolean;
  readonly variant?: "default" | "dropzone";
};

function descriptionId(id: string): string {
  return `${id}-description`;
}

function errorId(id: string): string {
  return `${id}-error`;
}

function describedBy(
  id: string,
  description: string | undefined,
  errorMessage: string | undefined,
): string | undefined {
  const ids: string[] = [];
  if (description) ids.push(descriptionId(id));
  if (errorMessage) ids.push(errorId(id));
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function AdminUploadControl({
  acceptLabel,
  description,
  errorMessage,
  fileName,
  id,
  label,
  labelHidden = false,
  onFiles,
  onRemove,
  preview,
  previewFullBleed = false,
  variant = "default",
  ...props
}: AdminUploadControlProps) {
  const [isDragging, setIsDragging] = useState(false);
  const visibleFileName = fileName ?? "선택된 파일 없음";

  const handleDrag = (event: DragEvent<HTMLDivElement>, active: boolean) => {
    event.preventDefault();
    if (props.disabled) return;
    setIsDragging(active);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (props.disabled) return;
    onFiles?.(event.dataTransfer.files);
  };

  if (variant === "dropzone") {
    return (
      <div className={styles.fieldDropzone}>
        <label className={labelHidden ? styles.labelHidden : styles.label} htmlFor={id}>
          {label}
        </label>
        <div className={styles.controlColumn}>
          <div
            className={`${styles.figmaDropzone} ${isDragging ? styles.figmaDropzoneActive : ""}`}
            onDragEnter={(event) => handleDrag(event, true)}
            onDragLeave={(event) => handleDrag(event, false)}
            onDragOver={(event) => handleDrag(event, true)}
            onDrop={handleDrop}
          >
            <input
              {...props}
              aria-describedby={describedBy(id, description, errorMessage)}
              aria-invalid={errorMessage ? true : undefined}
              className={styles.input}
              id={id}
              type="file"
            />
            <label
              className={
                preview && previewFullBleed
                  ? `${styles.figmaTrigger} ${styles.figmaTriggerPreview}`
                  : styles.figmaTrigger
              }
              htmlFor={id}
            >
              {preview ? (
                <span className={styles.figmaPreview}>{preview}</span>
              ) : (
                <>
                  <span aria-hidden="true" className={styles.figmaIconBubble}>
                    <AdminFolderUpIcon size={20} />
                  </span>
                  <span className={styles.figmaCopy}>
                    <span>파일을 드래그 또는 클릭 후 파일 업로드 (0/1)</span>
                    <span className={styles.figmaAccept}>{acceptLabel}</span>
                  </span>
                </>
              )}
            </label>
            {fileName && onRemove ? (
              <button aria-label={`${label} 삭제`} className={styles.previewRemove} onClick={onRemove} type="button">
                <AdminTrashIcon size={16} />
              </button>
            ) : null}
          </div>
          {errorMessage ? (
            <p className={styles.error} id={errorId(id)}>
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <div className={labelHidden ? styles.labelHidden : styles.fieldText}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {description ? (
          <p className={styles.description} id={descriptionId(id)}>
            {description}
          </p>
        ) : null}
      </div>
      <div className={styles.controlColumn}>
        <div className={styles.dropzone}>
          <input
            {...props}
            aria-describedby={describedBy(id, description, errorMessage)}
            aria-invalid={errorMessage ? true : undefined}
            className={styles.input}
            id={id}
            type="file"
          />
          <label className={styles.trigger} htmlFor={id}>
            <AdminUploadIcon size={16} />
            <span>파일 선택</span>
          </label>
          <div className={styles.meta}>
            <span className={styles.fileName}>{visibleFileName}</span>
            <span className={styles.accept}>{acceptLabel}</span>
          </div>
        </div>
        {preview ? <div className={styles.preview}>{preview}</div> : null}
        {fileName && onRemove ? (
          <div className={styles.removeRow}>
            <AdminButton icon={<AdminTrashIcon size={16} />} onClick={onRemove} variant="danger">
              삭제
            </AdminButton>
          </div>
        ) : null}
        {errorMessage ? (
          <p className={styles.error} id={errorId(id)}>
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
