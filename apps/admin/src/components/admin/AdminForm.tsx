import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  AdminCalendarIcon,
  AdminCheckIcon,
  AdminChevronDownIcon,
} from "./icons";
import styles from "./AdminForm.module.css";

export type AdminSelectOption = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly value: string;
};

type AdminFormSectionProps = {
  readonly children: ReactNode;
  readonly description?: string;
  readonly title: string;
};

type AdminFieldRowProps = {
  readonly children: ReactNode;
  readonly description?: string;
  readonly errorMessage?: string;
  readonly htmlFor: string;
  readonly label: string;
  readonly labelHidden?: boolean;
  readonly layout?: "inline" | "stacked";
  readonly size?: "default" | "large";
};

type AdminTextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "className" | "id" | "size"
> & {
  readonly controlClassName?: string;
  readonly description?: string;
  readonly errorMessage?: string;
  readonly id: string;
  readonly label: string;
  readonly labelHidden?: boolean;
  readonly layout?: "inline" | "stacked";
  readonly size?: "default" | "large";
};

type AdminTextareaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "aria-describedby" | "className" | "id"
> & {
  readonly controlClassName?: string;
  readonly description?: string;
  readonly errorMessage?: string;
  readonly id: string;
  readonly label: string;
  readonly labelHidden?: boolean;
  readonly layout?: "inline" | "stacked";
  readonly size?: "default" | "large";
};

type AdminSelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "aria-describedby" | "children" | "className" | "id" | "size"
> & {
  readonly description?: string;
  readonly errorMessage?: string;
  readonly id: string;
  readonly label: string;
  readonly labelHidden?: boolean;
  readonly layout?: "inline" | "stacked";
  readonly options: readonly AdminSelectOption[];
  readonly size?: "default" | "large";
};

type AdminBottomActionBarProps = {
  readonly children: ReactNode;
};

type AdminFormPageProps = {
  readonly actions: ReactNode;
  readonly busy?: boolean;
  readonly children: ReactNode;
  readonly title: string;
};

type AdminFormActionsProps = {
  readonly leading: ReactNode;
  readonly trailing: ReactNode;
};

type AdminDateFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "className" | "id" | "type"
> & {
  readonly errorMessage?: string;
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
};

type AdminSettingToggleRowProps = {
  readonly checked: boolean;
  readonly count: number;
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: string;
  readonly onChange: (checked: boolean) => void;
};

function classNames(...values: readonly (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

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

export function AdminFormSection({
  children,
  description,
  title,
}: AdminFormSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description ? (
          <p className={styles.sectionDescription}>{description}</p>
        ) : null}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export function AdminFieldRow({
  children,
  description,
  errorMessage,
  htmlFor,
  label,
  labelHidden = false,
  layout = "inline",
  size = "default",
}: AdminFieldRowProps) {
  return (
    <div
      className={classNames(
        styles.field,
        layout === "stacked" ? styles.fieldStacked : undefined,
        size === "large" ? styles.fieldLarge : undefined,
      )}
    >
      <div className={labelHidden ? styles.fieldTextHidden : styles.fieldText}>
        <label
          className={classNames(
            styles.label,
            size === "large" ? styles.labelLarge : undefined,
          )}
          htmlFor={htmlFor}
        >
          {label}
        </label>
        {description ? (
          <p className={styles.description} id={descriptionId(htmlFor)}>
            {description}
          </p>
        ) : null}
      </div>
      <div className={styles.controlColumn}>
        {children}
        {errorMessage ? (
          <p className={styles.error} id={errorId(htmlFor)}>
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AdminTextField({
  controlClassName,
  description,
  errorMessage,
  id,
  label,
  labelHidden,
  layout,
  size,
  ...props
}: AdminTextFieldProps) {
  return (
    <AdminFieldRow
      description={description}
      errorMessage={errorMessage}
      htmlFor={id}
      label={label}
      labelHidden={labelHidden}
      layout={layout}
      size={size}
    >
      <input
        {...props}
        aria-describedby={describedBy(id, description, errorMessage)}
        aria-invalid={errorMessage ? true : undefined}
        className={classNames(
          styles.control,
          size === "large" ? styles.controlLarge : undefined,
          errorMessage ? styles.controlInvalid : undefined,
          controlClassName,
        )}
        id={id}
      />
    </AdminFieldRow>
  );
}

export function AdminTextareaField({
  controlClassName,
  description,
  errorMessage,
  id,
  label,
  labelHidden,
  layout,
  size,
  ...props
}: AdminTextareaFieldProps) {
  return (
    <AdminFieldRow
      description={description}
      errorMessage={errorMessage}
      htmlFor={id}
      label={label}
      labelHidden={labelHidden}
      layout={layout}
      size={size}
    >
      <textarea
        {...props}
        aria-describedby={describedBy(id, description, errorMessage)}
        aria-invalid={errorMessage ? true : undefined}
        className={classNames(
          styles.control,
          styles.textarea,
          size === "large" ? styles.controlLarge : undefined,
          errorMessage ? styles.controlInvalid : undefined,
          controlClassName,
        )}
        id={id}
      />
    </AdminFieldRow>
  );
}

export function AdminSelectField({
  description,
  errorMessage,
  id,
  label,
  labelHidden,
  layout,
  options,
  size,
  ...props
}: AdminSelectFieldProps) {
  return (
    <AdminFieldRow
      description={description}
      errorMessage={errorMessage}
      htmlFor={id}
      label={label}
      labelHidden={labelHidden}
      layout={layout}
      size={size}
    >
      <div className={styles.selectWrap}>
        <select
          {...props}
          aria-describedby={describedBy(id, description, errorMessage)}
          aria-invalid={errorMessage ? true : undefined}
          className={classNames(
            styles.control,
            styles.select,
            size === "large" ? styles.controlLarge : undefined,
            errorMessage ? styles.controlInvalid : undefined,
          )}
          data-empty={props.value === "" ? true : undefined}
          id={id}
        >
          {options.map((option) => (
            <option
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className={styles.selectIcon}>
          <AdminChevronDownIcon size={size === "large" ? 24 : 16} />
        </span>
      </div>
    </AdminFieldRow>
  );
}

export function AdminBottomActionBar({ children }: AdminBottomActionBarProps) {
  return <div className={styles.actionBar}>{children}</div>;
}

export function AdminFormPage({
  actions,
  busy = false,
  children,
  title,
}: AdminFormPageProps) {
  return (
    <section aria-labelledby="admin-form-title" className={styles.formPage}>
      <div aria-busy={busy} className={styles.formPanel}>
        <div className={styles.formBody}>
          <h1 className={styles.formTitle} id="admin-form-title">
            {title}
          </h1>
          {children}
        </div>
        {actions}
      </div>
    </section>
  );
}

export function AdminFormActions({ leading, trailing }: AdminFormActionsProps) {
  return (
    <div className={styles.formActions}>
      <div className={styles.formActionGroup}>{leading}</div>
      <div className={styles.formActionGroup}>{trailing}</div>
    </div>
  );
}

export function AdminDateField({
  errorMessage,
  id,
  label,
  placeholder,
  value,
  ...props
}: AdminDateFieldProps) {
  const visibleValue =
    typeof value === "string" && value.length > 0
      ? value.split("-").join(". ")
      : placeholder;

  return (
    <AdminFieldRow
      errorMessage={errorMessage}
      htmlFor={id}
      label={label}
      layout="stacked"
      size="large"
    >
      <div className={styles.dateControl}>
        <span className={value ? styles.dateValue : styles.datePlaceholder}>
          {visibleValue}
        </span>
        <span aria-hidden="true" className={styles.dateIcon}>
          <AdminCalendarIcon size={24} />
        </span>
        <input
          {...props}
          aria-describedby={errorMessage ? errorId(id) : undefined}
          aria-invalid={errorMessage ? true : undefined}
          className={styles.dateInput}
          id={id}
          type="date"
          value={value}
        />
      </div>
    </AdminFieldRow>
  );
}

export function AdminSettingToggleRow({
  checked,
  count,
  disabled,
  label,
  name,
  onChange,
}: AdminSettingToggleRowProps) {
  return (
    <label className={styles.settingToggle}>
      <input
        checked={checked}
        className={styles.settingInput}
        disabled={disabled}
        name={name}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span className={styles.settingRow}>
        <span className={styles.settingName}>
          <span
            className={
              checked ? styles.settingCheckActive : styles.settingCheck
            }
          >
            <AdminCheckIcon size={24} />
          </span>
          <span>{label}</span>
        </span>
        <span className={styles.settingCount}>{count}개 등록됨</span>
      </span>
    </label>
  );
}
