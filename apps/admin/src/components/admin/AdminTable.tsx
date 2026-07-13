import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { useId } from "react";
import { AdminChevronDownIcon, AdminSearchIcon } from "./icons";
import styles from "./AdminTable.module.css";

type AdminTableAlignment = "center" | "left" | "right";

export type AdminStatusTone =
  | "danger"
  | "info"
  | "neutral"
  | "success"
  | "warning";

export type AdminTableColumn<Row> = {
  readonly align?: AdminTableAlignment;
  readonly header: string;
  readonly key: string;
  readonly render: (row: Row) => ReactNode;
  readonly width: number;
};

type AdminTableShellProps = {
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly contentWidth: number;
  readonly filters?: ReactNode;
  readonly title: string;
  readonly titleId?: string;
};

type AdminFilterBarProps = {
  readonly children: ReactNode;
};

type AdminSearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id" | "type"
> & {
  readonly id: string;
  readonly label: string;
};

type AdminFilterSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "className" | "id"
> & {
  readonly children: ReactNode;
  readonly id: string;
  readonly label: string;
};

type AdminTableProps<Row> = {
  readonly ariaLabel: string;
  readonly columns: readonly AdminTableColumn<Row>[];
  readonly emptyState?: ReactNode;
  readonly getRowKey: (row: Row) => string;
  readonly rows: readonly Row[];
};

type AdminEmptyStateProps = {
  readonly action?: ReactNode;
  readonly description: string;
  readonly icon?: ReactNode;
  readonly title: string;
};

type AdminStatusChipProps = {
  readonly children: ReactNode;
  readonly tone?: AdminStatusTone;
};

function classNames(...values: readonly (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function chipToneClassName(tone: AdminStatusTone): string | undefined {
  if (tone === "danger") return styles.chipDanger;
  if (tone === "info") return styles.chipInfo;
  if (tone === "success") return styles.chipSuccess;
  if (tone === "warning") return styles.chipWarning;
  return styles.chipNeutral;
}

function alignmentClassName(
  align: AdminTableAlignment | undefined,
): string | undefined {
  if (align === "center") return styles.alignCenter;
  if (align === "left") return styles.alignLeft;
  if (align === "right") return styles.alignRight;
  return undefined;
}

function tableShellStyle(contentWidth: number): CSSProperties {
  return { "--admin-table-width": `${contentWidth}px` } as CSSProperties;
}

function tableGridStyle<Row>(
  columns: readonly AdminTableColumn<Row>[],
): CSSProperties {
  return {
    gridTemplateColumns: columns.map((column) => `${column.width}px`).join(" "),
  };
}

export function AdminTableShell({
  action,
  children,
  contentWidth,
  filters,
  title,
  titleId,
}: AdminTableShellProps) {
  const generatedTitleId = useId();
  const headingId = titleId ?? generatedTitleId;

  return (
    <section aria-labelledby={headingId} className={styles.panel}>
      <div className={styles.panelInner} style={tableShellStyle(contentWidth)}>
        <div className={styles.panelContent}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id={headingId}>
              {title}
            </h2>
            {filters}
          </div>
          {children}
        </div>
        {action ? <div className={styles.panelAction}>{action}</div> : null}
      </div>
    </section>
  );
}

export function AdminFilterBar({ children }: AdminFilterBarProps) {
  return <div className={styles.filterBar}>{children}</div>;
}

export function AdminSearchField({
  id,
  label,
  ...props
}: AdminSearchFieldProps) {
  return (
    <label className={styles.searchField} htmlFor={id}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.searchControl}>
        <AdminSearchIcon size={20} />
        <input
          {...props}
          className={styles.searchInput}
          id={id}
          type="search"
        />
      </div>
    </label>
  );
}

export function AdminFilterSelect({
  children,
  id,
  label,
  ...props
}: AdminFilterSelectProps) {
  return (
    <label className={styles.filterSelect} htmlFor={id}>
      <span className={styles.filterLabel}>{label}</span>
      <span className={styles.selectControl}>
        <select {...props} className={styles.select} id={id}>
          {children}
        </select>
        <AdminChevronDownIcon size={20} />
      </span>
    </label>
  );
}

export function AdminTable<Row>({
  ariaLabel,
  columns,
  emptyState,
  getRowKey,
  rows,
}: AdminTableProps<Row>) {
  const renderedEmptyState = emptyState ?? (
    <span role="status">조회할 데이터가 없습니다.</span>
  );
  const gridStyle = tableGridStyle(columns);

  return (
    <div className={styles.tableWrap}>
      <div aria-label={ariaLabel} className={styles.table} role="table">
        <div className={styles.headerRow} role="row" style={gridStyle}>
          {columns.map((column, index) => (
            <span
              className={classNames(
                styles.headerCell,
                alignmentClassName(column.align),
              )}
              key={column.key}
              role="columnheader"
            >
              {column.header}
              {index < columns.length - 1 ? (
                <span aria-hidden="true" className={styles.columnDivider} />
              ) : null}
            </span>
          ))}
        </div>
        {rows.length > 0 ? (
          <div className={styles.rows} role="rowgroup">
            {rows.map((row) => (
              <div
                className={styles.tableRow}
                key={getRowKey(row)}
                role="row"
                style={gridStyle}
              >
                {columns.map((column) => (
                  <span
                    className={classNames(
                      styles.bodyCell,
                      alignmentClassName(column.align),
                    )}
                    key={column.key}
                    role="cell"
                  >
                    {column.render(row)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyRow} role="rowgroup">
            <div
              aria-colspan={columns.length}
              className={styles.emptyCell}
              role="cell"
            >
              {renderedEmptyState}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminEmptyState({
  action,
  description,
  icon,
  title,
}: AdminEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon ? <span className={styles.emptyIcon}>{icon}</span> : null}
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyDescription}>{description}</p>
      {action}
    </div>
  );
}

export function AdminStatusChip({
  children,
  tone = "neutral",
}: AdminStatusChipProps) {
  return (
    <span className={classNames(styles.chip, chipToneClassName(tone))}>
      {children}
    </span>
  );
}
