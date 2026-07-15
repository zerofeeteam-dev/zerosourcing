// @vitest-environment jsdom
import type { TiptapDocument } from "@repo/content/types";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_TIPTAP_DOCUMENT,
  type ManagedContentFormValue,
} from "../../lib/managedContent";
import type { AdminRichTextEditorProps } from "./AdminRichTextEditor";
import { AdminContentEditor } from "./AdminContentEditor";

const scope = "00000000-0000-4000-8000-0000000000ab";

const storageMocks = vi.hoisted(() => ({
  isContentImagePublicUrlOwnedBy: vi.fn(() => true),
  removeContentAsset: vi.fn(),
  uploadContentAsset: vi.fn(),
}));

const richEditorCapture = vi.hoisted(() => ({
  latest: null as AdminRichTextEditorProps | null,
}));

const previewCapture = vi.hoisted(() => ({
  latest: null as {
    readonly html: string;
    readonly interactiveImages: boolean;
    readonly onSelectImage: (slotIndex: number) => void;
  } | null,
}));

vi.mock("../../lib/supabase", () => ({
  supabaseConfig: {
    client: {},
    kind: "enabled",
    url: "https://storage.example.com",
  },
}));

vi.mock("../../lib/contentAssetStorage", () => ({
  isContentImagePublicUrlOwnedBy: storageMocks.isContentImagePublicUrlOwnedBy,
  removeContentAsset: storageMocks.removeContentAsset,
  uploadContentAsset: storageMocks.uploadContentAsset,
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
      onCreate({ document, html: text ? `<p>${text}</p>` : "<p></p>" });
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

vi.mock("./AdminContentPreview", async () => {
  const React = await import("react");
  return {
    AdminContentPreview: (props: {
      readonly html: string;
      readonly interactiveImages: boolean;
      readonly onSelectImage: (slotIndex: number) => void;
    }) => {
      previewCapture.latest = props;
      return React.createElement(
        "button",
        {
          onClick: () => props.onSelectImage(0),
          type: "button",
        },
        "미리보기 이미지 선택",
      );
    },
  };
});

const savedDocument: TiptapDocument = {
  content: [
    {
      content: [{ text: "A", type: "text" }],
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
  readonly initial: ManagedContentFormValue;
  readonly onValueChange?: (next: ManagedContentFormValue) => void;
  readonly previewContainer?: HTMLElement | null;
  readonly showDocumentSwitch?: boolean;
};

function EditorHarness({
  initial,
  onValueChange = () => undefined,
  previewContainer,
  showDocumentSwitch = false,
}: HarnessProps) {
  const [current, setCurrent] = useState(initial);
  const [documentKey, setDocumentKey] = useState("row:1");
  return (
    <>
      {showDocumentSwitch ? (
        <button onClick={() => setDocumentKey("row:2")} type="button">
          다른 문서 로드
        </button>
      ) : null}
      <AdminContentEditor
        disabled={false}
        documentKey={documentKey}
        entity="blog"
        onBusyChange={() => undefined}
        onChange={(next) => {
          onValueChange(next);
          setCurrent(next);
        }}
        onPendingAssetCountChange={() => undefined}
        previewContainer={previewContainer}
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

beforeEach(() => {
  richEditorCapture.latest = null;
  previewCapture.latest = null;
  storageMocks.isContentImagePublicUrlOwnedBy.mockClear();
  storageMocks.removeContentAsset.mockReset();
  storageMocks.removeContentAsset.mockResolvedValue({ ok: true, value: null });
  storageMocks.uploadContentAsset.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdminContentEditor raw source", () => {
  it("renders the preview in the provided external container", () => {
    const previewContainer = document.createElement("div");
    document.body.append(previewContainer);
    const { container } = render(
      <EditorHarness
        initial={value({ content: '<img src="">' })}
        previewContainer={previewContainer}
      />,
    );

    expect(container.textContent).not.toContain("미리보기 이미지 선택");
    expect(previewContainer.textContent).toContain("미리보기 이미지 선택");
    previewContainer.remove();
  });

  it("keeps only the source controls and preserves stored compatibility fields", async () => {
    const onValueChange = vi.fn();
    const source = '<!doctype html>\n<html lang="ko">한글</html>\n';
    render(
      <EditorHarness
        initial={value({
          contentAssetBaseEnabled: true,
          contentSourceBackup: "저장된 원문 백업",
        })}
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByRole("radio", { name: "HTML 원문" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "HTML 원문" })).toBeTruthy();
    expect(screen.getByLabelText("HTML 파일 불러오기")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "미리보기 새로고침" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "원문 백업 복원" })).toBeNull();
    expect(screen.queryByText("HTML asset")).toBeNull();
    expect(screen.queryByText("HTML 원문 미리보기")).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Storage 상대경로 기준 사용" }),
    ).toBeNull();
    expect(screen.queryByTitle("HTML 원문 미리보기")).toBeNull();

    fireEvent.change(screen.getByLabelText("HTML 파일 불러오기"), {
      target: { files: [htmlFile("source.html", source)] },
    });
    const textarea = await screen.findByRole("textbox", { name: "HTML 원문" });
    await waitFor(() =>
      expect((textarea as HTMLTextAreaElement).value).toBe(source),
    );
    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        content: source,
        contentAssetBaseEnabled: true,
        contentAssetScope: scope,
        contentSourceBackup: "저장된 원문 백업",
      }),
    );
    expect(screen.getByText(/불러온 파일: source\.html/)).toBeTruthy();
  });

  it("reports unsupported HTML imports without replacing the current source", () => {
    render(<EditorHarness initial={value({ content: "보존할 원문" })} />);
    fireEvent.change(screen.getByLabelText("HTML 파일 불러오기"), {
      target: {
        files: [new File(["png"], "image.png", { type: "image/png" })],
      },
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "HTML 또는 HTM 파일만 불러올 수 있습니다.",
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("보존할 원문");
  });

  it("ignores a late file read after the active document changes", async () => {
    const fileRead = deferred<string>();
    const file = new File(["unused"], "late.html", { type: "text/html" });
    Object.defineProperty(file, "text", {
      configurable: true,
      value: vi.fn(() => fileRead.promise),
    });
    const user = userEvent.setup();
    render(
      <EditorHarness
        initial={value({ content: "새 문서 원문" })}
        showDocumentSwitch
      />,
    );

    fireEvent.change(screen.getByLabelText("HTML 파일 불러오기"), {
      target: { files: [file] },
    });
    await user.click(screen.getByRole("button", { name: "다른 문서 로드" }));
    await act(async () => {
      fileRead.resolve("늦게 도착한 원문");
      await fileRead.promise;
    });

    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("새 문서 원문");
  });

  it("uploads a selected preview image and writes its URL to only the chosen empty image", async () => {
    const onValueChange = vi.fn();
    const publicUrl = "https://storage.example.com/content/blog/image.webp";
    storageMocks.uploadContentAsset.mockResolvedValue({
      ok: true,
      value: {
        alt: "image",
        assetScope: scope,
        entity: "blog",
        path: `content/blog/${scope}/images/image.webp`,
        publicUrl,
      },
    });
    render(
      <EditorHarness
        initial={value({
          content:
            '<!doctype html><img src=""><img src="https://example.com/kept.webp">',
        })}
        onValueChange={onValueChange}
      />,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "미리보기 이미지 선택" }));
    const file = new File(["image"], "image.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("HTML 이미지 파일 선택"), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(onValueChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          content: `<!doctype html><img src="${publicUrl}"><img src="https://example.com/kept.webp">`,
        }),
      ),
    );
    expect(storageMocks.uploadContentAsset).toHaveBeenCalledWith(
      expect.anything(),
      { assetScope: scope, entity: "blog", file },
    );
    expect(storageMocks.removeContentAsset).not.toHaveBeenCalled();
  });

  it("replaces an existing preview image source and clears its srcset", async () => {
    const onValueChange = vi.fn();
    const publicUrl = "https://storage.example.com/content/blog/replaced.webp";
    storageMocks.uploadContentAsset.mockResolvedValue({
      ok: true,
      value: {
        alt: "replaced",
        assetScope: scope,
        entity: "blog",
        path: `content/blog/${scope}/images/replaced.webp`,
        publicUrl,
      },
    });
    render(
      <EditorHarness
        initial={value({
          content:
            '<img src="https://example.com/old.webp" srcset="https://example.com/old@2x.webp 2x"><img src="https://example.com/kept.webp">',
        })}
        onValueChange={onValueChange}
      />,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "미리보기 이미지 선택" }));
    const file = new File(["image"], "replaced.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("HTML 이미지 파일 선택"), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(onValueChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          content: `<img src="${publicUrl}" srcset=""><img src="https://example.com/kept.webp">`,
        }),
      ),
    );
  });

  it("keeps the edited source and removes the uploaded object when the source changes during upload", async () => {
    const pendingUpload = deferred<{
      readonly ok: true;
      readonly value: {
        readonly alt: string;
        readonly assetScope: string;
        readonly entity: "blog";
        readonly path: string;
        readonly publicUrl: string;
      };
    }>();
    storageMocks.uploadContentAsset.mockReturnValue(pendingUpload.promise);
    render(<EditorHarness initial={value({ content: '<img src="">' })} />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "미리보기 이미지 선택" }));
    const file = new File(["image"], "image.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("HTML 이미지 파일 선택"), {
      target: { files: [file] },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "HTML 원문" }), {
      target: { value: "작성 중 변경한 원문" },
    });
    await waitFor(() =>
      expect(
        (
          screen.getByRole("textbox", {
            name: "HTML 원문",
          }) as HTMLTextAreaElement
        ).value,
      ).toBe("작성 중 변경한 원문"),
    );
    await act(async () => {
      pendingUpload.resolve({
        ok: true,
        value: {
          alt: "image",
          assetScope: scope,
          entity: "blog",
          path: `content/blog/${scope}/images/image.webp`,
          publicUrl: "https://storage.example.com/content/blog/image.webp",
        },
      });
      await pendingUpload.promise;
    });

    await waitFor(() =>
      expect(storageMocks.removeContentAsset).toHaveBeenCalledWith(
        expect.anything(),
        {
          assetScope: scope,
          entity: "blog",
          path: `content/blog/${scope}/images/image.webp`,
        },
      ),
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("작성 중 변경한 원문");
    expect((await screen.findByRole("alert")).textContent).toContain(
      "본문이 변경되어",
    );
  });
});

describe("AdminContentEditor authoring modes", () => {
  it("switches immediately and preserves canonical HTML through WYSIWYG", async () => {
    const user = userEvent.setup();
    render(<EditorHarness initial={value({ content: "A" })} />);

    await user.click(screen.getByRole("radio", { name: /WYSIWYG 에디터/ }));
    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "WYSIWYG B 입력" }));
    await user.click(screen.getByRole("radio", { name: /HTML 원문/ }));

    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("<p>B</p>");
  });

  it("converts legacy text directly to an escaped HTML source", async () => {
    const user = userEvent.setup();
    const legacy = "<b title=\"x\">&'본문'</b>";
    render(
      <EditorHarness
        initial={value({ content: legacy, contentMode: "text" })}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "HTML 원문으로 변환" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      (
        screen.getByRole("textbox", {
          name: "HTML 원문",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("<p>&lt;b title=&quot;x&quot;&gt;&amp;&#39;본문&#39;&lt;/b&gt;</p>");
  });

  it("keeps scoped WYSIWYG image upload behavior", async () => {
    storageMocks.uploadContentAsset.mockResolvedValue({
      ok: true,
      value: {
        alt: "image",
        assetScope: scope,
        entity: "blog",
        path: `content/blog/${scope}/images/image.png`,
        publicUrl: `https://storage.example.com/content/blog/${scope}/images/image.png`,
      },
    });
    render(
      <EditorHarness
        initial={value({
          contentAuthoringMode: "wysiwyg",
          contentJson: EMPTY_TIPTAP_DOCUMENT,
        })}
      />,
    );

    await screen.findByRole("button", { name: "WYSIWYG B 입력" });
    const props = richEditorCapture.latest;
    if (!props) throw new Error("Expected the rich editor props.");
    const file = new File(["image"], "image.png", { type: "image/png" });
    await expect(props.uploadImage(file)).resolves.toMatchObject({
      path: `content/blog/${scope}/images/image.png`,
    });
    expect(storageMocks.uploadContentAsset).toHaveBeenCalledWith(
      expect.anything(),
      { assetScope: scope, entity: "blog", file },
    );
  });
});
