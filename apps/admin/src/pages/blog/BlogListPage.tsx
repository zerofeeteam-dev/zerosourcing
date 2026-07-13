import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { BlogPostRow } from "../../lib/adminRepositoryTypes";
import { listBlogPosts } from "../../lib/blogRepository";
import { supabaseConfig } from "../../lib/supabase";
import {
  blogStatusFilterOptions,
  blogStatusFromValue,
  blogStatusLabel,
  blogTypeFilterOptions,
  blogTypeFromValue,
  blogTypeLabel,
  filterBlogPosts,
  formatBlogListDate,
} from "./blogModel";
import type {
  BlogAdminPageProps,
  LoadState,
  StatusFilter,
  TypeFilter,
} from "./blogTypes";
import styles from "../BlogAdminPage.module.css";

const blogTableWidth = 1360;

function classNames(
  ...values: readonly (string | undefined | false)[]
): string {
  return values.filter(Boolean).join(" ");
}

export function BlogListPage({
  onNavigate,
}: Pick<BlogAdminPageProps, "onNavigate">) {
  const [posts, setPosts] = useState<readonly BlogPostRow[]>([]);
  const [listState, setListState] = useState<LoadState>("idle");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [globalError, setGlobalError] = useState<string>();

  const loadPosts = useCallback(async () => {
    setListState("loading");
    setGlobalError(undefined);
    const result = await listBlogPosts(supabaseConfig);
    if (result.ok) {
      setPosts(result.value);
      setListState("ready");
      return;
    }
    setGlobalError(adminFailureMessage(result.error));
    setListState("ready");
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(
    () => filterBlogPosts(posts, search, statusFilter, typeFilter),
    [posts, search, statusFilter, typeFilter],
  );

  const columns: readonly AdminTableColumn<BlogPostRow>[] = [
    {
      header: "상태",
      key: "status",
      render: (post) => (
        <span
          className={classNames(
            styles.listStatus,
            post.status === "published"
              ? styles.listStatusPublished
              : styles.listStatusDraft,
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              styles.listStatusDot,
              post.status === "published"
                ? styles.listStatusDotPublished
                : styles.listStatusDotDraft,
            )}
          />
          {blogStatusLabel(post.status)}
        </span>
      ),
      width: 120,
    },
    {
      header: "유형",
      key: "type",
      render: (post) => blogTypeLabel(post.type),
      width: 160,
    },
    {
      header: "블로그 제목",
      key: "title",
      render: (post) => (
        <strong className={styles.listTitle}>{post.title}</strong>
      ),
      width: 600,
    },
    {
      header: "랜딩",
      key: "landing",
      render: (post) =>
        post.landing_published ? (
          <span className={styles.listPublished}>게시됨</span>
        ) : (
          <span className={styles.listMuted}>-</span>
        ),
      width: 120,
    },
    {
      header: "배너",
      key: "banner",
      render: (post) =>
        post.banner_published ? (
          <span className={styles.listPublished}>게시됨</span>
        ) : (
          <span className={styles.listMuted}>-</span>
        ),
      width: 120,
    },
    {
      header: "등록일자",
      key: "createdAt",
      render: (post) => formatBlogListDate(post.created_at),
      width: 120,
    },
    {
      header: "상세",
      key: "detail",
      render: (post) => (
        <button
          className={styles.listDetailButton}
          onClick={() => onNavigate(`/blog/${post.slug}`)}
          type="button"
        >
          상세
        </button>
      ),
      width: 120,
    },
  ];

  const visiblePosts =
    listState === "ready" && !globalError ? filteredPosts : [];
  const tableMessage =
    globalError ??
    (listState === "loading" || listState === "idle"
      ? "Blog 데이터를 불러오는 중입니다."
      : "조회할 데이터가 없습니다.");

  return (
    <AdminTableShell
      action={
        <button
          className={styles.newBlogButton}
          onClick={() => onNavigate("/blog/new")}
          type="button"
        >
          <AdminPackageIcon size={20} />
          신규 블로그 등록
        </button>
      }
      contentWidth={blogTableWidth}
      filters={
        <AdminFilterBar>
          <AdminFilterSelect
            id="blog-type-filter"
            label="유형 필터"
            onChange={(event) => {
              const value = event.currentTarget.value;
              setTypeFilter(value === "all" ? "all" : blogTypeFromValue(value));
            }}
            value={typeFilter}
          >
            {blogTypeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminFilterSelect>

          <AdminFilterSelect
            id="blog-status-filter"
            label="상태 필터"
            onChange={(event) => {
              const value = event.currentTarget.value;
              setStatusFilter(
                value === "all" ? "all" : blogStatusFromValue(value),
              );
            }}
            value={statusFilter}
          >
            {blogStatusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminFilterSelect>

          <AdminSearchField
            id="blog-search"
            label="검색"
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="블로그 제목으로 검색해주세요."
            value={search}
          />
        </AdminFilterBar>
      }
      title="블로그 등록 현황"
    >
      <AdminTable
        ariaLabel="블로그 등록 목록"
        columns={columns}
        emptyState={
          <span role={globalError ? "alert" : "status"}>{tableMessage}</span>
        }
        getRowKey={(post) => post.id}
        rows={visiblePosts}
      />
    </AdminTableShell>
  );
}
