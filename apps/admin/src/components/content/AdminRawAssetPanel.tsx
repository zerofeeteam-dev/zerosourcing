import { AdminButton } from "../admin/AdminButton";
import {
  rawAssetReviewStatusLabel,
  type RawAssetReviewItem,
} from "./rawAssetReview";
import styles from "./AdminContentEditor.module.css";

export type RawAssetCopyMessage = {
  readonly kind: "error" | "success";
  readonly text: string;
};

type AdminRawAssetPanelProps = {
  readonly assetBaseUrl: string | undefined;
  readonly assetError: string | null;
  readonly assets: readonly RawAssetReviewItem[];
  readonly busy: boolean;
  readonly contentAssetBaseEnabled: boolean;
  readonly contentAssetScope: string;
  readonly copyMessage: RawAssetCopyMessage | null;
  readonly disabled: boolean;
  readonly onAddFiles: (files: readonly File[]) => void;
  readonly onAssetBaseEnabledChange: (enabled: boolean) => void;
  readonly onCopyAssetValue: (label: string, value: string) => void;
  readonly onRemoveAsset: (item: RawAssetReviewItem) => void;
  readonly onRequestScopeRotation: () => void;
  readonly onRequestUploads: () => void;
  readonly onRelativePathChange: (id: string, relativePath: string) => void;
  readonly pendingCount: number;
};

export function AdminRawAssetPanel({
  assetBaseUrl,
  assetError,
  assets,
  busy,
  contentAssetBaseEnabled,
  contentAssetScope,
  copyMessage,
  disabled,
  onAddFiles,
  onAssetBaseEnabledChange,
  onCopyAssetValue,
  onRemoveAsset,
  onRequestScopeRotation,
  onRequestUploads,
  onRelativePathChange,
  pendingCount,
}: AdminRawAssetPanelProps) {
  return (
    <section className={styles.assetSection}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>HTML asset</h3>
          <p className={styles.description}>
            PNG, JPEG, WEBP 파일의 상대경로를 검토한 뒤 현재 scope에 올립니다.
          </p>
        </div>
        <AdminButton
          disabled={disabled || busy || pendingCount > 0}
          onClick={onRequestScopeRotation}
          variant="secondary"
        >
          새 asset 버전
        </AdminButton>
      </div>
      <label className={styles.baseOption}>
        <input
          checked={contentAssetBaseEnabled}
          disabled={disabled || pendingCount > 0}
          onChange={(event) =>
            onAssetBaseEnabledChange(event.currentTarget.checked)
          }
          type="checkbox"
        />
        <span>Storage 상대경로 기준 사용</span>
      </label>
      <p className={styles.scopeValue}>asset scope: {contentAssetScope}</p>
      {contentAssetBaseEnabled && !assetBaseUrl ? (
        <p className={styles.error} role="alert">
          Storage 기준 URL을 만들 수 없습니다. Supabase 설정과 asset scope를
          확인해 주세요.
        </p>
      ) : null}
      <label className={styles.assetPicker} aria-disabled={disabled}>
        <span>asset 파일 선택</span>
        <input
          accept="image/png,image/jpeg,image/webp"
          className={styles.visuallyHiddenInput}
          disabled={disabled}
          multiple
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            onAddFiles(files);
          }}
          type="file"
        />
      </label>
      {assets.length > 0 ? (
        <ol className={styles.assetList}>
          {assets.map((item) => (
            <li className={styles.assetRow} key={item.id}>
              <div className={styles.assetRowHeader}>
                <span className={styles.assetName}>{item.file.name}</span>
                <span className={styles.assetStatus}>
                  {rawAssetReviewStatusLabel(item.status)}
                </span>
              </div>
              <label className={styles.field} htmlFor={`raw-asset-${item.id}`}>
                <span className={styles.label}>저장 상대경로</span>
                <input
                  className={styles.pathInput}
                  disabled={
                    disabled ||
                    item.status === "uploading" ||
                    item.status === "uploaded" ||
                    item.status === "removing"
                  }
                  id={`raw-asset-${item.id}`}
                  onChange={(event) =>
                    onRelativePathChange(item.id, event.currentTarget.value)
                  }
                  value={item.relativePath}
                />
              </label>
              {item.path ? (
                <div className={styles.assetResultRow}>
                  <p className={styles.assetResult}>저장 경로: {item.path}</p>
                  <AdminButton
                    disabled={disabled}
                    onClick={() =>
                      onCopyAssetValue("저장 경로", item.path ?? "")
                    }
                    size="sm"
                    variant="ghost"
                  >
                    저장 경로 복사
                  </AdminButton>
                </div>
              ) : null}
              {item.publicUrl ? (
                <div className={styles.assetResultRow}>
                  <p className={styles.assetResult}>
                    공개 URL: {item.publicUrl}
                  </p>
                  <AdminButton
                    disabled={disabled}
                    onClick={() =>
                      onCopyAssetValue("공개 URL", item.publicUrl ?? "")
                    }
                    size="sm"
                    variant="ghost"
                  >
                    공개 URL 복사
                  </AdminButton>
                </div>
              ) : null}
              {item.errorMessage ? (
                <p className={styles.error} role="alert">
                  {item.errorMessage}
                </p>
              ) : null}
              <AdminButton
                disabled={
                  disabled ||
                  item.status === "uploading" ||
                  item.status === "removing"
                }
                onClick={() => onRemoveAsset(item)}
                size="sm"
                variant="ghost"
              >
                {item.status === "uploaded"
                  ? "Storage에서 제거"
                  : "목록에서 제거"}
              </AdminButton>
            </li>
          ))}
        </ol>
      ) : null}
      <AdminButton
        disabled={disabled || pendingCount > 0 || assets.length === 0}
        onClick={onRequestUploads}
      >
        선택 asset 업로드
      </AdminButton>
      {assetError ? (
        <p className={styles.error} role="alert">
          {assetError}
        </p>
      ) : null}
      {copyMessage ? (
        <p
          className={
            copyMessage.kind === "error" ? styles.error : styles.copyStatus
          }
          role={copyMessage.kind === "error" ? "alert" : "status"}
        >
          {copyMessage.text}
        </p>
      ) : null}
    </section>
  );
}
