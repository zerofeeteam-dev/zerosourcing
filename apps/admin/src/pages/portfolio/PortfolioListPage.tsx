import { useEffect, useMemo, useState } from "react";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminPackageIcon,
  AdminSearchField,
  AdminTable,
  AdminTableShell,
  type AdminTableColumn,
} from "../../components/admin";
import { adminFailureMessage } from "../../lib/adminErrors";
import type {
  PortfolioRow,
  PortfolioStatus,
  PortfolioType,
} from "../../lib/adminRepositoryTypes";
import { listPortfolios } from "../../lib/portfolioRepository";
import { supabaseConfig } from "../../lib/supabase";
import {
  filterPortfolioRows,
  parsePortfolioStatus,
  parsePortfolioType,
} from "./portfolioModel";
import type {
  PortfolioAdminPageProps,
  PortfolioFilterValue,
} from "./portfolioTypes";
import styles from "../PortfolioAdminPage.module.css";

const portfolioTableWidth = 1520;

const statusFilterOptions = [
  { label: "전체", value: "all" },
  { label: "임시저장", value: "draft" },
  { label: "게시됨", value: "published" },
] as const;

const typeFilterOptions = [
  { label: "전체", value: "all" },
  { label: "어플리케이션", value: "application" },
  { label: "기업 홈페이지", value: "company_homepage" },
  { label: "MVP", value: "mvp" },
  { label: "웹서비스", value: "web_service" },
] as const;

function classNames(
  ...values: readonly (string | undefined | false)[]
): string {
  return values.filter(Boolean).join(" ");
}

function portfolioListStatusLabel(status: PortfolioStatus): string {
  if (status === "published") return "게시됨";
  return "임시저장";
}

function portfolioListTypeLabel(type: PortfolioType): string {
  if (type === "company_homepage") return "기업 홈페이지";
  if (type === "mvp") return "MVP";
  if (type === "web_service") return "웹서비스";
  return "어플리케이션";
}

function formatPortfolioListDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}. ${month}. ${day}`;
}

export function PortfolioListPage({
  onNavigate,
}: Pick<PortfolioAdminPageProps, "onNavigate">) {
  const [rows, setRows] = useState<readonly PortfolioRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PortfolioFilterValue<PortfolioStatus>>("all");
  const [typeFilter, setTypeFilter] =
    useState<PortfolioFilterValue<PortfolioType>>("all");

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    void listPortfolios(supabaseConfig, { signal: controller.signal }).then(
      (result) => {
        if (!isActive) return;
        setIsLoading(false);
        if (result.ok) {
          setRows(result.value);
          setLoadError(undefined);
        } else {
          setLoadError(adminFailureMessage(result.error));
        }
      },
    );

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const filteredRows = useMemo(
    () => filterPortfolioRows(rows, search, statusFilter, typeFilter),
    [rows, search, statusFilter, typeFilter],
  );

  const columns: readonly AdminTableColumn<PortfolioRow>[] = [
    {
      header: "상태",
      key: "status",
      render: (row) => (
        <span
          className={classNames(
            styles.statusCell,
            row.status === "published"
              ? styles.statusPublished
              : styles.statusDraft,
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              styles.statusDot,
              row.status === "published"
                ? styles.statusDotPublished
                : styles.statusDotDraft,
            )}
          />
          {portfolioListStatusLabel(row.status)}
        </span>
      ),
      width: 120,
    },
    {
      header: "유형",
      key: "type",
      render: (row) => portfolioListTypeLabel(row.type),
      width: 160,
    },
    {
      header: "포트폴리오 제목",
      key: "title",
      render: (row) => (
        <strong className={styles.titleBodyCell}>{row.title}</strong>
      ),
      width: 600,
    },
    {
      header: "고객사",
      key: "company",
      render: (row) => row.company_name,
      width: 160,
    },
    {
      header: "랜딩",
      key: "landing",
      render: (row) =>
        row.landing_published ? (
          <span className={styles.landingPublished}>게시됨</span>
        ) : (
          <span className={styles.mutedDash}>-</span>
        ),
      width: 120,
    },
    {
      header: "상단 고정",
      key: "featured",
      render: (row) =>
        row.featured_published ? (
          <span className={styles.landingPublished}>게시됨</span>
        ) : (
          <span className={styles.mutedDash}>-</span>
        ),
      width: 120,
    },
    {
      header: "등록일자",
      key: "registeredAt",
      render: (row) => formatPortfolioListDate(row.updated_at),
      width: 120,
    },
    {
      header: "상세",
      key: "detail",
      render: (row) => (
        <button
          className={styles.detailButton}
          onClick={() => onNavigate(`/portfolio/${row.slug}`)}
          type="button"
        >
          상세
        </button>
      ),
      width: 120,
    },
  ];

  const visibleRows = !isLoading && !loadError ? filteredRows : [];
  const tableMessage =
    loadError ??
    (isLoading
      ? "Portfolio 데이터를 불러오는 중입니다."
      : "조회할 데이터가 없습니다.");

  return (
    <AdminTableShell
      action={
        <button
          className={styles.newPortfolioButton}
          onClick={() => onNavigate("/portfolio/new")}
          type="button"
        >
          <AdminPackageIcon size={20} />
          신규 포폴 등록
        </button>
      }
      contentWidth={portfolioTableWidth}
      filters={
        <AdminFilterBar>
          <AdminFilterSelect
            id="portfolio-type-filter"
            label="유형 필터"
            onChange={(event) => {
              const value = event.currentTarget.value;
              setTypeFilter(
                value === "all" ? "all" : parsePortfolioType(value),
              );
            }}
            value={typeFilter}
          >
            {typeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminFilterSelect>

          <AdminFilterSelect
            id="portfolio-status-filter"
            label="상태 필터"
            onChange={(event) => {
              const value = event.currentTarget.value;
              setStatusFilter(
                value === "all" ? "all" : parsePortfolioStatus(value),
              );
            }}
            value={statusFilter}
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminFilterSelect>

          <AdminSearchField
            id="portfolio-search"
            label="검색"
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="포트폴리오 제목으로 검색해주세요."
            value={search}
          />
        </AdminFilterBar>
      }
      title="포트폴리오 등록 현황"
    >
      <AdminTable
        ariaLabel="포트폴리오 등록 목록"
        columns={columns}
        emptyState={
          <span role={loadError ? "alert" : "status"}>{tableMessage}</span>
        }
        getRowKey={(row) => row.id}
        rows={visibleRows}
      />
    </AdminTableShell>
  );
}
