import type { MouseEvent, ReactNode } from "react";
import styles from "./AdminShell.module.css";

export type AdminNavKey = "blog" | "linkPay" | "portfolio";

export type AdminNavItem = {
  readonly href: string;
  readonly icon?: ReactNode;
  readonly key: AdminNavKey;
  readonly label: string;
};

export const adminNavItems = [
  { href: "/portfolio", key: "portfolio", label: "Portfolio" },
  { href: "/blog", key: "blog", label: "Blog" },
  { href: "/link-pay", key: "linkPay", label: "Link Pay" },
] as const satisfies readonly AdminNavItem[];

type AdminShellProps = {
  readonly activeItem: AdminNavKey;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly navItems?: readonly AdminNavItem[];
  readonly onNavigate?: (item: AdminNavItem) => void;
};

type AdminPageHeaderProps = {
  readonly actions?: ReactNode;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly title: string;
};

function classNames(...values: readonly (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export function AdminShell({
  activeItem,
  children,
  footer,
  navItems = adminNavItems,
  onNavigate,
}: AdminShellProps) {
  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>, item: AdminNavItem) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(item);
  };

  return (
    <div className={styles.shell}>
      <aside aria-label="Admin navigation" className={styles.sidebar}>
        <strong className={styles.brand}>Zerosourcing</strong>
        <nav aria-label="Primary admin sections" className={styles.nav}>
          {navItems.map((item) => {
            const isActive = item.key === activeItem;

            return (
              <a
                aria-current={isActive ? "page" : undefined}
                className={classNames(styles.navLink, isActive ? styles.navLinkActive : undefined)}
                href={item.href}
                key={item.key}
                onClick={(event) => handleNavigate(event, item)}
              >
                {item.icon ? (
                  <span aria-hidden="true" className={styles.navIcon}>
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>
      <div className={styles.workspace}>
        <div className={styles.content}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>
  );
}

export function AdminPageHeader({
  actions,
  description,
  eyebrow = "ADMIN",
  title,
}: AdminPageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.titleGroup}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
