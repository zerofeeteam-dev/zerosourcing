// @vitest-environment jsdom
import type { TiptapDocument } from "@repo/content/types";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import type { AdminFailure } from "../../lib/adminErrors";
import type { AdminRepositoryResult } from "../../lib/adminRepositoryTypes";
import {
  EMPTY_TIPTAP_DOCUMENT,
  type ManagedContentFormValue,
} from "../../lib/managedContent";
import { useManagedContentEditorState } from "../../pages/content/useManagedContentEditorState";
import type {
  AdminRichTextEditorProps,
  UploadedEditorImage,
} from "./AdminRichTextEditor";
import { AdminContentEditor } from "./AdminContentEditor";

const scope = "00000000-0000-4000-8000-0000000000ab";
const secondScope = "00000000-0000-4000-8000-0000000000cd";

const storageMocks = vi.hoisted(() => ({
  adminContentAssetBaseUrl: vi.fn(
    (_config: unknown, entity: string, assetScope: string) =>
      `https://storage.example.com/storage/v1/object/public/zerosourcing/content/${entity}/${assetScope}/`,
  ),
  isContentImagePublicUrlOwnedBy: vi.fn(() => true),
  removeContentAsset: vi.fn(),
  uploadContentAsset: vi.fn(),
  uploadRawHtmlAsset: vi.fn(),
}));

const richEditorCapture = vi.hoisted(() => ({
  latest: null as AdminRichTextEditorProps | null,
}));

vi.mock("../../lib/supabase", () => ({
  supabaseConfig: {
    client: {},
    kind: "enabled",
    url: "https://storage.example.com",
  },
}));

vi.mock("../../lib/contentAssetStorage", () => ({
  adminContentAssetBaseUrl: storageMocks.adminContentAssetBaseUrl,
  isContentImagePublicUrlOwnedBy: storageMocks.isContentImagePublicUrlOwnedBy,
  removeContentAsset: storageMocks.removeContentAsset,
  uploadContentAsset: storageMocks.uploadContentAsset,
  uploadRawHtmlAsset: storageMocks.uploadRawHtmlAsset,
}));

vi.mock("@repo/content/raw-html-frame", () => ({
  RawHtmlFrame: ({
    assetBaseUrl,
    html,
    title,
  }: {
    readonly assetBaseUrl?: string;
    readonly html: string;
    readonly title: string;
  }) => (
    <div
      aria-label={title}
      data-asset-base={assetBaseUrl ?? ""}
      data-html={html}
      role="region"
    />
  ),
}));

function textFromDocument(document: TiptapDocument): string {
  const texts: string[] = [];
  const visit = (
    node: TiptapDocument | NonNullable<TiptapDocument["content"]>[number],
  ) => {
    if (typeof node.text === "string") texts.push(node.text);
    for (const child of node.content ?? []) visit(child);
  };
  visit(document);
  return texts.join("");
}

vi.mock("./AdminRichTextEditor", async () => {
  const React = await import("react");
  function MockAdminRichTextEditor(props: AdminRichTextEditorProps) {
    richEditorCapture.latest = props;
    const { document, documentKey, onChange, onCreate } = props;
    const emittedKeyRef = React.useRef<string | null>(null);
    React.useEffect(() => {
      if (emittedKeyRef.current === documentKey) return;
      emittedKeyRef.current = documentKey;
      const text = textFromDocument(document);
      onCreate({
        document,
        html: text ? `<p>${text}</p>` : "<p></p>",
      });
    }, [document, documentKey, onCreate]);
    return React.createElement(
      "button",
      {
        onClick: () =>
          onChange({
            document: {
              content: [
                {
                  content: [{ text: "B", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "doc",
            },
            html: "<p>B</p>",
          }),
        type: "button",
      },
      "WYSIWYG B 입력",
    );
  }
  return { AdminRichTextEditor: MockAdminRichTextEditor };
});

const savedDocument: TiptapDocument = {
  content: [
    {
      content: [{ text: "B", type: "text" }],
      type: "paragraph",
    },
  ],
  type: "doc",
};

function value(
  overrides: Partial<ManagedContentFormValue> = {},
): ManagedContentFormValue {
  return {
    content: "",
    contentAssetBaseEnabled: false,
    contentAssetScope: scope,
    contentAuthoringMode: "raw_html",
    contentJson: savedDocument,
    contentMode: "html",
    contentSchemaVersion: 1,
    contentSourceBackup: null,
    ...overrides,
  };
}

type HarnessProps = {
  readonly disabled?: boolean;
  readonly initial: ManagedContentFormValue;
  readonly initialDocumentKey?: string;
  readonly onBusyChange?: Mock<(busy: boolean) => void>;
  readonly onPendingAssetCountChange?: Mock<(count: number) => void>;
  readonly onValueChange?: Mock<(value: ManagedContentFormValue) => void>;
  readonly showDocumentSwitch?: boolean;
  readonly showForcedModeSwitch?: boolean;
};

function EditorHarness({
  disabled = false,
  initial,
  initialDocumentKey = "row:1",
  onBusyChange = vi.fn(),
  onPendingAssetCountChange = vi.fn(),
  onValueChange = vi.fn(),
  showDocumentSwitch = false,
  showForcedModeSwitch = false,
}: HarnessProps) {
  const [current, setCurrent] = useState(initial);
  const [documentKey, setDocumentKey] = useState(initialDocumentKey);
  return (
    <>
      {showDocumentSwitch ? (
        <button onClick={() => setDocumentKey("row:2")} type="button">
          다른 문서 로드
        </button>
      ) : null}
      {showForcedModeSwitch ? (
        <>
          <button
            onClick={() =>
              setCurrent((existing) => ({
                ...existing,
                contentAuthoringMode: "wysiwyg",
                contentJson: existing.contentJson ?? EMPTY_TIPTAP_DOCUMENT,
                contentMode: "html",
              }))
            }
            type="button"
          >
            외부 WYSIWYG 전환
          </button>
          <button
            onClick={() =>
              setCurrent((existing) => ({
                ...existing,
                contentAuthoringMode: "raw_html",
                contentMode: "html",
              }))
            }
            type="button"
          >
            외부 HTML 원문 전환
          </button>
        </>
      ) : null}
      <AdminContentEditor
        disabled={disabled}
        documentKey={documentKey}
        entity="blog"
        onBusyChange={onBusyChange}
        onChange={(nextValue) => {
          onValueChange(nextValue);
          setCurrent(nextValue);
        }}
        onPendingAssetCountChange={onPendingAssetCountChange}
        value={current}
      />
    </>
  );
}

function htmlFile(name: string, source: string): File {
  const file = new File([source], name, { type: "text/html" });
  Object.defineProperty(file, "text", {
    configurable: true,
    value: vi.fn(async () => source),
  });
  return file;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function rawUploadSuccess(
  fileName: string,
  relativePath = `images/${fileName}`,
) {
  return {
    ok: true,
    value: {
      assetScope: scope,
      entity: "blog",
      path: `content/blog/${scope}/${relativePath}`,
      publicUrl: `https://storage.example.com/${relativePath}`,
      relativePath,
    },
  } as const;
}

beforeEach(() => {
  richEditorCapture.latest = null;
  storageMocks.adminContentAssetBaseUrl.mockClear();
  storageMocks.isContentImagePublicUrlOwnedBy.mockClear();
  storageMocks.removeContentAsset.mockReset();
  storageMocks.removeContentAsset.mockResolvedValue({ ok: true, value: null });
  storageMocks.uploadContentAsset.mockReset();
  storageMocks.uploadRawHtmlAsset.mockReset();
});

afterEach(() => {
  cleanup();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
  vi.restoreAllMocks();
});

describe("AdminContentEditor raw source", () => {
  it("settles a reloaded raw document after the parent resets its editor state", async () => {
    const user = userEvent.setup();
    const busyReports = vi.fn();
    const pendingReports = vi.fn();
    const renderedStates: string[] = [];
    const staleCallbacks: {
      busy?: (busy: boolean) => void;
      pending?: (count: number) => void;
    } = {};

    function IntegratedRawHarness() {
      const [documentKey, setDocumentKey] = useState("portfolio:row-a:v1");
      const activeDocumentKeyRef = useRef(documentKey);
      activeDocumentKeyRef.current = documentKey;
      const documentIsCurrent = useCallback(
        (candidate: string) => candidate === activeDocumentKeyRef.current,
        [],
      );
      const editorState = useManagedContentEditorState(
        documentKey,
        documentIsCurrent,
      );
      const stateLabel = `${documentKey}:${editorState.busy ? "busy" : "ready"}:${editorState.pendingAssetCount}`;
      renderedStates.push(stateLabel);
      if (documentKey === "portfolio:row-a:v1") {
        staleCallbacks.busy = editorState.onBusyChange;
        staleCallbacks.pending = editorState.onPendingAssetCountChange;
      }

      return (
        <>
          <button
            onClick={() => setDocumentKey("portfolio:row-b:v1")}
            type="button"
          >
            저장된 원문 다시 로드
          </button>
          <output aria-label="통합 편집기 상태">{stateLabel}</output>
          <AdminContentEditor
            disabled={false}
            documentKey={documentKey}
            entity="portfolio"
            onBusyChange={(busy) => {
              busyReports(busy);
              editorState.onBusyChange(busy);
            }}
            onChange={() => undefined}
            onPendingAssetCountChange={(count) => {
              pendingReports(count);
              editorState.onPendingAssetCountChange(count);
            }}
            value={value({ content: "<p>저장된 원문</p>" })}
          />
        </>
      );
    }

    render(<IntegratedRawHarness />);
    await waitFor(() =>
      expect(screen.getByLabelText("통합 편집기 상태").textContent).toBe(
        "portfolio:row-a:v1:ready:0",
      ),
    );

    busyReports.mockClear();
    pendingReports.mockClear();
    renderedStates.length = 0;
    await user.click(
      screen.getByRole("button", { name: "저장된 원문 다시 로드" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("통합 편집기 상태").textContent).toBe(
        "portfolio:row-b:v1:ready:0",
      ),
    );
    expect(renderedStates).toContain("portfolio:row-b:v1:busy:0");
    expect(pendingReports).toHaveBeenCalledWith(0);
    expect(busyReports).toHaveBeenCalledWith(false);

    const oldBusy = staleCallbacks.busy;
    const oldPending = staleCallbacks.pending;
    if (!oldBusy || !oldPending) {
      throw new Error("Expected callbacks captured from the first document.");
    }
    act(() => {
      oldBusy(true);
      oldPending(7);
    });
    expect(screen.getByLabelText("통합 편집기 상태").textContent).toBe(
      "portfolio:row-b:v1:ready:0",
    );
  });

  it("keeps an imported source byte-for-byte and refreshes preview only explicitly", async () => {
    const user = userEvent.setup();
    const source = '<!doctype html>\n<html lang="ko">한글</html>\n';
    render(<EditorHarness initial={value()} />);
    const preview = screen.getByRole("region", {
      name: "HTML 원문 미리보기",
    });
    expect(preview.getAttribute("data-html")).toBe("");

    fireEvent.change(screen.getByLabelText("HTML 파일 불러오기"), {
      target: { files: [htmlFile("source.html", source)] },
    });
    const textarea = await screen.findByRole("textbox", { name: "HTML 원문" });
    await waitFor(() =>
      expect((textarea as HTMLTextAreaElement).value).toBe(source),
    );
    expect((textarea as HTMLTextAreaElement).value.endsWith("\n")).toBe(true);
    expect(preview.getAttribute("data-html")).toBe("");
    expect(
      screen.getByText("편집 내용이 아직 미리보기에 반영되지 않았습니다."),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "미리보기 새로고침" }));
    expect(preview.getAttribute("data-html")).toBe(source);
    expect(screen.getByText(/source\.html ·/).textContent).toContain(
      "source.html",
    );
  });

  it("keeps the current source when an overwrite dialog is cancelled", async () => {
    const user = userEvent.setup();
    render(<EditorHarness initial={value({ content: "현재 원문\n" })} />);
    fireEvent.change(screen.getByLabelText("HTML 파일 불러오기"), {
      target: { files: [htmlFile("replacement.htm", "교체 원문\n")] },
    });
    await screen.findByRole("dialog", { name: "HTML 원문 덮어쓰기" });
    await user.keyboard("{Escape}");
    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("현재 원문\n");
  });

  it("passes an asset base only after explicit enable and warns for authored base/fragment QA", async () => {
    const user = userEvent.setup();
    const source = '<base href="/old/"><a href="#section">이동</a>';
    render(<EditorHarness initial={value({ content: source })} />);
    const preview = screen.getByRole("region", {
      name: "HTML 원문 미리보기",
    });
    expect(preview.getAttribute("data-asset-base")).toBe("");

    await user.click(
      screen.getByRole("checkbox", { name: "Storage 상대경로 기준 사용" }),
    );
    expect(preview.getAttribute("data-asset-base")).toBe("");
    await user.click(screen.getByRole("button", { name: "미리보기 새로고침" }));
    expect(preview.getAttribute("data-asset-base")).toBe(
      `https://storage.example.com/storage/v1/object/public/zerosourcing/content/blog/${scope}/`,
    );
    expect(screen.getByText(/원문의 <base>는/).textContent).toContain(
      "덮어씁니다",
    );
    expect(screen.getByText(/fragment 링크/).textContent).toContain("QA");
    expect(preview.getAttribute("data-html")).toBe(source);
  });
});

describe("AdminContentEditor raw assets", () => {
  it("keeps review order across out-of-order completion and reports typed failure/pending counts", async () => {
    const user = userEvent.setup();
    const first =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const second =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    storageMocks.uploadRawHtmlAsset.mockImplementation(
      (_config: unknown, { file }: { readonly file: File }) =>
        file.name === "a.png" ? first.promise : second.promise,
    );
    const onBusyChange = vi.fn();
    const onPendingAssetCountChange = vi.fn();
    render(
      <EditorHarness
        initial={value()}
        onBusyChange={onBusyChange}
        onPendingAssetCountChange={onPendingAssetCountChange}
      />,
    );
    const files = [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ];
    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: { files },
    });
    const paths = screen.getAllByLabelText("저장 상대경로");
    await user.clear(paths[0] as HTMLInputElement);
    await user.type(paths[0] as HTMLInputElement, "images/custom-a.png");
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));

    await waitFor(() =>
      expect(storageMocks.uploadRawHtmlAsset).toHaveBeenCalledTimes(2),
    );
    expect(storageMocks.uploadRawHtmlAsset.mock.calls[0]?.[1]).toMatchObject({
      assetScope: scope,
      entity: "blog",
      relativePath: "images/custom-a.png",
    });
    expect(storageMocks.uploadRawHtmlAsset.mock.calls[1]?.[1]).toMatchObject({
      assetScope: scope,
      entity: "blog",
      relativePath: "images/b.png",
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenCalledWith(2),
    );
    expect(onBusyChange).toHaveBeenCalledWith(true);

    await act(async () => {
      second.resolve(rawUploadSuccess("b.png"));
      await second.promise;
    });
    const rowsAfterSecond = screen.getAllByRole("listitem");
    expect(within(rowsAfterSecond[0]!).getByText("a.png")).toBeTruthy();
    expect(within(rowsAfterSecond[0]!).getByText("업로드 중")).toBeTruthy();
    expect(within(rowsAfterSecond[1]!).getByText("b.png")).toBeTruthy();
    expect(within(rowsAfterSecond[1]!).getByText("업로드 완료")).toBeTruthy();

    await act(async () => {
      first.resolve({
        error: {
          kind: "content_asset_conflict",
          message: "같은 경로의 본문 asset이 이미 존재합니다.",
          path: `content/blog/${scope}/images/custom-a.png`,
        } satisfies AdminFailure,
        ok: false,
      });
      await first.promise;
    });
    expect(
      within(screen.getAllByRole("listitem")[0]!).getByText(
        "같은 경로의 본문 asset이 이미 존재합니다.",
      ),
    ).toBeTruthy();
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0),
    );
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it("cleans an exact successful object from a stale document and never mutates the new queue", async () => {
    const user = userEvent.setup();
    const pending =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    storageMocks.uploadRawHtmlAsset.mockReturnValue(pending.promise);
    render(<EditorHarness initial={value()} showDocumentSwitch />);
    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [new File(["a"], "stale.png", { type: "image/png" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await waitFor(() =>
      expect(storageMocks.uploadRawHtmlAsset).toHaveBeenCalledTimes(1),
    );
    await user.click(screen.getByRole("button", { name: "다른 문서 로드" }));

    await act(async () => {
      pending.resolve(rawUploadSuccess("stale.png"));
      await pending.promise;
    });
    await waitFor(() =>
      expect(storageMocks.removeContentAsset).toHaveBeenCalledWith(
        expect.anything(),
        {
          assetScope: scope,
          entity: "blog",
          path: `content/blog/${scope}/images/stale.png`,
        },
      ),
    );
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("keeps stale raw cleanup pending until exact-object removal settles", async () => {
    const user = userEvent.setup();
    const upload =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const cleanupResult = deferred<AdminRepositoryResult<null>>();
    const onPendingAssetCountChange = vi.fn();
    storageMocks.uploadRawHtmlAsset.mockReturnValue(upload.promise);
    storageMocks.removeContentAsset.mockReturnValue(cleanupResult.promise);
    render(
      <EditorHarness
        initial={value()}
        onPendingAssetCountChange={onPendingAssetCountChange}
        showDocumentSwitch
      />,
    );
    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [new File(["a"], "pending-cleanup.png", { type: "image/png" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );
    await user.click(screen.getByRole("button", { name: "다른 문서 로드" }));
    await act(async () => {
      upload.resolve(rawUploadSuccess("pending-cleanup.png"));
      await upload.promise;
    });
    await waitFor(() =>
      expect(storageMocks.removeContentAsset).toHaveBeenCalledTimes(1),
    );
    expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1);

    await act(async () => {
      cleanupResult.resolve({ ok: true, value: null });
      await cleanupResult.promise;
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0),
    );
  });

  it("keeps parent pending while an unmounted raw child finishes orphan cleanup", async () => {
    const user = userEvent.setup();
    const upload =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const cleanupResult = deferred<AdminRepositoryResult<null>>();
    const onPendingAssetCountChange = vi.fn();
    storageMocks.uploadRawHtmlAsset.mockReturnValue(upload.promise);
    storageMocks.removeContentAsset.mockReturnValue(cleanupResult.promise);
    render(
      <EditorHarness
        initial={value()}
        onPendingAssetCountChange={onPendingAssetCountChange}
        showForcedModeSwitch
      />,
    );
    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [new File(["a"], "mode-change.png", { type: "image/png" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );

    await user.click(screen.getByRole("button", { name: "외부 WYSIWYG 전환" }));
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1);
    await act(async () => {
      upload.resolve(rawUploadSuccess("mode-change.png"));
      await upload.promise;
    });
    await waitFor(() =>
      expect(storageMocks.removeContentAsset).toHaveBeenCalledTimes(1),
    );
    expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1);

    await act(async () => {
      cleanupResult.resolve({ ok: true, value: null });
      await cleanupResult.promise;
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0),
    );
  });

  it("aggregates remounted same-generation raw work through stale cleanup", async () => {
    const user = userEvent.setup();
    const firstUpload =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const secondUpload =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const firstCleanup = deferred<AdminRepositoryResult<null>>();
    const onPendingAssetCountChange = vi.fn();
    storageMocks.uploadRawHtmlAsset
      .mockReturnValueOnce(firstUpload.promise)
      .mockReturnValueOnce(secondUpload.promise);
    storageMocks.removeContentAsset.mockReturnValue(firstCleanup.promise);
    render(
      <EditorHarness
        initial={value()}
        onPendingAssetCountChange={onPendingAssetCountChange}
        showForcedModeSwitch
      />,
    );

    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [new File(["a"], "producer-a.png", { type: "image/png" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );

    await user.click(screen.getByRole("button", { name: "외부 WYSIWYG 전환" }));
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    await user.click(
      screen.getByRole("button", { name: "외부 HTML 원문 전환" }),
    );
    await screen.findByLabelText("asset 파일 선택");

    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [new File(["b"], "producer-b.png", { type: "image/png" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(2),
    );

    await act(async () => {
      firstUpload.resolve(rawUploadSuccess("producer-a.png"));
      await firstUpload.promise;
    });
    await waitFor(() =>
      expect(storageMocks.removeContentAsset).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          path: `content/blog/${scope}/images/producer-a.png`,
        }),
      ),
    );
    expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(2);

    await act(async () => {
      firstCleanup.resolve({ ok: true, value: null });
      await firstCleanup.promise;
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );

    await act(async () => {
      secondUpload.resolve(rawUploadSuccess("producer-b.png"));
      await secondUpload.promise;
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0),
    );
    expect(
      await screen.findByText(
        `저장 경로: content/blog/${scope}/images/producer-b.png`,
      ),
    ).toBeTruthy();
  });

  it("resets parent pending on full unmount without late state updates", async () => {
    const user = userEvent.setup();
    const upload =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const onPendingAssetCountChange = vi.fn();
    storageMocks.uploadRawHtmlAsset.mockReturnValue(upload.promise);
    const view = render(
      <EditorHarness
        initial={value()}
        onPendingAssetCountChange={onPendingAssetCountChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [new File(["a"], "unmount.png", { type: "image/png" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );

    view.unmount();
    expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0);
    const callCountAfterUnmount = onPendingAssetCountChange.mock.calls.length;
    await act(async () => {
      upload.resolve(rawUploadSuccess("unmount.png"));
      await upload.promise;
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(storageMocks.removeContentAsset).toHaveBeenCalledTimes(1),
    );
    expect(onPendingAssetCountChange).toHaveBeenCalledTimes(
      callCountAfterUnmount,
    );
  });

  it("reports stale exact-cleanup failure as an operational recovery path", async () => {
    const user = userEvent.setup();
    const pending =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const stalePath = `content/blog/${scope}/images/orphaned.png`;
    storageMocks.uploadRawHtmlAsset.mockReturnValue(pending.promise);
    storageMocks.removeContentAsset.mockResolvedValueOnce({
      error: {
        kind: "content_asset_cleanup_failure",
        message: "본문 asset을 자동 정리하지 못했습니다.",
        path: stalePath,
      },
      ok: false,
    });
    render(<EditorHarness initial={value()} showDocumentSwitch />);
    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [new File(["a"], "orphaned.png", { type: "image/png" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await waitFor(() =>
      expect(storageMocks.uploadRawHtmlAsset).toHaveBeenCalledTimes(1),
    );
    await user.click(screen.getByRole("button", { name: "다른 문서 로드" }));

    await act(async () => {
      pending.resolve(rawUploadSuccess("orphaned.png"));
      await pending.promise;
    });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("자동 정리하지 못했습니다");
    expect(alert.textContent).toContain(stalePath);
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("preserves every concurrent stale cleanup path until individually dismissed", async () => {
    const user = userEvent.setup();
    const firstUpload =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const secondUpload =
      deferred<
        AdminRepositoryResult<ReturnType<typeof rawUploadSuccess>["value"]>
      >();
    const firstPath = `content/blog/${scope}/images/orphan-a.png`;
    const secondPath = `content/blog/${scope}/images/orphan-b.png`;
    storageMocks.uploadRawHtmlAsset
      .mockReturnValueOnce(firstUpload.promise)
      .mockReturnValueOnce(secondUpload.promise);
    storageMocks.removeContentAsset.mockImplementation(
      async (_config, input: { readonly path: string }) => ({
        error: {
          kind: "content_asset_cleanup_failure" as const,
          message: `정리 실패: ${input.path}`,
          path: input.path,
        },
        ok: false as const,
      }),
    );
    render(<EditorHarness initial={value()} showDocumentSwitch />);
    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [
          new File(["a"], "orphan-a.png", { type: "image/png" }),
          new File(["b"], "orphan-b.png", { type: "image/png" }),
        ],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await waitFor(() =>
      expect(storageMocks.uploadRawHtmlAsset).toHaveBeenCalledTimes(2),
    );
    await user.click(screen.getByRole("button", { name: "다른 문서 로드" }));

    await act(async () => {
      firstUpload.resolve(rawUploadSuccess("orphan-a.png"));
      secondUpload.resolve(rawUploadSuccess("orphan-b.png"));
      await Promise.all([firstUpload.promise, secondUpload.promise]);
    });

    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
    const alerts = screen.getAllByRole("alert");
    expect(alerts.some((alert) => alert.textContent?.includes(firstPath))).toBe(
      true,
    );
    expect(
      alerts.some((alert) => alert.textContent?.includes(secondPath)),
    ).toBe(true);

    await user.click(
      screen.getByRole("button", {
        name: `고립 asset 알림 닫기: ${firstPath}`,
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", {
          name: `고립 asset 알림 닫기: ${firstPath}`,
        }),
      ).toBeNull(),
    );
    expect(
      screen.getByRole("button", {
        name: `고립 asset 알림 닫기: ${secondPath}`,
      }),
    ).toBeTruthy();
  });

  it.each([
    {
      expectedMessage: "이전 asset 삭제 실패",
      outcome: "result" as const,
    },
    {
      expectedMessage: "이전 문서의 고립 asset을 자동 정리하지 못했습니다.",
      outcome: "throw" as const,
    },
  ])(
    "reports a stale explicit remove $outcome with its exact Storage path",
    async ({ expectedMessage, outcome }) => {
      const user = userEvent.setup();
      const fileName = `remove-stale-${outcome}.png`;
      const stalePath = `content/blog/${scope}/images/${fileName}`;
      const removal = deferred<AdminRepositoryResult<null>>();
      const onPendingAssetCountChange = vi.fn();
      storageMocks.uploadRawHtmlAsset.mockResolvedValue(
        rawUploadSuccess(fileName),
      );
      render(
        <EditorHarness
          initial={value()}
          onPendingAssetCountChange={onPendingAssetCountChange}
          showDocumentSwitch
        />,
      );
      fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
        target: {
          files: [new File(["a"], fileName, { type: "image/png" })],
        },
      });
      await user.click(
        screen.getByRole("button", { name: "선택 asset 업로드" }),
      );
      await user.click(
        screen.getByRole("button", { name: /^기준 없이 업로드/ }),
      );
      const removeButton = await screen.findByRole("button", {
        name: "Storage에서 제거",
      });
      storageMocks.removeContentAsset.mockReturnValue(removal.promise);

      await user.click(removeButton);
      await waitFor(() =>
        expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
      );
      await user.click(screen.getByRole("button", { name: "다른 문서 로드" }));

      await act(async () => {
        if (outcome === "result") {
          removal.resolve({
            error: {
              kind: "content_asset_cleanup_failure",
              message: expectedMessage,
              path: stalePath,
            },
            ok: false,
          });
          await removal.promise;
        } else {
          removal.reject(new Error("remove request crashed"));
          await removal.promise.catch(() => undefined);
        }
      });

      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toContain(expectedMessage);
      expect(alert.textContent).toContain(stalePath);
      expect(screen.queryByRole("listitem")).toBeNull();
      await waitFor(() =>
        expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0),
      );
    },
  );

  it("rotates only the scope after explicit complete-set confirmation", async () => {
    const user = userEvent.setup();
    const randomUuid = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue(secondScope);
    render(
      <EditorHarness
        initial={value({
          content: '<img src="images/a.png">',
          contentAssetBaseEnabled: true,
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "새 asset 버전" }));
    const dialog = screen.getByRole("dialog", {
      name: "새 asset 버전 만들기",
    });
    expect(within(dialog).getByText(/전체 상대경로 파일/)).toBeTruthy();
    await user.click(
      within(dialog).getByRole("button", { name: /^새 asset 버전 생성/ }),
    );
    await waitFor(() =>
      expect(screen.getByText(`asset scope: ${secondScope}`)).toBeTruthy(),
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe('<img src="images/a.png">');
    expect(
      (
        screen.getByRole("checkbox", {
          name: "Storage 상대경로 기준 사용",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(randomUuid).toHaveBeenCalledTimes(1);
  });

  it("discards an inactive WYSIWYG image draft only through the named scope choice", async () => {
    const user = userEvent.setup();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(secondScope);
    render(
      <EditorHarness
        initial={value({
          content: '<img src="images/raw.png">',
          contentJson: {
            content: [
              {
                attrs: {
                  alt: "이전 이미지",
                  src: "https://storage.example.com/old-image.png",
                },
                type: "image",
              },
            ],
            type: "doc",
          },
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "새 asset 버전" }));
    const rotationDialog = screen.getByRole("dialog", {
      name: "새 asset 버전 만들기",
    });
    expect(rotationDialog.textContent).toContain(
      "이전 WYSIWYG 이미지 초안을 폐기",
    );
    await user.click(
      within(rotationDialog).getByRole("button", {
        name: /^이전 WYSIWYG 이미지 초안을 폐기하고 새 asset 버전 생성/,
      }),
    );
    await waitFor(() =>
      expect(screen.getByText(`asset scope: ${secondScope}`)).toBeTruthy(),
    );

    await user.click(screen.getByRole("radio", { name: /WYSIWYG 에디터/ }));
    await user.click(
      screen.getByRole("button", { name: /^이전 WYSIWYG 복원/ }),
    );
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    expect(richEditorCapture.latest?.document).toBe(EMPTY_TIPTAP_DOCUMENT);
  });

  it("closes a raw choice immediately when record A rerenders as record B", async () => {
    const user = userEvent.setup();
    render(<EditorHarness initial={value()} showDocumentSwitch />);
    await user.click(screen.getByRole("button", { name: "새 asset 버전" }));
    expect(
      screen.getByRole("dialog", { name: "새 asset 버전 만들기" }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "다른 문서 로드" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "새 asset 버전 만들기" }),
      ).toBeNull(),
    );
    expect(screen.getByText(`asset scope: ${scope}`)).toBeTruthy();
  });

  it("copies uploaded asset results and reports clipboard failure accessibly", async () => {
    const user = userEvent.setup();
    const uploaded = rawUploadSuccess("copy.png");
    storageMocks.uploadRawHtmlAsset.mockResolvedValue(uploaded);
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<EditorHarness initial={value()} />);
    fireEvent.change(screen.getByLabelText("asset 파일 선택"), {
      target: {
        files: [new File(["copy"], "copy.png", { type: "image/png" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "선택 asset 업로드" }));
    await user.click(screen.getByRole("button", { name: /^기준 없이 업로드/ }));
    await user.click(
      await screen.findByRole("button", { name: "공개 URL 복사" }),
    );
    expect(writeText).toHaveBeenCalledWith(uploaded.value.publicUrl);
    expect(
      (
        await screen.findByText("공개 URL을 클립보드에 복사했습니다.")
      ).getAttribute("role"),
    ).toBe("status");

    writeText.mockRejectedValueOnce(new Error("clipboard denied"));
    await user.click(screen.getByRole("button", { name: "저장 경로 복사" }));
    expect(
      (
        await screen.findByText(
          "클립보드에 복사하지 못했습니다. 값을 직접 선택해 주세요.",
        )
      ).getAttribute("role"),
    ).toBe("alert");
  });
});

describe("AdminContentEditor authoring modes", () => {
  it("restores A or generated B by named choices without parsing either raw source", async () => {
    const user = userEvent.setup();
    render(<EditorHarness initial={value({ content: "A" })} />);
    await user.click(screen.getByRole("radio", { name: /WYSIWYG 에디터/ }));
    await user.click(
      screen.getByRole("button", { name: /^이전 WYSIWYG 복원/ }),
    );
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    await user.click(screen.getByRole("button", { name: "WYSIWYG B 입력" }));
    await user.click(screen.getByRole("radio", { name: /HTML 원문/ }));
    await user.click(screen.getByRole("button", { name: /^이전 원문 복원/ }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("A");

    await user.click(screen.getByRole("radio", { name: /WYSIWYG 에디터/ }));
    await user.click(
      screen.getByRole("button", { name: /^이전 WYSIWYG 복원/ }),
    );
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    await user.click(screen.getByRole("radio", { name: /HTML 원문/ }));
    await user.click(
      screen.getByRole("button", { name: /^현재 생성 HTML 사용/ }),
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("<p>B</p>");
  });

  it("escapes legacy markup in the plain preview and requires a named conversion", async () => {
    const user = userEvent.setup();
    const legacy = "<b title=\"x\">&'본문'</b>";
    render(
      <EditorHarness
        initial={value({ content: legacy, contentMode: "text" })}
      />,
    );
    expect(
      screen.queryByRole("region", { name: "HTML 원문 미리보기" }),
    ).toBeNull();
    const preview = screen.getByLabelText("기존 TEXT 미리보기");
    expect(preview.textContent).toBe(legacy);
    expect(preview.querySelector("b")).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "HTML 원문으로 변환" }),
    );
    const conversionDialog = screen.getByRole("dialog", {
      name: "기존 TEXT를 HTML로 변환",
    });
    await user.click(
      within(conversionDialog).getByRole("button", {
        name: /^HTML 원문으로 변환/,
      }),
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("<p>&lt;b title=&quot;x&quot;&gt;&amp;&#39;본문&#39;&lt;/b&gt;</p>");
  });

  it("emits a canonical WYSIWYG pair, gates readiness, and adapts scoped storage", async () => {
    const onBusyChange = vi.fn();
    const onPendingAssetCountChange = vi.fn();
    const onValueChange = vi.fn();
    storageMocks.uploadContentAsset.mockResolvedValue({
      ok: true,
      value: {
        alt: "image",
        assetScope: scope,
        entity: "blog",
        path: `content/blog/${scope}/images/00000000-0000-4000-8000-000000000001.png`,
        publicUrl:
          `https://storage.example.com/storage/v1/object/public/zerosourcing/` +
          `content/blog/${scope}/images/00000000-0000-4000-8000-000000000001.png`,
      },
    });
    render(
      <EditorHarness
        initial={value({
          content: "<p>B</p>",
          contentAuthoringMode: "wysiwyg",
        })}
        onBusyChange={onBusyChange}
        onPendingAssetCountChange={onPendingAssetCountChange}
        onValueChange={onValueChange}
      />,
    );
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    await waitFor(() => expect(onValueChange).toHaveBeenCalledTimes(1));
    expect(onValueChange.mock.calls[0]?.[0]).toMatchObject({
      content: "<p>B</p>",
      contentAuthoringMode: "wysiwyg",
      contentJson: savedDocument,
    });
    expect(onBusyChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));

    const props = richEditorCapture.latest;
    if (!props) throw new Error("Expected the lazy rich editor to mount.");
    expect(props.documentKey).toBe(`row:1:scope:${scope}`);
    const file = new File(["image"], "image.png", { type: "image/png" });
    const uploaded = await props.uploadImage(file);
    expect(uploaded.path).toContain(`content/blog/${scope}/images/`);
    expect(storageMocks.uploadContentAsset).toHaveBeenCalledWith(
      expect.anything(),
      { assetScope: scope, entity: "blog", file },
    );
    expect(
      props.isAllowedImageUrl(
        `https://storage.example.com/current/${scope}/image.png`,
      ),
    ).toBe(true);
    expect(storageMocks.isContentImagePublicUrlOwnedBy).toHaveBeenCalledWith(
      expect.anything(),
      {
        assetScope: scope,
        entity: "blog",
        publicUrl: `https://storage.example.com/current/${scope}/image.png`,
      },
    );

    const producerKey = Symbol("rich-editor");
    props.onPendingAssetWorkChange({
      count: 1,
      generation: props.documentKey,
      producerKey,
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    props.onPendingAssetWorkChange({
      count: 0,
      generation: props.documentKey,
      producerKey,
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0),
    );

    const orphan: UploadedEditorImage = {
      alt: "image",
      path: uploaded.path,
      url: uploaded.url,
    };
    await props.cleanupOrphanedImage(orphan, "placeholder_deleted");
    expect(storageMocks.removeContentAsset).toHaveBeenCalledWith(
      expect.anything(),
      { assetScope: scope, entity: "blog", path: uploaded.path },
    );
  });

  it("uses a new exact scope generation when the controlled record changes", async () => {
    function ScopeHarness() {
      const [current, setCurrent] = useState(
        value({ contentAuthoringMode: "wysiwyg" }),
      );
      useEffect(() => {
        if (
          current.contentAssetScope === scope &&
          current.content === "<p>B</p>"
        ) {
          setCurrent((existing) => ({
            ...existing,
            contentAssetScope: secondScope,
          }));
        }
      }, [current]);
      return (
        <AdminContentEditor
          disabled={false}
          documentKey="row:scope"
          entity="blog"
          onBusyChange={() => undefined}
          onChange={setCurrent}
          onPendingAssetCountChange={() => undefined}
          value={current}
        />
      );
    }
    render(<ScopeHarness />);
    await waitFor(() =>
      expect(richEditorCapture.latest?.documentKey).toBe(
        `row:scope:scope:${secondScope}`,
      ),
    );
  });

  it("aggregates remounted same-generation WYSIWYG producers independently", async () => {
    const user = userEvent.setup();
    const onPendingAssetCountChange = vi.fn();
    render(
      <EditorHarness
        initial={value({ contentAuthoringMode: "wysiwyg" })}
        onPendingAssetCountChange={onPendingAssetCountChange}
        showForcedModeSwitch
      />,
    );
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    const oldProps = richEditorCapture.latest;
    if (!oldProps) throw new Error("Expected the first rich editor instance.");
    const oldProducerKey = Symbol("old-rich-producer");
    act(() => {
      oldProps.onPendingAssetWorkChange({
        count: 1,
        generation: oldProps.documentKey,
        producerKey: oldProducerKey,
      });
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );

    await user.click(
      screen.getByRole("button", { name: "외부 HTML 원문 전환" }),
    );
    await screen.findByLabelText("asset 파일 선택");
    await user.click(screen.getByRole("button", { name: "외부 WYSIWYG 전환" }));
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    const newProps = richEditorCapture.latest;
    if (!newProps) throw new Error("Expected the remounted rich editor.");
    const newProducerKey = Symbol("new-rich-producer");
    act(() => {
      newProps.onPendingAssetWorkChange({
        count: 1,
        generation: newProps.documentKey,
        producerKey: newProducerKey,
      });
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(2),
    );

    act(() => {
      oldProps.onPendingAssetWorkChange({
        count: 0,
        generation: oldProps.documentKey,
        producerKey: oldProducerKey,
      });
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );

    act(() => {
      newProps.onPendingAssetWorkChange({
        count: 0,
        generation: newProps.documentKey,
        producerKey: newProducerKey,
      });
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0),
    );
  });

  it("keeps old-generation work pending and hides its errors from the new record", async () => {
    const user = userEvent.setup();
    const onBusyChange = vi.fn();
    const onPendingAssetCountChange = vi.fn();
    render(
      <EditorHarness
        initial={value({ contentAuthoringMode: "wysiwyg" })}
        onBusyChange={onBusyChange}
        onPendingAssetCountChange={onPendingAssetCountChange}
        showDocumentSwitch
      />,
    );
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    const oldProps = richEditorCapture.latest;
    if (!oldProps) throw new Error("Expected record A editor props.");
    const oldProducerKey = Symbol("old-rich-editor");
    act(() => {
      oldProps.onPendingAssetWorkChange({
        count: 1,
        generation: oldProps.documentKey,
        producerKey: oldProducerKey,
      });
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1),
    );

    await user.click(screen.getByRole("button", { name: "다른 문서 로드" }));
    await waitFor(() =>
      expect(richEditorCapture.latest?.documentKey).toBe(
        `row:2:scope:${scope}`,
      ),
    );
    expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(1);
    act(() => oldProps.onUploadError(new Error("old upload failure")));
    expect(
      screen.queryByText(
        "본문 이미지 업로드에 실패했습니다. 다시 시도해 주세요.",
      ),
    ).toBeNull();

    act(() => {
      oldProps.onPendingAssetWorkChange({
        count: 0,
        generation: oldProps.documentKey,
        producerKey: oldProducerKey,
      });
    });
    await waitFor(() =>
      expect(onPendingAssetCountChange).toHaveBeenLastCalledWith(0),
    );
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it("clears the current WYSIWYG asset error when a retry begins", async () => {
    render(
      <EditorHarness initial={value({ contentAuthoringMode: "wysiwyg" })} />,
    );
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    const props = richEditorCapture.latest;
    if (!props) throw new Error("Expected the rich editor props.");
    const producerKey = Symbol("current-rich-editor");
    act(() => props.onUploadError(new Error("current upload failure")));
    expect(
      await screen.findByText(
        "본문 이미지 업로드에 실패했습니다. 다시 시도해 주세요.",
      ),
    ).toBeTruthy();

    act(() => {
      props.onPendingAssetWorkChange({
        count: 1,
        generation: props.documentKey,
        producerKey,
      });
    });
    await waitFor(() =>
      expect(
        screen.queryByText(
          "본문 이미지 업로드에 실패했습니다. 다시 시도해 주세요.",
        ),
      ).toBeNull(),
    );
    act(() => {
      props.onPendingAssetWorkChange({
        count: 0,
        generation: props.documentKey,
        producerKey,
      });
    });
  });

  it("fails closed and reports busy when stored WYSIWYG content is invalid", async () => {
    const onBusyChange = vi.fn();
    render(
      <EditorHarness
        initial={value({ contentAuthoringMode: "wysiwyg" })}
        onBusyChange={onBusyChange}
      />,
    );
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    const props = richEditorCapture.latest;
    if (!props) throw new Error("Expected the lazy rich editor to mount.");
    act(() => props.onContentError(new Error("unsafe stored content")));

    expect(
      await screen.findByText(
        "이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다.",
      ),
    ).toBeTruthy();
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(true));
  });
});
