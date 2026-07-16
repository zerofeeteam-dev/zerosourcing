import type { ReactNode } from "react";
import {
  AdminCheckIcon,
  AdminChevronDownIcon,
  AdminUploadControl,
} from "../../components/admin";
import { AdminContentEditor } from "../../components/content/AdminContentEditor";
import type { ManagedContentFormValue } from "../../lib/managedContent";
import type { AdminThumbnailSelection } from "../content/useAdminThumbnailSelection";
import { parsePortfolioFormType, portfolioTypeOptions } from "./portfolioModel";
import { PortfolioRepeatableTextFields } from "./PortfolioRepeatableTextFields";
import type { PortfolioFormErrors, PortfolioFormState } from "./portfolioTypes";
import styles from "../PortfolioAdminPage.module.css";

type PortfolioFormFieldsProps = {
  readonly banner: AdminThumbnailSelection;
  readonly contentPreviewContainer: HTMLElement | null;
  readonly documentKey: string;
  readonly fieldErrors: PortfolioFormErrors;
  readonly form: PortfolioFormState;
  readonly isDisabled: boolean;
  readonly onContentBusyChange: (busy: boolean) => void;
  readonly onBannerChange: (fileList: FileList | null) => void;
  readonly onBannerRemove: () => void;
  readonly onContentChange: (value: ManagedContentFormValue) => void;
  readonly onFormChange: (form: PortfolioFormState) => void;
  readonly onPendingAssetCountChange: (count: number) => void;
  readonly onThumbnailChange: (fileList: FileList | null) => void;
  readonly onThumbnailRemove: () => void;
  readonly thumbnail: AdminThumbnailSelection;
};

type PortfolioFieldProps = {
  readonly children: ReactNode;
  readonly errorMessage?: string;
  readonly htmlFor: string;
  readonly label: string;
};

function PortfolioField({
  children,
  errorMessage,
  htmlFor,
  label,
}: PortfolioFieldProps) {
  return (
    <div className={styles.portfolioField}>
      <label className={styles.portfolioLabel} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {errorMessage ? (
        <p className={styles.portfolioFieldError} id={`${htmlFor}-error`}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function sectionCount(value: string): number {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === "object") return Object.keys(parsed).length;
  } catch {
    return 0;
  }
  return 0;
}

export function PortfolioFormFields({
  banner,
  contentPreviewContainer,
  documentKey,
  fieldErrors,
  form,
  isDisabled,
  onBannerChange,
  onBannerRemove,
  onContentBusyChange,
  onContentChange,
  onFormChange,
  onPendingAssetCountChange,
  onThumbnailChange,
  onThumbnailRemove,
  thumbnail,
}: PortfolioFormFieldsProps) {
  const visiblePreview = thumbnail.previewUrl && !thumbnail.removed;
  const visibleFileName =
    thumbnail.selected?.file.name ??
    (visiblePreview ? "저장된 썸네일" : undefined);
  const visibleBannerPreview = banner.previewUrl && !banner.removed;
  const visibleBannerFileName =
    banner.selected?.file.name ??
    (visibleBannerPreview ? "저장된 배너" : undefined);

  return (
    <div className={styles.portfolioFields}>
      <PortfolioField
        errorMessage={fieldErrors.type}
        htmlFor="portfolio-type"
        label="포트폴리오 유형"
      >
        <div className={styles.portfolioSelectWrap}>
          <select
            aria-describedby={
              fieldErrors.type ? "portfolio-type-error" : undefined
            }
            aria-invalid={fieldErrors.type ? true : undefined}
            className={styles.portfolioControl}
            data-empty={form.type === ""}
            disabled={isDisabled}
            id="portfolio-type"
            onChange={(event) =>
              onFormChange({
                ...form,
                type: parsePortfolioFormType(event.currentTarget.value),
              })
            }
            value={form.type}
          >
            <option disabled value="">
              포트폴리오 유형을 선택해주세요.
            </option>
            {portfolioTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className={styles.portfolioSelectIcon}>
            <AdminChevronDownIcon size={24} />
          </span>
        </div>
      </PortfolioField>

      <PortfolioField
        errorMessage={fieldErrors.slug}
        htmlFor="portfolio-slug"
        label="포트폴리오 Slug"
      >
        <input
          aria-describedby={
            fieldErrors.slug ? "portfolio-slug-error" : undefined
          }
          aria-invalid={fieldErrors.slug ? true : undefined}
          className={styles.portfolioControl}
          disabled={isDisabled}
          id="portfolio-slug"
          onChange={(event) =>
            onFormChange({ ...form, slug: event.currentTarget.value })
          }
          placeholder="포트폴리오 Slug를 입력해주세요. (영문만 작성)"
          value={form.slug}
        />
      </PortfolioField>

      <PortfolioField
        errorMessage={fieldErrors.companyName}
        htmlFor="portfolio-company-name"
        label="기업명"
      >
        <input
          aria-describedby={
            fieldErrors.companyName ? "portfolio-company-name-error" : undefined
          }
          aria-invalid={fieldErrors.companyName ? true : undefined}
          className={styles.portfolioControl}
          disabled={isDisabled}
          id="portfolio-company-name"
          onChange={(event) =>
            onFormChange({
              ...form,
              companyName: event.currentTarget.value,
              title: event.currentTarget.value,
            })
          }
          placeholder="기업명을 입력해주세요."
          value={form.companyName}
        />
      </PortfolioField>

      <PortfolioField
        htmlFor="portfolio-product-description"
        label="프로덕트 설명"
      >
        <input
          className={styles.portfolioControl}
          disabled={isDisabled}
          id="portfolio-product-description"
          onChange={(event) =>
            onFormChange({
              ...form,
              productDescription: event.currentTarget.value,
            })
          }
          placeholder="프로덕트 설명을 입력해주세요."
          value={form.productDescription}
        />
      </PortfolioField>

      <PortfolioField htmlFor="portfolio-estimate-label" label="견적">
        <input
          className={styles.portfolioControl}
          disabled={isDisabled}
          id="portfolio-estimate-label"
          onChange={(event) =>
            onFormChange({
              ...form,
              estimateLabel: event.currentTarget.value,
            })
          }
          placeholder="견적을 입력해주세요."
          type="text"
          value={form.estimateLabel}
        />
      </PortfolioField>

      <PortfolioField htmlFor="portfolio-development-period" label="개발 기간">
        <input
          className={styles.portfolioControl}
          disabled={isDisabled}
          id="portfolio-development-period"
          onChange={(event) =>
            onFormChange({
              ...form,
              developmentPeriod: event.currentTarget.value,
            })
          }
          placeholder="개발 기간을 입력해주세요."
          value={form.developmentPeriod}
        />
      </PortfolioField>

      <PortfolioRepeatableTextFields
        disabled={isDisabled}
        idPrefix="portfolio-core-feature"
        items={form.coreFeatures}
        label="핵심 기능"
        onChange={(coreFeatures) => onFormChange({ ...form, coreFeatures })}
      />
      <PortfolioRepeatableTextFields
        disabled={isDisabled}
        idPrefix="portfolio-work-scope"
        items={form.workScopes}
        label="작업 범위"
        onChange={(workScopes) => onFormChange({ ...form, workScopes })}
      />

      <div className={styles.portfolioThumbnailGroup}>
        <PortfolioField
          errorMessage={fieldErrors.thumbnailAlt}
          htmlFor="portfolio-thumbnail-alt"
          label="포트폴리오 썸네일"
        >
          <input
            aria-describedby={
              fieldErrors.thumbnailAlt
                ? "portfolio-thumbnail-alt-error"
                : undefined
            }
            aria-invalid={fieldErrors.thumbnailAlt ? true : undefined}
            className={styles.portfolioControl}
            disabled={isDisabled}
            id="portfolio-thumbnail-alt"
            onChange={(event) =>
              onFormChange({
                ...form,
                thumbnailAlt: event.currentTarget.value,
              })
            }
            placeholder="IMAGE ALT TAG를 입력해주세요."
            value={form.thumbnailAlt}
          />
        </PortfolioField>
        <AdminUploadControl
          accept="image/png,image/jpeg,image/webp"
          acceptLabel="1080 × 720 자동 맞춤 / PNG, JPEG, WEBP 등 / 최대 50MB 제한"
          disabled={isDisabled}
          errorMessage={fieldErrors.thumbnail}
          fileName={visibleFileName}
          id="portfolio-thumbnail"
          label="포트폴리오 썸네일 파일"
          labelHidden
          onChange={(event) => onThumbnailChange(event.currentTarget.files)}
          onFiles={onThumbnailChange}
          onRemove={
            visiblePreview || thumbnail.selected ? onThumbnailRemove : undefined
          }
          preview={
            visiblePreview ? (
              <img
                alt={form.thumbnailAlt || "Portfolio thumbnail preview"}
                className={styles.portfolioThumbnailPreview}
                src={thumbnail.previewUrl}
              />
            ) : undefined
          }
          previewFullBleed
          variant="dropzone"
        />
      </div>

      <div className={styles.portfolioThumbnailGroup}>
        <PortfolioField
          errorMessage={fieldErrors.bannerAlt}
          htmlFor="portfolio-banner-alt"
          label="포트폴리오 배너"
        >
          <input
            aria-describedby={
              fieldErrors.bannerAlt ? "portfolio-banner-alt-error" : undefined
            }
            aria-invalid={fieldErrors.bannerAlt ? true : undefined}
            className={styles.portfolioControl}
            disabled={isDisabled}
            id="portfolio-banner-alt"
            onChange={(event) =>
              onFormChange({
                ...form,
                bannerAlt: event.currentTarget.value,
              })
            }
            placeholder="IMAGE ALT TAG를 입력해주세요."
            value={form.bannerAlt}
          />
        </PortfolioField>
        <AdminUploadControl
          accept="image/png,image/jpeg,image/webp"
          acceptLabel="1080 × 720 자동 맞춤 / PNG, JPEG, WEBP 등 / 최대 50MB 제한"
          disabled={isDisabled}
          errorMessage={fieldErrors.banner}
          fileName={visibleBannerFileName}
          id="portfolio-banner"
          label="포트폴리오 배너 파일"
          labelHidden
          onChange={(event) => onBannerChange(event.currentTarget.files)}
          onFiles={onBannerChange}
          onRemove={
            visibleBannerPreview || banner.selected ? onBannerRemove : undefined
          }
          preview={
            visibleBannerPreview ? (
              <img
                alt={form.bannerAlt || "Portfolio banner preview"}
                className={styles.portfolioThumbnailPreview}
                src={banner.previewUrl}
              />
            ) : undefined
          }
          previewFullBleed
          variant="dropzone"
        />
      </div>

      <div
        aria-describedby={
          fieldErrors.content ? "portfolio-content-error" : undefined
        }
        aria-invalid={fieldErrors.content ? true : undefined}
        className={styles.portfolioContentField}
        role="group"
        tabIndex={fieldErrors.content ? -1 : undefined}
      >
        <AdminContentEditor
          disabled={isDisabled}
          documentKey={documentKey}
          entity="portfolio"
          onBusyChange={onContentBusyChange}
          onChange={onContentChange}
          onPendingAssetCountChange={onPendingAssetCountChange}
          previewContainer={contentPreviewContainer}
          value={form}
        />
        {fieldErrors.content ? (
          <p
            className={styles.portfolioFieldError}
            id="portfolio-content-error"
            role="alert"
          >
            {fieldErrors.content}
          </p>
        ) : null}
      </div>

      <PortfolioField
        htmlFor="portfolio-seo-description"
        label="SEO Description"
      >
        <textarea
          className={`${styles.portfolioControl} ${styles.portfolioSeoTextarea}`}
          disabled={isDisabled}
          id="portfolio-seo-description"
          onChange={(event) =>
            onFormChange({ ...form, seoDescription: event.currentTarget.value })
          }
          placeholder="SEO Description을 입력해주세요."
          value={form.seoDescription}
        />
      </PortfolioField>

      <div className={styles.portfolioSettings}>
        {(
          [
            [
              "landing",
              "랜딩 설정",
              form.landingSections,
              form.landingPublished,
            ],
            [
              "service",
              "서비스 섹션 설정",
              form.serviceSections,
              form.servicePublished,
            ],
          ] as const
        ).map(([key, label, sections, published]) => (
          <label className={styles.portfolioSettingsToggle} key={key}>
            <input
              aria-label={`${label} 노출`}
              checked={published}
              className={styles.portfolioSettingsInput}
              disabled={isDisabled}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  ...(key === "landing"
                    ? { landingPublished: event.currentTarget.checked }
                    : { servicePublished: event.currentTarget.checked }),
                })
              }
              type="checkbox"
            />
            <span className={styles.portfolioSettingsRow}>
              <span className={styles.portfolioSettingsName}>
                <span
                  className={
                    published
                      ? styles.portfolioSettingsCheckActive
                      : styles.portfolioSettingsCheck
                  }
                >
                  <AdminCheckIcon size={24} />
                </span>
                <span>{label}</span>
              </span>
              <span className={styles.portfolioSettingsCount}>
                {sectionCount(sections).toString()}개 등록됨
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
