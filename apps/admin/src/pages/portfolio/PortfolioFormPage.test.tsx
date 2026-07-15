// @vitest-environment jsdom
import { SUPPORTED_CONTENT_SCHEMA_VERSION } from "@repo/content/types";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PortfolioCreateInput,
  PortfolioRow,
} from "../../lib/adminRepositoryTypes";
import type { ManagedContentFormValue } from "../../lib/managedContent";
import { PendingAssetNavigationProvider } from "../../navigation/PendingAssetNavigation";
import { PortfolioFormPage } from "./PortfolioFormPage";

const mocks = vi.hoisted(() => ({
  createPortfolio: vi.fn(),
  deletePortfolioWithStorageCleanup: vi.fn(),
  getPortfolioBySlug: vi.fn(),
  persistThumbnailChange: vi.fn(),
  updatePortfolio: vi.fn(),
}));

vi.mock("../../lib/portfolioRepository", () => ({
  createPortfolio: mocks.createPortfolio,
  getPortfolioBySlug: mocks.getPortfolioBySlug,
  updatePortfolio: mocks.updatePortfolio,
}));

vi.mock("../../lib/portfolioDeletion", () => ({
  deletePortfolioWithStorageCleanup: mocks.deletePortfolioWithStorageCleanup,
}));

vi.mock("../../lib/thumbnailPersistence", () => ({
  persistThumbnailChange: mocks.persistThumbnailChange,
}));

vi.mock("../../components/content/AdminContentEditor", () => ({
  AdminContentEditor: (props: {
    readonly documentKey: string;
    readonly onBusyChange: (busy: boolean) => void;
    readonly onChange: (value: ManagedContentFormValue) => void;
    readonly value: ManagedContentFormValue;
  }) => (
    <div data-document-key={props.documentKey} data-testid="portfolio-editor">
      <button onClick={() => props.onBusyChange(false)} type="button">
        portfolio editor ready
      </button>
      <button
        onClick={() =>
          props.onChange({
            ...props.value,
            content: "<p>포트폴리오 본문</p>",
            contentAuthoringMode: "wysiwyg",
            contentJson: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "포트폴리오 본문" }],
                },
              ],
            },
            contentMode: "html",
          })
        }
        type="button"
      >
        portfolio editor content
      </button>
    </div>
  ),
}));

function rowFromInput(
  input: PortfolioCreateInput,
  overrides: Partial<PortfolioRow> = {},
): PortfolioRow {
  return {
    company_name: input.companyName,
    content: input.content,
    content_asset_base_enabled: input.contentAssetBaseEnabled,
    content_asset_scope: input.contentAssetScope,
    content_authoring_mode: input.contentAuthoringMode,
    content_json: input.contentJson,
    content_mode: input.contentMode,
    content_schema_version: input.contentSchemaVersion,
    content_source_backup: input.contentSourceBackup,
    core_features: input.coreFeatures,
    created_at: "2026-07-15T06:00:00.000Z",
    deleted_at: null,
    development_period: input.developmentPeriod,
    estimate_label: input.estimateLabel,
    id: "00000000-0000-4000-8000-000000000601",
    landing_published: input.landingPublished,
    landing_sections: input.landingSections,
    product_description: input.productDescription,
    published_at:
      input.status === "published" ? "2026-07-15T06:00:00.000Z" : null,
    seo_description: input.seoDescription,
    service_published: input.servicePublished,
    service_sections: input.serviceSections,
    slug: input.slug.value,
    status: input.status,
    thumbnail_alt: input.thumbnailAlt,
    thumbnail_path: input.thumbnailPath,
    thumbnail_public_url: input.thumbnailPublicUrl,
    title: input.title,
    type: input.type,
    updated_at: "2026-07-15T07:00:00.000Z",
    work_scopes: input.workScopes,
    ...overrides,
  };
}

function loadedPortfolioRow({
  id,
  slug,
  thumbnailPublicUrl,
}: {
  readonly id: string;
  readonly slug: string;
  readonly thumbnailPublicUrl: string;
}): PortfolioRow {
  const title = `Portfolio ${slug}`;
  return {
    company_name: title,
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
    core_features: [],
    created_at: "2026-07-15T06:00:00.000Z",
    deleted_at: null,
    development_period: "",
    estimate_label: "",
    id,
    landing_published: false,
    landing_sections: {},
    product_description: "",
    published_at: null,
    seo_description: "",
    service_published: false,
    service_sections: {},
    slug,
    status: "draft",
    thumbnail_alt: `${title} thumbnail`,
    thumbnail_path: `${slug}/thumbnail.webp`,
    thumbnail_public_url: thumbnailPublicUrl,
    title,
    type: "mvp",
    updated_at: "2026-07-15T07:00:00.000Z",
    work_scopes: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve } as const;
}

function Page(props: Parameters<typeof PortfolioFormPage>[0]) {
  return (
    <PendingAssetNavigationProvider>
      <PortfolioFormPage {...props} />
    </PendingAssetNavigationProvider>
  );
}

describe("PortfolioFormPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:portfolio-thumbnail"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("shows the actual empty landing and service section counts", () => {
    render(
      <Page
        onNavigate={vi.fn()}
        route={{
          id: "portfolioNew",
          path: "/portfolio/new",
          protected: true,
        }}
      />,
    );

    expect(screen.getAllByText("0개 등록됨")).toHaveLength(2);
    expect(screen.queryByText("6개 등록됨")).toBeNull();
    expect(screen.queryByText("3개 등록됨")).toBeNull();
  });

  it("navigates to the list only after permanently deleting the loaded Portfolio and its Storage files", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const row = loadedPortfolioRow({
      id: "00000000-0000-4000-8000-000000000611",
      slug: "delete-portfolio",
      thumbnailPublicUrl: "https://project.supabase.co/storage/delete.webp",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.getPortfolioBySlug.mockResolvedValue({ ok: true, value: row });
    mocks.deletePortfolioWithStorageCleanup.mockResolvedValue({
      cleanupIssues: [],
      result: { ok: true, value: row },
    });

    render(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: row.slug,
          path: `/portfolio/${row.slug}`,
          protected: true,
        }}
      />,
    );

    await screen.findByRole("button", { name: "삭제" });
    await user.click(
      screen.getByRole("button", { name: "portfolio editor ready" }),
    );
    await user.click(screen.getByRole("button", { name: "삭제" }));

    await waitFor(() =>
      expect(mocks.deletePortfolioWithStorageCleanup).toHaveBeenCalledWith(
        expect.anything(),
        row.id,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("/portfolio"));
  });

  it("keeps the edit screen open when Portfolio deletion fails", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const row = loadedPortfolioRow({
      id: "00000000-0000-4000-8000-000000000612",
      slug: "delete-failure-portfolio",
      thumbnailPublicUrl:
        "https://project.supabase.co/storage/delete-failure.webp",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.getPortfolioBySlug.mockResolvedValue({ ok: true, value: row });
    mocks.deletePortfolioWithStorageCleanup.mockResolvedValue({
      cleanupIssues: [],
      result: {
        error: {
          kind: "save_failure",
          message: "Portfolio를 삭제하지 못했습니다.",
        },
        ok: false,
      },
    });

    render(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: row.slug,
          path: `/portfolio/${row.slug}`,
          protected: true,
        }}
      />,
    );

    await screen.findByRole("button", { name: "삭제" });
    await user.click(
      screen.getByRole("button", { name: "portfolio editor ready" }),
    );
    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Portfolio를 삭제하지 못했습니다.",
    );
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("uses the shared editor and thumbnail transaction without remounting after save", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    mocks.createPortfolio.mockImplementation(
      async (_config: unknown, input: PortfolioCreateInput) => ({
        ok: true,
        value: rowFromInput(input),
      }),
    );
    mocks.persistThumbnailChange.mockImplementation(
      async (input: {
        readonly save: (thumbnail: {
          readonly path: string | null;
          readonly publicUrl: string | null;
        }) => Promise<unknown>;
      }) => ({
        cleanupIssues: [],
        result: await input.save({
          path: "managed-portfolio/00000000-0000-4000-8000-000000000602.webp",
          publicUrl: "https://project.supabase.co/storage/thumbnail.webp",
        }),
      }),
    );

    const view = render(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioNew",
          path: "/portfolio/new",
          protected: true,
        }}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "portfolio editor ready" }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "포트폴리오 유형" }),
      "mvp",
    );
    await user.type(
      screen.getByRole("textbox", { name: "포트폴리오 Slug" }),
      "managed-portfolio",
    );
    await user.type(
      screen.getByRole("textbox", { name: "기업명" }),
      "관리형 포트폴리오",
    );
    await user.click(
      screen.getByRole("button", { name: "portfolio editor content" }),
    );
    const thumbnailFile = new File(["image"], "portfolio.webp", {
      type: "image/webp",
    });
    await user.upload(
      screen.getByLabelText("포트폴리오 썸네일 파일"),
      thumbnailFile,
    );

    const initialDocumentKey = screen
      .getByTestId("portfolio-editor")
      .getAttribute("data-document-key");
    await user.click(screen.getByRole("button", { name: "등록하기" }));
    await waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith("/portfolio/managed-portfolio"),
    );

    const persistenceInput = mocks.persistThumbnailChange.mock.calls[0]?.[0];
    expect(persistenceInput).toMatchObject({
      current: { path: null, publicUrl: null },
      removed: false,
      slug: { value: "managed-portfolio" },
    });
    expect(persistenceInput.selected.file).toBe(thumbnailFile);
    const createInput = mocks.createPortfolio.mock.calls[0]?.[1] as
      | PortfolioCreateInput
      | undefined;
    expect(createInput).toMatchObject({
      content: "<p>포트폴리오 본문</p>",
      status: "published",
      thumbnailPath:
        "managed-portfolio/00000000-0000-4000-8000-000000000602.webp",
      thumbnailPublicUrl: "https://project.supabase.co/storage/thumbnail.webp",
    });
    expect(
      screen.getByTestId("portfolio-editor").getAttribute("data-document-key"),
    ).toBe(initialDocumentKey);

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: "managed-portfolio",
          path: "/portfolio/managed-portfolio",
          protected: true,
        }}
      />,
    );
    await act(async () => undefined);
    expect(mocks.getPortfolioBySlug).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("portfolio-editor").getAttribute("data-document-key"),
    ).toBe(initialDocumentKey);
  });

  it("restores accepted A without refetch when B is aborted and ignores B's stale completion", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const rowA = loadedPortfolioRow({
      id: "00000000-0000-4000-8000-000000000611",
      slug: "portfolio-a",
      thumbnailPublicUrl: "https://images.example.com/portfolio-a.webp",
    });
    const rowB = loadedPortfolioRow({
      id: "00000000-0000-4000-8000-000000000612",
      slug: "portfolio-b",
      thumbnailPublicUrl: "https://images.example.com/portfolio-b.webp",
    });
    const delayedB = deferred<{
      readonly ok: true;
      readonly value: PortfolioRow;
    }>();
    mocks.getPortfolioBySlug.mockImplementation(
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
          id: "portfolioDetail",
          param: rowA.slug,
          path: `/portfolio/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    const companyName = await screen.findByRole("textbox", { name: "기업명" });
    await waitFor(() =>
      expect((companyName as HTMLInputElement).value).toBe(
        "Portfolio portfolio-a",
      ),
    );
    await user.click(
      screen.getByRole("button", { name: "portfolio editor ready" }),
    );
    const selectedFile = new File(["selected-a"], "selected-a.webp", {
      type: "image/webp",
    });
    await user.upload(
      screen.getByLabelText("포트폴리오 썸네일 파일"),
      selectedFile,
    );
    expect(
      screen
        .getByAltText("Portfolio portfolio-a thumbnail")
        .getAttribute("src"),
    ).toBe("blob:portfolio-thumbnail");

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: rowB.slug,
          path: `/portfolio/${rowB.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect(mocks.getPortfolioBySlug).toHaveBeenCalledTimes(2),
    );
    expect((companyName as HTMLInputElement).disabled).toBe(true);
    expect(
      screen
        .getByAltText("Portfolio portfolio-a thumbnail")
        .getAttribute("src"),
    ).toBe("blob:portfolio-thumbnail");

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: rowA.slug,
          path: `/portfolio/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect((companyName as HTMLInputElement).disabled).toBe(false),
    );
    expect(mocks.getPortfolioBySlug).toHaveBeenCalledTimes(2);
    expect(
      (screen.getByRole("button", { name: "수정하기" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(
      screen
        .getByAltText("Portfolio portfolio-a thumbnail")
        .getAttribute("src"),
    ).toBe("blob:portfolio-thumbnail");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    await act(async () => {
      delayedB.resolve({ ok: true, value: rowB });
      await delayedB.promise;
    });
    expect((companyName as HTMLInputElement).value).toBe(
      "Portfolio portfolio-a",
    );
    expect(
      screen
        .getByAltText("Portfolio portfolio-a thumbnail")
        .getAttribute("src"),
    ).toBe("blob:portfolio-thumbnail");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("restores accepted A after B fails without refetching or losing its thumbnail", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const rowA = loadedPortfolioRow({
      id: "00000000-0000-4000-8000-000000000621",
      slug: "portfolio-a",
      thumbnailPublicUrl: "https://images.example.com/portfolio-a.webp",
    });
    mocks.getPortfolioBySlug.mockImplementation(
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
          id: "portfolioDetail",
          param: rowA.slug,
          path: `/portfolio/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    const companyName = await screen.findByRole("textbox", { name: "기업명" });
    await waitFor(() =>
      expect((companyName as HTMLInputElement).value).toBe(
        "Portfolio portfolio-a",
      ),
    );
    await user.click(
      screen.getByRole("button", { name: "portfolio editor ready" }),
    );
    const selectedFile = new File(["selected-a"], "selected-a.webp", {
      type: "image/webp",
    });
    await user.upload(
      screen.getByLabelText("포트폴리오 썸네일 파일"),
      selectedFile,
    );

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: "portfolio-b",
          path: "/portfolio/portfolio-b",
          protected: true,
        }}
      />,
    );
    expect(await screen.findByText("B 조회 실패")).toBeTruthy();
    expect((companyName as HTMLInputElement).disabled).toBe(true);

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: rowA.slug,
          path: `/portfolio/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect((companyName as HTMLInputElement).disabled).toBe(false),
    );
    expect(screen.queryByText("B 조회 실패")).toBeNull();
    expect(mocks.getPortfolioBySlug).toHaveBeenCalledTimes(2);
    expect(
      (screen.getByRole("button", { name: "수정하기" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(
      screen
        .getByAltText("Portfolio portfolio-a thumbnail")
        .getAttribute("src"),
    ).toBe("blob:portfolio-thumbnail");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("releases A's pending save lock after aborting B and ignores the stale save completion", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const rowA = loadedPortfolioRow({
      id: "00000000-0000-4000-8000-000000000631",
      slug: "locked-portfolio-a",
      thumbnailPublicUrl: "https://images.example.com/locked-portfolio-a.webp",
    });
    const rowB = loadedPortfolioRow({
      id: "00000000-0000-4000-8000-000000000632",
      slug: "locked-portfolio-b",
      thumbnailPublicUrl: "https://images.example.com/locked-portfolio-b.webp",
    });
    const delayedB = deferred<{
      readonly ok: true;
      readonly value: PortfolioRow;
    }>();
    const firstPersistence = deferred<{
      readonly cleanupIssues: readonly [];
      readonly result: { readonly ok: true; readonly value: PortfolioRow };
    }>();
    type PersistenceInput = {
      readonly save: (thumbnail: {
        readonly path: string | null;
        readonly publicUrl: string | null;
      }) => Promise<unknown>;
    };
    let firstPersistenceInput: PersistenceInput | undefined;
    let persistenceCall = 0;

    mocks.getPortfolioBySlug.mockImplementation(
      (_config: unknown, slug: string) => {
        if (slug === rowA.slug) {
          return Promise.resolve({ ok: true, value: rowA });
        }
        return delayedB.promise;
      },
    );
    mocks.updatePortfolio.mockImplementation(
      async (_config: unknown, _id: string, input: PortfolioCreateInput) => ({
        ok: true,
        value: rowFromInput(input, {
          created_at: rowA.created_at,
          id: rowA.id,
          updated_at: "2026-07-15T09:00:00.000Z",
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
          id: "portfolioDetail",
          param: rowA.slug,
          path: `/portfolio/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    const companyName = await screen.findByRole("textbox", { name: "기업명" });
    await waitFor(() =>
      expect((companyName as HTMLInputElement).value).toBe(
        "Portfolio locked-portfolio-a",
      ),
    );
    await user.click(
      screen.getByRole("button", { name: "portfolio editor ready" }),
    );
    await user.click(screen.getByRole("button", { name: "임시저장" }));
    await waitFor(() =>
      expect(mocks.persistThumbnailChange).toHaveBeenCalledTimes(1),
    );

    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: rowB.slug,
          path: `/portfolio/${rowB.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect(mocks.getPortfolioBySlug).toHaveBeenCalledTimes(2),
    );
    view.rerender(
      <Page
        onNavigate={onNavigate}
        route={{
          id: "portfolioDetail",
          param: rowA.slug,
          path: `/portfolio/${rowA.slug}`,
          protected: true,
        }}
      />,
    );
    await waitFor(() =>
      expect((companyName as HTMLInputElement).disabled).toBe(false),
    );

    await user.clear(companyName);
    await user.type(companyName, "Portfolio A edited");
    expect((companyName as HTMLInputElement).value).toBe("Portfolio A edited");
    await user.click(screen.getByRole("button", { name: "임시저장" }));
    await waitFor(() =>
      expect(mocks.persistThumbnailChange).toHaveBeenCalledTimes(2),
    );
    await waitFor(() => expect(mocks.updatePortfolio).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText("Portfolio를 저장했습니다.")).toBeTruthy(),
    );
    expect((companyName as HTMLInputElement).value).toBe("Portfolio A edited");

    const staleAdapterResult = await firstPersistenceInput?.save({
      path: rowA.thumbnail_path,
      publicUrl: rowA.thumbnail_public_url,
    });
    expect(staleAdapterResult).toMatchObject({ ok: false });
    expect(mocks.updatePortfolio).toHaveBeenCalledTimes(1);
    await act(async () => {
      delayedB.resolve({ ok: true, value: rowB });
      await delayedB.promise;
      firstPersistence.resolve({
        cleanupIssues: [],
        result: {
          ok: true,
          value: {
            ...rowA,
            company_name: "stale save",
            slug: "stale-portfolio",
            title: "stale save",
          },
        },
      });
      await firstPersistence.promise;
    });

    expect((companyName as HTMLInputElement).value).toBe("Portfolio A edited");
    expect(mocks.updatePortfolio).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText("stale save")).toBeNull();
  });
});
