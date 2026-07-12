import {
  AdminDateField,
  AdminEditorModeSegmentedControl,
  AdminSelectField,
  AdminSettingToggleRow,
  AdminTextField,
  AdminTextareaField,
  AdminUploadControl,
} from "../../components/admin";
import {
  blogFormTypeFromValue,
  blogSectionCount,
  blogTypeOptions,
} from "./blogModel";
import type {
  BlogFieldChange,
  BlogFieldErrors,
  BlogFormState,
  BlogThumbnailSelection,
} from "./blogTypes";
import styles from "../BlogAdminPage.module.css";

type BlogFormFieldsProps = {
  readonly fieldErrors: BlogFieldErrors;
  readonly form: BlogFormState;
  readonly isDisabled: boolean;
  readonly onFieldChange: BlogFieldChange;
  readonly onThumbnailChange: (fileList: FileList | null) => void;
  readonly onThumbnailRemove: () => void;
  readonly thumbnail: BlogThumbnailSelection;
};

const blogFormTypeOptions = [
  { disabled: true, label: "블로그유형을 선택해주세요.", value: "" },
  ...blogTypeOptions,
] as const;

export function BlogFormFields({
  fieldErrors,
  form,
  isDisabled,
  onFieldChange,
  onThumbnailChange,
  onThumbnailRemove,
  thumbnail,
}: BlogFormFieldsProps) {
  const visiblePreview = thumbnail.previewUrl && !thumbnail.removed;
  const visibleFileName = thumbnail.selected?.file.name ?? (visiblePreview ? "저장된 썸네일" : undefined);

  return (
    <div className={styles.blogFormFields}>
      <AdminSelectField
        disabled={isDisabled}
        errorMessage={fieldErrors.type}
        id="blog-type"
        label="블로그 유형"
        layout="stacked"
        onChange={(event) => onFieldChange("type", blogFormTypeFromValue(event.currentTarget.value))}
        options={blogFormTypeOptions}
        size="large"
        value={form.type}
      />

      <AdminTextField
        disabled={isDisabled}
        errorMessage={fieldErrors.title}
        id="blog-title"
        label="블로그 제목"
        layout="stacked"
        onChange={(event) => onFieldChange("title", event.currentTarget.value)}
        placeholder="블로그 제목을 입력해주세요."
        size="large"
        value={form.title}
      />

      <AdminTextField
        disabled={isDisabled}
        errorMessage={fieldErrors.slug}
        id="blog-slug"
        label="블로그 Slug"
        layout="stacked"
        onChange={(event) => onFieldChange("slug", event.currentTarget.value)}
        placeholder="블로그 Slug를 입력해주세요. (영문만 작성)"
        size="large"
        value={form.slug}
      />

      <AdminDateField
        disabled={isDisabled}
        errorMessage={fieldErrors.publishedDate}
        id="blog-published-date"
        label="블로그 작성일"
        onChange={(event) => onFieldChange("publishedDate", event.currentTarget.value)}
        placeholder="블로그 작성일을 선택해주세요."
        value={form.publishedDate}
      />

      <div className={styles.thumbnailGroup}>
        <AdminTextField
          disabled={isDisabled}
          id="blog-thumbnail-alt"
          label="블로그 썸네일"
          layout="stacked"
          onChange={(event) => onFieldChange("thumbnailAlt", event.currentTarget.value)}
          placeholder="IMAGE ALT TAG를 입력해주세요."
          size="large"
          value={form.thumbnailAlt}
        />
        <AdminUploadControl
          accept="image/png,image/jpeg,image/webp"
          acceptLabel="PNG, JPEG, WEBP 등 / 최대 50MB 제한"
          disabled={isDisabled}
          errorMessage={fieldErrors.thumbnail}
          fileName={visibleFileName}
          id="blog-thumbnail"
          label="블로그 썸네일 파일"
          labelHidden
          onChange={(event) => onThumbnailChange(event.currentTarget.files)}
          onFiles={onThumbnailChange}
          onRemove={visiblePreview || thumbnail.selected ? onThumbnailRemove : undefined}
          preview={
            visiblePreview ? (
              <img
                alt={form.thumbnailAlt || "Blog thumbnail preview"}
                className={styles.thumbnailPreview}
                src={thumbnail.previewUrl}
              />
            ) : undefined
          }
          variant="dropzone"
        />
      </div>

      <div className={styles.contentField}>
        <AdminEditorModeSegmentedControl
          disabled={isDisabled}
          fullWidth
          id="blog-content-mode"
          label="블로그 내용"
          name="blog-content-mode"
          onChange={(mode) => onFieldChange("contentMode", mode)}
          value={form.contentMode}
        />
        <AdminTextareaField
          controlClassName={styles.contentTextarea}
          disabled={isDisabled}
          id="blog-content"
          label="블로그 내용 입력"
          labelHidden
          layout="stacked"
          onChange={(event) => onFieldChange("content", event.currentTarget.value)}
          placeholder="블로그 내용을 입력해주세요."
          size="large"
          value={form.content}
        />
      </div>

      <AdminTextareaField
        controlClassName={styles.seoTextarea}
        disabled={isDisabled}
        id="blog-seo-description"
        label="SEO Description"
        layout="stacked"
        onChange={(event) => onFieldChange("seoDescription", event.currentTarget.value)}
        placeholder="SEO Description을 입력해주세요."
        size="large"
        value={form.seoDescription}
      />

      <div className={styles.settingsRows}>
        <AdminSettingToggleRow
          checked={form.landingPublished}
          count={blogSectionCount(form.landingSections)}
          disabled={isDisabled}
          label="랜딩 설정"
          name="blog-landing-published"
          onChange={(checked) => onFieldChange("landingPublished", checked)}
        />
        <AdminSettingToggleRow
          checked={form.bannerPublished}
          count={blogSectionCount(form.bannerSections)}
          disabled={isDisabled}
          label="배너 설정"
          name="blog-banner-published"
          onChange={(checked) => onFieldChange("bannerPublished", checked)}
        />
      </div>
    </div>
  );
}
