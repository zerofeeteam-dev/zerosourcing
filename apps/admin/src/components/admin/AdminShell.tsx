import type { MouseEvent, ReactNode } from "react";
import styles from "./AdminShell.module.css";

const logoSrc = "/figma-assets/zerosourcing-logo.svg";

export type AdminNavKey = "blog" | "portfolio";

export type AdminNavItem = {
  readonly href: string;
  readonly icon?: ReactNode;
  readonly key: AdminNavKey;
  readonly label: string;
};

const blogAdminNavItem = { href: "/blog", key: "blog", label: "Blog" } as const;
const portfolioAdminNavItem = {
  href: "/portfolio",
  key: "portfolio",
  label: "Portfolio",
} as const;

export const adminNavItems = [
  blogAdminNavItem,
  portfolioAdminNavItem,
] as const satisfies readonly AdminNavItem[];

type AdminShellProps = {
  readonly activeItem: AdminNavKey;
  readonly accountActions?: ReactNode;
  readonly children: ReactNode;
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

function shouldHandleClientNavigation(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.currentTarget.hasAttribute("download") &&
    (!event.currentTarget.target || event.currentTarget.target === "_self")
  );
}

export function AdminShell({
  accountActions,
  activeItem,
  children,
  navItems = adminNavItems,
  onNavigate,
}: AdminShellProps) {
  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>, item: AdminNavItem) => {
    if (!onNavigate || !shouldHandleClientNavigation(event)) return;
    event.preventDefault();
    onNavigate(item);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a
          aria-label="Zerosourcing Admin"
          className={styles.logoLink}
          href={portfolioAdminNavItem.href}
          onClick={(event) => handleNavigate(event, portfolioAdminNavItem)}
        >
          <img alt="zeroSourcing" className={styles.logoImage} height={24} src={logoSrc} width={168} />
        </a>
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
        {accountActions ? <div className={styles.headerActions}>{accountActions}</div> : null}
      </header>

      <main className={styles.content}>{children}</main>

      <footer className={styles.footer}>
        <img alt="zeroSourcing" className={styles.footerLogo} height={24} src={logoSrc} width={168} />

        <span aria-hidden="true" className={styles.divider} />

        <div className={styles.policyGroup}>
          <p>이용약관</p>
          <p className={styles.bold}>개인정보처리방침</p>
          <div className={styles.customerGroup}>
            <p>고객센터</p>
            <p>전화번호 : 010-3242-8118</p>
            <p>주중 09~18시 (점심시간 12~13시 30분 / 주말 및 공휴일 제외)</p>
          </div>
        </div>

        <span aria-hidden="true" className={styles.divider} />

        <div className={styles.companyGroup}>
          <p>제로피(제로소싱) | 사업자등록번호 : 487-28-01888 | 대표 : 이동규</p>
          <p>주소 : 경기도 고양시 덕양구 동축로70, A동 9층 901호(동산동, 현대프리미어캠퍼스)</p>
          <p>개인정보처리담당자 : 이동규 | 통신판매업신고번호 : 2026-고양덕양구-1043</p>
          <p>메일 : contact@zerofee.kr</p>
          <p className={styles.bold}>Copyright ⓒ 2026 zerofee. All rights reserved.</p>
        </div>
      </footer>
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
