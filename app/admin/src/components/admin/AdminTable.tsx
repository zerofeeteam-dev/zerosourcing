import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { AdminSearchIcon } from "./icons";
import styles from "./AdminTable.module.css";

type AdminTableAlignment = "center" | "left" | "right";

export type AdminStatusTone = "danger" | "info" | "neutral" | "success" | "warning";

export type AdminTableColumn<Row> = {
  readonly align?: AdminTableAlignment;
  readonly header: string;
  readonly key: string;
  readonly render: (row: Row) => ReactNode;
  readonly width?: string;
};

type AdminTableShellProps = {
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly description?: string;
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

function alignmentClassName(align: AdminTableAlignment | undefined): string | undefined {
  if (align === "center") return styles.alignCenter;
  if (align === "right") return styles.alignRight;
  return undefined;
}

function widthStyle(width: string | undefined): CSSProperties | undefined {
  if (!width) return undefined;
  return { width };
}

export function AdminTableShell({
  actions,
  children,
  description,
  filters,
  title,
  titleId,
}: AdminTableShellProps) {
  const generatedTitleId = useId();
  const headingId = titleId ?? generatedTitleId;

  return (
    <section aria-labelledby={headingId} className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle} id={headingId}>
            {title}
          </h2>
          {description ? <p className={styles.panelDescription}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.panelActions}>{actions}</div> : null}
      </div>
      {filters ? (
        <>
          <span aria-hidden="true" className={styles.divider} />
          {filters}
        </>
      ) : null}
      {children}
    </section>
  );
}

export function AdminFilterBar({ children }: AdminFilterBarProps) {
  return <div className={styles.filterBar}>{children}</div>;
}

export function AdminSearchField({ id, label, ...props }: AdminSearchFieldProps) {
  return (
    <div className={styles.searchField}>
      <label className={styles.filterLabel} htmlFor={id}>
        {label}
      </label>
      <div className={styles.searchControl}>
        <AdminSearchIcon size={16} />
        <input {...props} className={styles.searchInput} id={id} type="search" />
      </div>
    </div>
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
    <AdminEmptyState description="조건에 맞는 항목이 없습니다." title="표시할 데이터가 없습니다." />
  );

  return (
    <div className={styles.tableWrap}>
      <table aria-label={ariaLabel} className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={alignmentClassName(column.align)}
                key={column.key}
                scope="col"
                style={widthStyle(column.width)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td className={alignmentClassName(column.align)} key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className={styles.emptyCell} colSpan={columns.length}>
                {renderedEmptyState}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminEmptyState({ action, description, icon, title }: AdminEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon ? <span className={styles.emptyIcon}>{icon}</span> : null}
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyDescription}>{description}</p>
      {action}
    </div>
  );
}

export function AdminStatusChip({ children, tone = "neutral" }: AdminStatusChipProps) {
  return <span className={classNames(styles.chip, chipToneClassName(tone))}>{children}</span>;
}
