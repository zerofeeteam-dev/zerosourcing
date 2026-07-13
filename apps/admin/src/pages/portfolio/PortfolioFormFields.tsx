import type { ReactNode } from "react";
import { AdminCheckIcon, AdminChevronDownIcon } from "../../components/admin";
import { parsePortfolioFormType, portfolioTypeOptions } from "./portfolioModel";
import { PortfolioRepeatableTextFields } from "./PortfolioRepeatableTextFields";
import type { PortfolioFormErrors, PortfolioFormState } from "./portfolioTypes";
import styles from "../PortfolioAdminPage.module.css";

type PortfolioFormFieldsProps = {
  readonly fieldErrors: PortfolioFormErrors;
  readonly form: PortfolioFormState;
  readonly isDisabled: boolean;
  readonly onFormChange: (form: PortfolioFormState) => void;
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
  fieldErrors,
  form,
  isDisabled,
  onFormChange,
}: PortfolioFormFieldsProps) {
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
            onFormChange({ ...form, estimateLabel: event.currentTarget.value })
          }
          placeholder="견적을 입력해주세요."
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

      <fieldset className={styles.portfolioEditorField}>
        <legend className={styles.portfolioLabel}>포트폴리오 내용</legend>
        <div className={styles.portfolioEditorModes}>
          {(["html", "text"] as const).map((mode) => (
            <label className={styles.portfolioEditorOption} key={mode}>
              <input
                checked={form.contentMode === mode}
                disabled={isDisabled}
                name="portfolio-content-mode"
                onChange={() => onFormChange({ ...form, contentMode: mode })}
                type="radio"
                value={mode}
              />
              <span className={styles.portfolioEditorText}>
                {mode === "html" ? "HTML 작성" : "TEXT Editer 작성"}
              </span>
            </label>
          ))}
        </div>
        <textarea
          className={`${styles.portfolioControl} ${styles.portfolioContentTextarea}`}
          disabled={isDisabled}
          id="portfolio-content"
          onChange={(event) =>
            onFormChange({ ...form, content: event.currentTarget.value })
          }
          placeholder="포트폴리오 내용을 입력해주세요."
          value={form.content}
        />
      </fieldset>

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
                {(
                  sectionCount(sections) || (key === "landing" ? 6 : 3)
                ).toString()}
                개 등록됨
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
