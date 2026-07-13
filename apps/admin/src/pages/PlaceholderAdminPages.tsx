import { AdminButton } from "../components/admin/AdminButton";
import { AdminFormSection } from "../components/admin/AdminForm";
import { AdminPageHeader } from "../components/admin/AdminShell";
import type { AdminRoute } from "../lib/router";
import styles from "./PlaceholderAdminPages.module.css";

type PlaceholderAdminPagesProps = {
  readonly onNavigate: (path: string) => void;
  readonly route: AdminRoute;
};

type ListPageConfig = {
  readonly createPath: string;
  readonly description: string;
  readonly emptyDescription: string;
  readonly eyebrow: string;
  readonly title: string;
};

function listConfig(route: AdminRoute): ListPageConfig {
  if (route.id === "blog") {
    return {
      createPath: "/blog/new",
      description: "Blog 도메인 작업자가 실제 목록/필터/편집 기능으로 교체할 자리입니다.",
      emptyDescription: "아직 Blog repository가 연결되지 않았습니다.",
      eyebrow: "BLOG",
      title: "Blog",
    };
  }

  return {
    createPath: "/portfolio/new",
    description: "Portfolio 도메인 작업자가 실제 목록/필터/편집 기능으로 교체할 자리입니다.",
    emptyDescription: "아직 Portfolio repository가 연결되지 않았습니다.",
    eyebrow: "PORTFOLIO",
    title: "Portfolio",
  };
}

function detailTitle(route: AdminRoute): string {
  if (route.id === "blogNew") return "Blog 신규 등록";
  if (route.id === "blogDetail") return `Blog 상세: ${route.param}`;
  if (route.id === "portfolioNew") return "Portfolio 신규 등록";
  if (route.id === "portfolioDetail") return `Portfolio 상세: ${route.param}`;
  return "Admin";
}

function backPath(route: AdminRoute): string {
  if (route.id === "blogNew" || route.id === "blogDetail") return "/blog";
  return "/portfolio";
}

function routeEyebrow(route: AdminRoute): string {
  if (route.id === "blogNew" || route.id === "blogDetail") return "BLOG";
  return "PORTFOLIO";
}

export function PlaceholderAdminPage({ onNavigate, route }: PlaceholderAdminPagesProps) {
  if (route.id === "blog" || route.id === "portfolio") {
    const config = listConfig(route);

    return (
      <>
        <AdminPageHeader
          actions={
            <AdminButton onClick={() => onNavigate(config.createPath)} variant="primary">
              신규 등록
            </AdminButton>
          }
          description={config.description}
          eyebrow={config.eyebrow}
          title={config.title}
        />
        <section className={styles.panel} aria-label={`${config.title} placeholder`}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>{config.title} 목록</h2>
            <p className={styles.panelDescription}>
              Todo 6/7/8에서 Supabase repository와 CRUD 화면이 연결됩니다.
            </p>
          </div>
          <span aria-hidden="true" className={styles.divider} />
          <div className={styles.placeholderBox}>
            <span className={styles.statusChip}>연결 대기</span>
            <p className={styles.placeholderText}>{config.emptyDescription}</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        actions={
          <AdminButton onClick={() => onNavigate(backPath(route))} variant="secondary">
            목록으로
          </AdminButton>
        }
        description="상세/등록 라우트가 AdminShell 안에서 정상 렌더링되는지 확인하는 임시 화면입니다."
        eyebrow={routeEyebrow(route)}
        title={detailTitle(route)}
      />
      <AdminFormSection
        description="실제 입력 필드와 저장 로직은 각 도메인 Todo에서 Supabase repository와 함께 연결됩니다."
        title="Route Placeholder"
      >
        <div className={styles.placeholderBox}>
          <span className={styles.statusChip}>부분 구현</span>
          <p className={styles.placeholderText}>
            라우팅, 인증 가드, 네비게이션 active 상태 확인용 보호 화면입니다.
          </p>
        </div>
      </AdminFormSection>
    </>
  );
}
