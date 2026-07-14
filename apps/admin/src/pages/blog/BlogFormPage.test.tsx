// @vitest-environment jsdom
import { SUPPORTED_CONTENT_SCHEMA_VERSION } from "@repo/content/types";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  BlogPostCreateInput,
  BlogPostRow,
} from "../../lib/adminRepositoryTypes";
import type { ManagedContentFormValue } from "../../lib/managedContent";
import {
  PendingAssetNavigationProvider,
  usePendingAssetNavigation,
} from "../../navigation/PendingAssetNavigation";
import { BlogFormPage } from "./BlogFormPage";

const mocks = vi.hoisted(() => ({
  createBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
  getBlogPostBySlug: vi.fn(),
  persistThumbnailChange: vi.fn(),
  updateBlogPost: vi.fn(),
}));

vi.mock("../../lib/blogRepository", () => ({
  createBlogPost: mocks.createBlogPost,
  deleteBlogPost: mocks.deleteBlogPost,
  getBlogPostBySlug: mocks.getBlogPostBySlug,
  updateBlogPost: mocks.updateBlogPost,
}));

vi.mock("../../lib/thumbnailPersistence", () => ({
  persistThumbnailChange: mocks.persistThumbnailChange,
}));

vi.mock("../../components/content/AdminContentEditor", () => ({
  AdminContentEditor: (props: {
    readonly documentKey: string;
    readonly onBusyChange: (busy: boolean) => void;
    readonly onChange: (value: ManagedContentFormValue) => void;
    readonly onPendingAssetCountChange: (count: number) => void;
    readonly value: ManagedContentFormValue;
  }) => {
    const canonical = (content: string): ManagedContentFormValue => ({
      ...props.value,
      content,
      contentAuthoringMode: "wysiwyg",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: content }],
          },
        ],
      },
      contentMode: "html",
    });

    return (
      <div data-document-key={props.documentKey} data-testid="mock-editor">
        <button onClick={() => props.onBusyChange(false)} type="button">
          editor ready
        </button>
        <button
          onClick={() => props.onPendingAssetCountChange(1)}
          type="button"
        >
          editor pending
        </button>
        <button
          onClick={() => props.onPendingAssetCountChange(0)}
          type="button"
        >
          editor settled
        </button>
        <button onClick={() => props.onChange(canonical("본문"))} type="button">
          editor content
        </button>
        <button
          onClick={() => props.onChange(canonical("오래된 콜백"))}
          type="button"
        >
          stale editor callback
        </button>
      </div>
    );
  },
}));

function rowFromInput(
  input: BlogPostCreateInput,
  updatedAt = "2026-07-15T05:00:00.000Z",
  overrides: Partial<BlogPostRow> = {},
): BlogPostRow {
  return {
    banner_published: input.bannerPublished,
    banner_sections: input.bannerSections,
    content: input.content,
    content_asset_base_enabled: input.contentAssetBaseEnabled,
    content_asset_scope: input.contentAssetScope,
    content_authoring_mode: input.contentAuthoringMode,
    content_json: input.contentJson,
    content_mode: input.contentMode,
    content_schema_version: input.contentSchemaVersion,
    content_source_backup: input.contentSourceBackup,
    created_at: "2026-07-15T04:00:00.000Z",
    deleted_at: null,
    id: "00000000-0000-4000-8000-000000000501",
    landing_published: input.landingPublished,
    landing_sections: input.landingSections,
    published_at:
      input.status === "published" ? "2026-07-15T04:00:00.000Z" : null,
    published_date: input.publishedDate,
    seo_description: input.seoDescription,
    slug: input.slug.value,
    status: input.status,
    summary: input.summary,
    thumbnail_alt: input.thumbnailAlt,
    thumbnail_path: input.thumbnailPath,
    thumbnail_public_url: input.thumbnailPublicUrl,
    title: input.title,
    type: input.type,
    updated_at: updatedAt,
    ...overrides,
  };
}

function loadedBlogRow({
  id,
  slug,
  thumbnailPublicUrl,
}: {
  readonly id: string;
  readonly slug: string;
  readonly thumbnailPublicUrl: string;
}): BlogPostRow {
  const title = `Blog ${slug}`;
  return {
    banner_published: false,
    banner_sections: [],
    content: `<p>${title}</p>`,
    content_asset_base_enabled: false,
    content_asset_scope: id,
    content_authoring_mode: "wysiwyg",
    content_json: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: title }],
        },
      ],
    },
    content_mode: "html",
    content_schema_version: SUPPORTED_CONTENT_SCHEMA_VERSION,
    content_source_backup: null,
    created_at: "2026-07-15T04:00:00.000Z",
    deleted_at: null,
    id,
    landing_published: false,
    landing_sections: [],
    published_at: null,
    published_date: null,
    seo_description: "",
    slug,
    status: "draft",
    summary: `${title} summary`,
    thumbnail_alt: `${title} thumbnail`,
    thumbnail_path: `${slug}/thumbnail.webp`,
    thumbnail_public_url: thumbnailPublicUrl,
    title,
    type: "insight",
    updated_at: "2026-07-15T05:00:00.000Z",
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve } as const;
}

function PendingCount() {
  const { pendingAssetCount } = usePendingAssetNavigation();
  return <output data-testid="registered-pending">{pendingAssetCount}</output>;
}

function Page(props: Parameters<typeof BlogFormPage>[0]) {
  return (
    <PendingAssetNavigationProvider>
      <PendingCount />
      <BlogFormPage {...props} />
    </PendingAssetNavigationProvider>
  );
}

describe("BlogFormPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:thumbnail-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("gates actions, validates before persistence, and preserves the editor key after save navigation", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    let finishPersistence: (() => Promise<void>) | undefined;

    mocks.createBlogPost.mockImplementation(
      async (_config: unknown, input: BlogPostCreateInput) => ({
        ok: true,
        value: rowFromInput(input),
      }),
    );
    mocks.persistThumbnailChange.mockImplementation(
      (input: {
        readonly save: (thumbnail: {
          readonly path: string | null;
          readonly publicUrl: string | null;
        }) => Promise<unknown>;
      }) =>
        new Promise((resolve) => {
          finishPersistence = async () => {
            const result = await input.save({ path: null, publicUrl: null });
            resolve({ cleanupIssues: [], result });
          };
        }),
    );

    const view = render(
      <Page
        onNavigate={onNavigate}
        route={{ id: "blogNew", path: "/blog/new", protected: true }}
      />,
    );
    const publish = screen.getByRole("button", { name: "등록하기" });
    expect((publish as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole("button", { name: "editor ready" }));
    await user.click(screen.getByRole("button", { name: "editor pending" }));
    expect((publish as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText(/본문 이미지 1개를 처리하고 있습니다/u).textContent,
    ).toContain("1개");
    expect(screen.getByTestId("registered-pending").textContent).toBe("1");
    await user.click(screen.getByRole("button", { name: "editor settled" }));
    expect(screen.getByTestId("registered-pending").textContent).toBe("0");

    await user.click(publish);
    expect(mocks.persistThumbnailChange).not.toHaveBeenCalled();
    const summary = screen.getByRole("textbox", { name: "카드 요약" });
    expect(summary.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById("blog-summary-error")?.textContent).toBe(
      "게시하려면 카드 요약을 입력해 주세요.",
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "블로그 유형" }),
      "insight",
    );
    await user.type(
      screen.getByRole("textbox", { name: "블로그 제목" }),
      "관리형 블로그",
    );
    await user.type(
      screen.getByRole("textbox", { name: "블로그 Slug" }),
      "managed-blog",
    );
    await user.type(summary, "카드 요약");
    await user.click(screen.getByRole("button", { name: "editor content" }));

    const initialDocumentKey = screen
      .getByTestId("mock-editor")
      .getAttribute("data-document-key");
    await user.click(publish);
    await waitFor(() =>
      expect(mocks.persistThumbnailChange).toHaveBeenCalledTimes(1),
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "블로그 제목",
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);

    await user.click(
      screen.getByRole("button", { name: "stale editor callback" }),
    );
    await act(async () => {
      await finishPersistence?.();
    });
    await waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith("/blog/managed-blog"),
    );

    const persistenceInput = mocks.persistThumbnailChange.mock.calls[0]?.[0];
    expect(persistenceInput).toMatchObject({
      current: { path: null, publicUrl: null },
      removed: false,
      selected: undefined,
      slug: { value: "managed-blog" },
    });
    const createInput = mocks.createBlogPost.mock.calls[0]?.[1] as
      | BlogPostCreateInput
      | undefined;
    expect(createInput?.content).toBe("본문");
    expect(createInput?.status).toBe("published");
    expect(createInput?.summary).toBe("카드 요약");
    expect(
      screen.getByTestId("mock-editor").getAttribute("data-document-key"),
    ).toBe(initialDocumentKey);

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: "managed-blog",
          path: "/blog/managed-blog",
          protected: true,
        }}
      />,
    );
    await act(async () => undefined);
    expect(mocks.getBlogPostBySlug).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("mock-editor").getAttribute("data-document-key"),
    ).toBe(initialDocumentKey);
  });

  it("keeps a selected thumbnail after an indeterminate save outcome", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    mocks.persistThumbnailChange.mockResolvedValue({
      cleanupIssues: [],
      result: {
        error: { kind: "network_failure", message: "네트워크 오류" },
        ok: false,
      },
    });

    render(
      <Page
        onNavigate={onNavigate}
        route={{ id: "blogNew", path: "/blog/new", protected: true }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "editor ready" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "블로그 유형" }),
      "insight",
    );
    await user.type(
      screen.getByRole("textbox", { name: "블로그 제목" }),
      "임시 글",
    );
    await user.type(
      screen.getByRole("textbox", { name: "블로그 Slug" }),
      "draft-blog",
    );
    const file = new File(["image"], "draft.webp", { type: "image/webp" });
    await user.upload(screen.getByLabelText("블로그 썸네일 파일"), file);
    await user.click(screen.getByRole("button", { name: "임시저장" }));

    await waitFor(() => expect(screen.getByText("네트워크 오류")).toBeTruthy());
    expect(mocks.createBlogPost).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByAltText("Blog thumbnail preview").getAttribute("src"),
    ).toBe("blob:thumbnail-preview");
    expect(
      mocks.persistThumbnailChange.mock.calls[0]?.[0]?.selected?.file,
    ).toBe(file);
  });

  it("restores accepted A without refetch when B is aborted and ignores B's stale completion", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const rowA = loadedBlogRow({
      id: "00000000-0000-4000-8000-000000000511",
      slug: "blog-a",
      thumbnailPublicUrl: "https://images.example.com/blog-a.webp",
    });
    const rowB = loadedBlogRow({
      id: "00000000-0000-4000-8000-000000000512",
      slug: "blog-b",
      thumbnailPublicUrl: "https://images.example.com/blog-b.webp",
    });
    const delayedB = deferred<{
      readonly ok: true;
      readonly value: BlogPostRow;
    }>();
    mocks.getBlogPostBySlug.mockImplementation(
      (_config: unknown, slug: string) => {
        if (slug === rowA.slug) {
          return Promise.resolve({ ok: true, value: rowA });
        }
        return delayedB.promise;
      },
    );

    const view = render(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: rowA.slug,
          path: `/blog/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    const title = await screen.findByRole("textbox", { name: "블로그 제목" });
    await waitFor(() =>
      expect((title as HTMLInputElement).value).toBe("Blog blog-a"),
    );
    await user.click(screen.getByRole("button", { name: "editor ready" }));
    const selectedFile = new File(["selected-a"], "selected-a.webp", {
      type: "image/webp",
    });
    await user.upload(
      screen.getByLabelText("블로그 썸네일 파일"),
      selectedFile,
    );
    expect(
      screen.getByAltText("Blog blog-a thumbnail").getAttribute("src"),
    ).toBe("blob:thumbnail-preview");

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: rowB.slug,
          path: `/blog/${rowB.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect(mocks.getBlogPostBySlug).toHaveBeenCalledTimes(2),
    );
    expect((title as HTMLInputElement).disabled).toBe(true);
    expect(
      screen.getByAltText("Blog blog-a thumbnail").getAttribute("src"),
    ).toBe("blob:thumbnail-preview");

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: rowA.slug,
          path: `/blog/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect((title as HTMLInputElement).disabled).toBe(false),
    );
    expect(mocks.getBlogPostBySlug).toHaveBeenCalledTimes(2);
    expect(
      (screen.getByRole("button", { name: "수정하기" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(
      screen.getByAltText("Blog blog-a thumbnail").getAttribute("src"),
    ).toBe("blob:thumbnail-preview");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    await act(async () => {
      delayedB.resolve({ ok: true, value: rowB });
      await delayedB.promise;
    });
    expect((title as HTMLInputElement).value).toBe("Blog blog-a");
    expect(
      screen.getByAltText("Blog blog-a thumbnail").getAttribute("src"),
    ).toBe("blob:thumbnail-preview");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("restores accepted A after B fails without refetching or losing its thumbnail", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const rowA = loadedBlogRow({
      id: "00000000-0000-4000-8000-000000000521",
      slug: "blog-a",
      thumbnailPublicUrl: "https://images.example.com/blog-a.webp",
    });
    mocks.getBlogPostBySlug.mockImplementation(
      (_config: unknown, slug: string) =>
        Promise.resolve(
          slug === rowA.slug
            ? { ok: true, value: rowA }
            : {
                error: { kind: "network_failure", message: "B 조회 실패" },
                ok: false,
              },
        ),
    );

    const view = render(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: rowA.slug,
          path: `/blog/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    const title = await screen.findByRole("textbox", { name: "블로그 제목" });
    await waitFor(() =>
      expect((title as HTMLInputElement).value).toBe("Blog blog-a"),
    );
    await user.click(screen.getByRole("button", { name: "editor ready" }));
    const selectedFile = new File(["selected-a"], "selected-a.webp", {
      type: "image/webp",
    });
    await user.upload(
      screen.getByLabelText("블로그 썸네일 파일"),
      selectedFile,
    );

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: "blog-b",
          path: "/blog/blog-b",
          protected: true,
        }}
      />,
    );
    expect(await screen.findByText("B 조회 실패")).toBeTruthy();
    expect((title as HTMLInputElement).disabled).toBe(true);

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: rowA.slug,
          path: `/blog/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect((title as HTMLInputElement).disabled).toBe(false),
    );
    expect(screen.queryByText("B 조회 실패")).toBeNull();
    expect(mocks.getBlogPostBySlug).toHaveBeenCalledTimes(2);
    expect(
      (screen.getByRole("button", { name: "수정하기" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(
      screen.getByAltText("Blog blog-a thumbnail").getAttribute("src"),
    ).toBe("blob:thumbnail-preview");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("releases A's pending save lock across a failed B load and ignores the stale save completion", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const rowA = loadedBlogRow({
      id: "00000000-0000-4000-8000-000000000531",
      slug: "locked-blog-a",
      thumbnailPublicUrl: "https://images.example.com/locked-blog-a.webp",
    });
    const firstPersistence = deferred<{
      readonly cleanupIssues: readonly [];
      readonly result: { readonly ok: true; readonly value: BlogPostRow };
    }>();
    type PersistenceInput = {
      readonly save: (thumbnail: {
        readonly path: string | null;
        readonly publicUrl: string | null;
      }) => Promise<unknown>;
    };
    let firstPersistenceInput: PersistenceInput | undefined;
    let persistenceCall = 0;

    mocks.getBlogPostBySlug.mockImplementation(
      (_config: unknown, slug: string) =>
        Promise.resolve(
          slug === rowA.slug
            ? { ok: true, value: rowA }
            : {
                error: { kind: "network_failure", message: "B 조회 실패" },
                ok: false,
              },
        ),
    );
    mocks.updateBlogPost.mockImplementation(
      async (_config: unknown, _id: string, input: BlogPostCreateInput) => ({
        ok: true,
        value: rowFromInput(input, "2026-07-15T08:00:00.000Z", {
          created_at: rowA.created_at,
          id: rowA.id,
        }),
      }),
    );
    mocks.persistThumbnailChange.mockImplementation(
      async (input: PersistenceInput) => {
        persistenceCall += 1;
        if (persistenceCall === 1) {
          firstPersistenceInput = input;
          return firstPersistence.promise;
        }
        return {
          cleanupIssues: [],
          result: await input.save({
            path: rowA.thumbnail_path,
            publicUrl: rowA.thumbnail_public_url,
          }),
        };
      },
    );

    const view = render(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: rowA.slug,
          path: `/blog/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    const title = await screen.findByRole("textbox", { name: "블로그 제목" });
    await waitFor(() =>
      expect((title as HTMLInputElement).value).toBe("Blog locked-blog-a"),
    );
    await user.click(screen.getByRole("button", { name: "editor ready" }));
    await user.click(screen.getByRole("button", { name: "임시저장" }));
    await waitFor(() =>
      expect(mocks.persistThumbnailChange).toHaveBeenCalledTimes(1),
    );

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: "locked-blog-b",
          path: "/blog/locked-blog-b",
          protected: true,
        }}
      />,
    );
    expect(await screen.findByText("B 조회 실패")).toBeTruthy();
    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "blogDetail",
          param: rowA.slug,
          path: `/blog/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect((title as HTMLInputElement).disabled).toBe(false),
    );

    await user.clear(title);
    await user.type(title, "Blog A edited");
    expect((title as HTMLInputElement).value).toBe("Blog A edited");
    await user.click(screen.getByRole("button", { name: "임시저장" }));
    await waitFor(() =>
      expect(mocks.persistThumbnailChange).toHaveBeenCalledTimes(2),
    );
    await waitFor(() => expect(mocks.updateBlogPost).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText("Blog 글을 저장했습니다.")).toBeTruthy(),
    );
    expect((title as HTMLInputElement).value).toBe("Blog A edited");

    const staleAdapterResult = await firstPersistenceInput?.save({
      path: rowA.thumbnail_path,
      publicUrl: rowA.thumbnail_public_url,
    });
    expect(staleAdapterResult).toMatchObject({ ok: false });
    expect(mocks.updateBlogPost).toHaveBeenCalledTimes(1);
    await act(async () => {
      firstPersistence.resolve({
        cleanupIssues: [],
        result: {
          ok: true,
          value: {
            ...rowA,
            slug: "stale-blog",
            title: "stale save",
          },
        },
      });
      await firstPersistence.promise;
    });

    expect((title as HTMLInputElement).value).toBe("Blog A edited");
    expect(mocks.updateBlogPost).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText("stale save")).toBeNull();
  });
});
