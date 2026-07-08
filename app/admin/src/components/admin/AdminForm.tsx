import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { AdminChevronDownIcon } from "./icons";
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
};

type AdminTextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "className" | "id"
> & {
  readonly description?: string;
  readonly errorMessage?: string;
  readonly id: string;
  readonly label: string;
};

type AdminTextareaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "aria-describedby" | "className" | "id"
> & {
  readonly description?: string;
  readonly errorMessage?: string;
  readonly id: string;
  readonly label: string;
};

type AdminSelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "aria-describedby" | "children" | "className" | "id"
> & {
  readonly description?: string;
  readonly errorMessage?: string;
  readonly id: string;
  readonly label: string;
  readonly options: readonly AdminSelectOption[];
};

type AdminBottomActionBarProps = {
  readonly children: ReactNode;
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

export function AdminFormSection({ children, description, title }: AdminFormSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description ? <p className={styles.sectionDescription}>{description}</p> : null}
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
}: AdminFieldRowProps) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldText}>
        <label className={styles.label} htmlFor={htmlFor}>
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
  description,
  errorMessage,
  id,
  label,
  ...props
}: AdminTextFieldProps) {
  return (
    <AdminFieldRow
      description={description}
      errorMessage={errorMessage}
      htmlFor={id}
      label={label}
    >
      <input
        {...props}
        aria-describedby={describedBy(id, description, errorMessage)}
        aria-invalid={errorMessage ? true : undefined}
        className={classNames(styles.control, errorMessage ? styles.controlInvalid : undefined)}
        id={id}
      />
    </AdminFieldRow>
  );
}

export function AdminTextareaField({
  description,
  errorMessage,
  id,
  label,
  ...props
}: AdminTextareaFieldProps) {
  return (
    <AdminFieldRow
      description={description}
      errorMessage={errorMessage}
      htmlFor={id}
      label={label}
    >
      <textarea
        {...props}
        aria-describedby={describedBy(id, description, errorMessage)}
        aria-invalid={errorMessage ? true : undefined}
        className={classNames(
          styles.control,
          styles.textarea,
          errorMessage ? styles.controlInvalid : undefined,
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
  options,
  ...props
}: AdminSelectFieldProps) {
  return (
    <AdminFieldRow
      description={description}
      errorMessage={errorMessage}
      htmlFor={id}
      label={label}
    >
      <div className={styles.selectWrap}>
        <select
          {...props}
          aria-describedby={describedBy(id, description, errorMessage)}
          aria-invalid={errorMessage ? true : undefined}
          className={classNames(
            styles.control,
            styles.select,
            errorMessage ? styles.controlInvalid : undefined,
          )}
          id={id}
        >
          {options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className={styles.selectIcon}>
          <AdminChevronDownIcon size={16} />
        </span>
      </div>
    </AdminFieldRow>
  );
}

export function AdminBottomActionBar({ children }: AdminBottomActionBarProps) {
  return <div className={styles.actionBar}>{children}</div>;
}
