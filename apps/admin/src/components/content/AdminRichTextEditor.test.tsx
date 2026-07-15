// @vitest-environment jsdom
import type { TiptapDocument } from "@repo/content/types";
import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  type MockInstance,
  vi,
} from "vitest";
import {
  AdminRichTextEditor,
  type AdminRichTextEditorProps,
  type UploadedEditorImage,
} from "./AdminRichTextEditor";
import {
  createContentEditorExtensions,
  isAllowedEditorLinkHref,
  normalizeEditorLinkHref,
} from "./contentEditorExtensions";

const emptyRect = new DOMRect(0, 0, 0, 0);

Object.defineProperty(document, "elementFromPoint", {
  configurable: true,
  value: () => document.querySelector<HTMLElement>("[role='textbox']"),
});

Object.defineProperties(Range.prototype, {
  getBoundingClientRect: {
    configurable: true,
    value: () => emptyRect,
  },
  getClientRects: {
    configurable: true,
    value: () => [],
  },
});

if (!("createObjectURL" in URL)) {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => "blob:fallback",
  });
}
if (!("revokeObjectURL" in URL)) {
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: () => undefined,
  });
}
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      addEventListener: () => undefined,
      matches: false,
      removeEventListener: () => undefined,
    }),
  });
}

const emptyDocument: TiptapDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const savedDocument: TiptapDocument = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "저장된 본문" }],
    },
  ],
};

function uploaded(name: string): UploadedEditorImage {
  return {
    alt: name,
    path: `content/blog/scope/images/${name}.png`,
    url: `https://storage.example.com/content/blog/scope/images/${name}.png`,
  };
}

function isScopeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.origin === "https://storage.example.com" &&
      parsed.pathname.startsWith("/content/blog/scope/images/")
    );
  } catch {
    return false;
  }
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

type EditorMocks = {
  cleanupOrphanedImage: Mock<AdminRichTextEditorProps["cleanupOrphanedImage"]>;
  isAllowedImageUrl: Mock<AdminRichTextEditorProps["isAllowedImageUrl"]>;
  onChange: Mock<AdminRichTextEditorProps["onChange"]>;
  onContentError: Mock<AdminRichTextEditorProps["onContentError"]>;
  onCreate: Mock<AdminRichTextEditorProps["onCreate"]>;
  onPendingAssetWorkChange: Mock<
    AdminRichTextEditorProps["onPendingAssetWorkChange"]
  >;
  onUploadError: Mock<AdminRichTextEditorProps["onUploadError"]>;
  uploadImage: Mock<AdminRichTextEditorProps["uploadImage"]>;
};

function createEditorProps(
  overrides: Partial<AdminRichTextEditorProps> = {},
): AdminRichTextEditorProps & EditorMocks {
  return {
    cleanupOrphanedImage: vi.fn(async () => undefined),
    disabled: false,
    document: emptyDocument,
    documentKey: "new-record",
    isAllowedImageUrl: vi.fn(isScopeImageUrl),
    onChange: vi.fn(),
    onContentError: vi.fn(),
    onCreate: vi.fn(),
    onPendingAssetWorkChange: vi.fn(),
    onUploadError: vi.fn(),
    uploadImage: vi.fn(async (file) => uploaded(file.name)),
    ...overrides,
  } as AdminRichTextEditorProps & EditorMocks;
}

function renderEditor(props: AdminRichTextEditorProps) {
  return render(
    <StrictMode>
      <AdminRichTextEditor {...props} />
    </StrictMode>,
  );
}

async function readyEditor(props: EditorMocks): Promise<HTMLElement> {
  const editor = await screen.findByRole("textbox", {
    name: "본문 WYSIWYG 편집기",
  });
  await waitFor(() => expect(props.onCreate).toHaveBeenCalledTimes(1));
  return editor;
}

function editorInstance(editor: HTMLElement): Editor {
  const instance = (editor as HTMLElement & { editor?: Editor }).editor;
  if (!instance)
    throw new Error("Expected the mounted Tiptap editor instance.");
  return instance;
}

function selectImage(editor: HTMLElement, index = 0): Editor {
  const instance = editorInstance(editor);
  const positions: number[] = [];
  instance.state.doc.descendants((node, position) => {
    if (node.type.name === "image") positions.push(position);
  });
  const position = positions[index];
  if (position === undefined) throw new Error("Expected a managed image node.");
  instance.commands.setNodeSelection(position);
  return instance;
}

function pasteFiles(editor: HTMLElement, files: readonly File[], html = "") {
  fireEvent.paste(editor, {
    clipboardData: {
      files,
      getData: (type: string) => (type === "text/html" ? html : ""),
    },
  });
}

function stringifyConsoleCall(call: readonly unknown[]) {
  return call
    .map((value) =>
      value instanceof Error
        ? `${value.name}: ${value.message}`
        : String(value),
    )
    .join(" ");
}

function isDocumentedJsdomNoise(call: readonly unknown[]) {
  const [value] = call;
  return (
    value instanceof Error &&
    value.message ===
      "Not implemented: Window's getComputedStyle() method: with pseudo-elements"
  );
}

describe("AdminRichTextEditor", () => {
  let consoleError: MockInstance;
  let consoleWarn: MockInstance;
  let createObjectUrl: MockInstance;
  let revokeObjectUrl: MockInstance;
  let nextObjectUrl: number;

  beforeEach(() => {
    nextObjectUrl = 1;
    consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementation(() => `blob:preview-${nextObjectUrl++}`);
    revokeObjectUrl = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
  });

  afterEach(async () => {
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 5));

    const unexpectedErrors = consoleError.mock.calls
      .filter((call) => !isDocumentedJsdomNoise(call))
      .map(stringifyConsoleCall);
    const unexpectedWarnings = consoleWarn.mock.calls
      .filter((call) => !isDocumentedJsdomNoise(call))
      .map(stringifyConsoleCall);

    vi.restoreAllMocks();

    expect(unexpectedErrors).toEqual([]);
    expect(unexpectedWarnings).toEqual([]);
  });

  it("emits one exact canonical onCreate pair in StrictMode and no onChange", async () => {
    const props = createEditorProps({ document: savedDocument });
    renderEditor(props);

    await readyEditor(props);

    expect(props.onCreate).toHaveBeenCalledTimes(1);
    expect(props.onCreate).toHaveBeenCalledWith({
      document: {
        type: "doc",
        content: [
          {
            attrs: { textAlign: null },
            content: [{ type: "text", text: "저장된 본문" }],
            type: "paragraph",
          },
        ],
      },
      html: "<p>저장된 본문</p>",
    });
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onContentError).not.toHaveBeenCalled();
  });

  it("normalizes bare hostnames and rejects links outside the exact allowlist", () => {
    const encodePercentLayers = (value: string, layers: number) => {
      let encoded = value;
      for (let layer = 0; layer < layers; layer += 1) {
        encoded = encoded.replaceAll("%", "%25");
      }
      return encoded;
    };
    const deeplyEncodedNewline = encodePercentLayers("%0a", 6);
    const deeplyEncodedHiddenUnicode = encodePercentLayers("%e2%80%8b", 6);

    expect(normalizeEditorLinkHref(null)).toBeNull();
    expect(normalizeEditorLinkHref("   ")).toBeNull();
    expect(normalizeEditorLinkHref(" example.com/docs?q=1 ")).toBeNull();
    expect(normalizeEditorLinkHref("example.com/docs?q=1")).toBe(
      "https://example.com/docs?q=1",
    );
    expect(normalizeEditorLinkHref("mailto:hello@example.com")).toBe(
      "mailto:hello@example.com",
    );
    expect(normalizeEditorLinkHref("tel:+821012345678")).toBe(
      "tel:+821012345678",
    );

    for (const href of [
      "javascript:alert(1)",
      "data:text/html,unsafe",
      "ftp://example.com/file",
      "sms:+821012345678",
      "cid:part@example.com",
      "xmpp:user@example.com",
      " https://example.com",
      "https://example.com ",
      "https:example.com",
      "http:/example.com",
      "https:\\example.com",
      "https://example.com/%0aunsafe",
      "https://example.com/%20unsafe",
      "https://example.com/%c2%a0unsafe",
      "https://example.com/%e2%80%8bunsafe",
      "https://example.com/%250aunsafe",
      `https://example.com/${deeplyEncodedNewline}unsafe`,
      `https://example.com/${deeplyEncodedHiddenUnicode}unsafe`,
      "https://example.com/malformed%",
      "java\nscript:alert(1)",
      "https://exa mple.com",
      "\u200bjavascript:alert(1)",
    ]) {
      expect(isAllowedEditorLinkHref(href)).toBe(false);
      expect(normalizeEditorLinkHref(href)).toBeNull();
    }

    for (const href of [
      "http://example.com/path",
      "https://example.com/path",
      "https://example.com/100%25",
      "https://example.com/%EC%95%88%EC%A0%84",
      "https://example.com/a%2Fb?value=%ED%95%9C%EA%B8%80%25",
      "mailto:hello@example.com",
      "tel:+821012345678",
    ]) {
      expect(isAllowedEditorLinkHref(href)).toBe(true);
      expect(normalizeEditorLinkHref(href)).not.toBeNull();
    }
    expect(isAllowedEditorLinkHref("example.com/path")).toBe(false);
  });

  it("fails closed for invalid initial content without emitting a replacement", async () => {
    const props = createEditorProps({
      document: {
        type: "doc",
        content: [{ type: "newer-schema-node" }],
      },
      documentKey: "future-row-v2",
    });
    renderEditor(props);

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    await waitFor(() => {
      expect(props.onContentError).toHaveBeenCalledTimes(1);
      expect(editor.getAttribute("contenteditable")).toBe("false");
      expect(editor.getAttribute("aria-invalid")).toBe("true");
      expect(editor.getAttribute("aria-readonly")).toBe("true");
    });
    expect(props.onCreate).not.toHaveBeenCalled();
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it.each([
    [
      "H1 headings",
      {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "unsafe heading" }],
          },
        ],
      },
    ],
    [
      "unsupported text alignment",
      {
        type: "doc",
        content: [{ type: "paragraph", attrs: { textAlign: "justify" } }],
      },
    ],
    [
      "data image URLs",
      {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { alt: "data", src: "data:image/png;base64,AA==" },
          },
        ],
      },
    ],
    [
      "blob image URLs",
      {
        type: "doc",
        content: [
          { type: "image", attrs: { alt: "blob", src: "blob:stale-preview" } },
        ],
      },
    ],
    [
      "remote HTTP image URLs",
      {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              alt: "http",
              src: "http://storage.example.com/content/blog/scope/images/http.png",
            },
          },
        ],
      },
    ],
    [
      "external-scope image URLs",
      {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              alt: "other scope",
              src: "https://storage.example.com/content/blog/other/images/external.png",
            },
          },
        ],
      },
    ],
    [
      "transient image IDs",
      {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              alt: "pending",
              src: "https://storage.example.com/content/blog/scope/images/pending.png",
              uploadId: "stale-upload",
            },
          },
        ],
      },
    ],
    [
      "invalid private image attribute types",
      {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              alt: "private",
              altReviewed: "true",
              decorative: false,
              src: "https://storage.example.com/content/blog/scope/images/private.png",
            },
          },
        ],
      },
    ],
    [
      "unsafe links",
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "unsafe link",
                marks: [
                  { type: "link", attrs: { href: "javascript:alert(1)" } },
                ],
              },
            ],
          },
        ],
      },
    ],
  ] satisfies readonly (readonly [string, TiptapDocument])[])(
    "fails closed for semantic %s without repairing JSON",
    async (_, document) => {
      const props = createEditorProps({
        document,
        documentKey: `semantic-invalid-${_}`,
      });
      renderEditor(props);

      const editor = await screen.findByRole("textbox", {
        name: "본문 WYSIWYG 편집기",
      });
      await waitFor(() => {
        expect(props.onContentError).toHaveBeenCalledTimes(1);
        expect(editor.getAttribute("contenteditable")).toBe("false");
        expect(editor.getAttribute("aria-invalid")).toBe("true");
      });
      expect(props.onCreate).not.toHaveBeenCalled();
      expect(props.onChange).not.toHaveBeenCalled();
    },
  );

  it("keeps the cursor stable across same-key controlled rerenders", async () => {
    const cursorDocument: TiptapDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "AC" }],
        },
      ],
    };
    const props = createEditorProps({
      document: cursorDocument,
      documentKey: "saved-row-v1",
    });
    const view = renderEditor(props);
    const editor = await readyEditor(props);
    const instance = editorInstance(editor);
    instance.commands.setTextSelection(2);

    const rerenderedProps = { ...props, document: { ...cursorDocument } };
    view.rerender(
      <StrictMode>
        <AdminRichTextEditor {...rerenderedProps} />
      </StrictMode>,
    );
    expect(instance.state.selection.from).toBe(2);
    instance.commands.insertContent("B");
    expect(editor.textContent).toBe("ABC");
    expect(props.onChange.mock.lastCall?.[0].html).toBe("<p>ABC</p>");
  });

  it("emits exactly one onCreate value for each new document key", async () => {
    const props = createEditorProps({ documentKey: "first-document" });
    const view = renderEditor(props);
    await readyEditor(props);

    view.rerender(
      <StrictMode>
        <AdminRichTextEditor
          {...props}
          document={savedDocument}
          documentKey="second-document"
        />
      </StrictMode>,
    );

    await waitFor(() => expect(props.onCreate).toHaveBeenCalledTimes(2));
    expect(props.onCreate).toHaveBeenCalledTimes(2);
    expect(props.onCreate.mock.lastCall?.[0].html).toBe("<p>저장된 본문</p>");
  });

  it("inserts every blob placeholder immediately and suppresses canonical changes", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    const file = new File(["image"], "pending.png", { type: "image/png" });

    pasteFiles(editor, [file], '<img src="https://clipboard.example/x.png">');

    expect(editor.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-1",
    );
    expect(props.uploadImage).toHaveBeenCalledWith(file);
    expect(props.onPendingAssetWorkChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ count: 1, generation: "new-record" }),
    );
    expect(
      typeof props.onPendingAssetWorkChange.mock.lastCall?.[0].producerKey,
    ).toBe("symbol");
    expect(props.onChange).not.toHaveBeenCalled();
    expect(editor.getAttribute("contenteditable")).toBe("true");
    expect(editor.querySelectorAll("img")).toHaveLength(1);
  });

  it("preserves typing during an upload in the final canonical pair", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["pending"], "typing.png", { type: "image/png" }),
    ]);

    editorInstance(editor).commands.focus("end");
    await userEvent.setup().type(editor, "업로드 중에도 작성한 문장");
    expect(editor.textContent).toContain("업로드 중에도 작성한 문장");
    expect(props.onChange).not.toHaveBeenCalled();

    pendingUpload.resolve(uploaded("typing"));
    await waitFor(() => expect(props.onChange).toHaveBeenCalledTimes(1));
    const value = props.onChange.mock.lastCall?.[0];
    if (!value) throw new Error("Expected the settled canonical value.");
    expect(value.html).toContain("업로드 중에도 작성한 문장");
    expect(JSON.stringify(value.document)).toContain(
      "업로드 중에도 작성한 문장",
    );
    expect(value.html).not.toMatch(/blob:|uploadId/);
  });

  it("canonicalizes an exact local-loopback HTTP upload through the ownership predicate", async () => {
    const result: UploadedEditorImage = {
      alt: "local",
      path: "content/blog/scope/images/local.png",
      url: "http://127.0.0.1:54321/content/blog/scope/images/local.png",
    };
    const props = createEditorProps({
      isAllowedImageUrl: vi.fn((url) => url === result.url),
      uploadImage: vi.fn(async () => result),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["local"], "local.png", { type: "image/png" }),
    ]);

    await waitFor(() => expect(props.onChange).toHaveBeenCalledTimes(1));
    expect(editor.querySelector("img")?.getAttribute("src")).toBe(result.url);
    expect(props.onUploadError).not.toHaveBeenCalled();
    expect(props.cleanupOrphanedImage).not.toHaveBeenCalled();
    expect(props.onChange.mock.lastCall?.[0].html).toContain(result.url);
  });

  it("ignores unsupported files without starting pending work", async () => {
    const props = createEditorProps();
    renderEditor(props);
    const editor = await readyEditor(props);

    pasteFiles(editor, [
      new File(["unsupported"], "animation.gif", { type: "image/gif" }),
    ]);

    expect(props.uploadImage).not.toHaveBeenCalled();
    expect(props.onPendingAssetWorkChange).not.toHaveBeenCalled();
    expect(editor.querySelector("img")).toBeNull();
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it("revokes already-created previews when object URL creation fails", async () => {
    const failure = new Error("object URL failure");
    createObjectUrl
      .mockImplementationOnce(() => "blob:created-before-failure")
      .mockImplementationOnce(() => {
        throw failure;
      });
    const props = createEditorProps();
    renderEditor(props);
    const editor = await readyEditor(props);

    pasteFiles(editor, [
      new File(["first"], "first.png", { type: "image/png" }),
      new File(["second"], "second.png", { type: "image/png" }),
    ]);

    await waitFor(() =>
      expect(props.onUploadError).toHaveBeenCalledWith(failure),
    );
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:created-before-failure");
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(props.uploadImage).not.toHaveBeenCalled();
    expect(props.onPendingAssetWorkChange).not.toHaveBeenCalled();
    expect(editor.querySelector("img")).toBeNull();
  });

  it("revokes previews and clears asset work when placeholder insertion fails", async () => {
    const failure = new Error("placeholder insertion failure");
    const props = createEditorProps();
    renderEditor(props);
    const editor = await readyEditor(props);
    vi.spyOn(editorInstance(editor).view, "dispatch").mockImplementationOnce(
      () => {
        throw failure;
      },
    );

    pasteFiles(editor, [
      new File(["insert"], "insert.png", { type: "image/png" }),
    ]);

    await waitFor(() => {
      expect(props.onUploadError).toHaveBeenCalledWith(failure);
      expect(props.onPendingAssetWorkChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ count: 0, generation: "new-record" }),
      );
    });
    expect(props.uploadImage).not.toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview-1");
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(editor.querySelector("img")).toBeNull();
  });

  it("uses current upload lifecycle callbacks after a same-key rerender", async () => {
    const firstUpload = vi.fn(async () => uploaded("first-callback"));
    const currentUpload = vi.fn(async () => uploaded("current-callback"));
    const firstCleanup = vi.fn(async () => undefined);
    const currentCleanup = vi.fn(async () => undefined);
    const props = createEditorProps({
      cleanupOrphanedImage: firstCleanup,
      uploadImage: firstUpload,
    });
    const view = renderEditor(props);
    const editor = await readyEditor(props);

    view.rerender(
      <StrictMode>
        <AdminRichTextEditor
          {...props}
          cleanupOrphanedImage={currentCleanup}
          uploadImage={currentUpload}
        />
      </StrictMode>,
    );
    pasteFiles(editor, [
      new File(["current"], "current.png", { type: "image/png" }),
    ]);

    await waitFor(() => expect(currentUpload).toHaveBeenCalledTimes(1));
    expect(firstUpload).not.toHaveBeenCalled();
    expect(firstCleanup).not.toHaveBeenCalled();
    expect(currentCleanup).not.toHaveBeenCalled();
  });

  it("forwards the exact drop position and consumes a selected HTML-file paste", async () => {
    const onFiles = vi.fn();
    const fileHandler = createContentEditorExtensions(onFiles).find(
      (extension) => extension.name === "fileHandler",
    );
    const fakeEditor = {} as Editor;
    const dropped = new File(["drop"], "drop.webp", { type: "image/webp" });
    fileHandler?.options.onDrop?.(fakeEditor, [dropped], 17);
    expect(onFiles).toHaveBeenCalledWith(fakeEditor, [dropped], 17);

    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      document: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "선택 본문" }],
          },
        ],
      },
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    editorInstance(editor).commands.setTextSelection({ from: 1, to: 6 });

    const pasted = new File(["paste"], "paste.png", { type: "image/png" });
    pasteFiles(editor, [pasted], "<p>붙여넣기 HTML</p>");

    expect(editor.textContent).not.toContain("선택 본문");
    expect(editor.textContent).not.toContain("붙여넣기 HTML");
    expect(editor.querySelectorAll("img")).toHaveLength(1);
  });

  it("inserts a dropped placeholder at FileHandler's supplied document position", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      document: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "before" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "after" }],
          },
        ],
      },
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    const instance = editorInstance(editor);
    vi.spyOn(instance.view, "posAtCoords").mockReturnValue({
      inside: -1,
      pos: 8,
    });

    fireEvent.drop(editor, {
      clientX: 10,
      clientY: 10,
      dataTransfer: {
        files: [new File(["drop"], "between.png", { type: "image/png" })],
        getData: () => "",
        types: ["Files"],
      },
    });

    expect(instance.getJSON().content?.map((node) => node.type)).toEqual([
      "paragraph",
      "image",
      "paragraph",
    ]);
    expect(editor.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-1",
    );
  });

  it("preserves multi-file order through out-of-order completion and flushes once", async () => {
    const firstUpload = deferred<UploadedEditorImage>();
    const secondUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn((file: File) =>
        file.name === "first.png" ? firstUpload.promise : secondUpload.promise,
      ),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    const first = new File(["first"], "first.png", { type: "image/png" });
    const second = new File(["second"], "second.webp", {
      type: "image/webp",
    });

    pasteFiles(editor, [first, second]);
    expect(
      Array.from(editor.querySelectorAll("img"), (image) => image.src),
    ).toEqual(["blob:preview-1", "blob:preview-2"]);

    secondUpload.resolve(uploaded("second"));
    await waitFor(() =>
      expect(editor.querySelectorAll("img")[1]?.getAttribute("src")).toBe(
        uploaded("second").url,
      ),
    );
    expect(editor.querySelectorAll("img")[0]?.getAttribute("src")).toBe(
      "blob:preview-1",
    );
    expect(props.onChange).not.toHaveBeenCalled();

    firstUpload.resolve(uploaded("first"));
    await waitFor(() => expect(props.onChange).toHaveBeenCalledTimes(1));
    expect(
      Array.from(editor.querySelectorAll("img"), (image) => image.src),
    ).toEqual([uploaded("first").url, uploaded("second").url]);
    expect(props.onPendingAssetWorkChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ count: 0, generation: "new-record" }),
    );

    const canonical = props.onChange.mock.lastCall?.[0];
    if (!canonical) throw new Error("Expected a canonical editor change.");
    expect(canonical.html).not.toMatch(/blob:|uploadId|decorative|altReviewed/);
    const images = canonical.document.content?.filter(
      (node) => node.type === "image",
    );
    expect(images).toHaveLength(2);
    expect(images?.[0]?.attrs).toEqual(
      expect.objectContaining({
        altReviewed: false,
        decorative: false,
        uploadId: null,
      }),
    );
    expect(createObjectUrl).toHaveBeenCalledTimes(2);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(2);
  });

  it("removes a failed placeholder without duplicate changes or rejections", async () => {
    const failure = new Error("safe upload failure");
    const props = createEditorProps({
      uploadImage: vi.fn(async () => {
        throw failure;
      }),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["failed"], "failed.png", { type: "image/png" }),
    ]);

    await waitFor(() => {
      expect(props.onUploadError).toHaveBeenCalledTimes(1);
      expect(props.onPendingAssetWorkChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ count: 0, generation: "new-record" }),
      );
    });
    expect(props.onUploadError).toHaveBeenCalledWith(failure);
    expect(props.onChange).not.toHaveBeenCalled();
    expect(editor.querySelector("img")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "본문 이미지 업로드에 실패했습니다.",
    );
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });

  it("tombstones a successful upload undone while pending across repeated redo", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    const instance = editorInstance(editor);
    pasteFiles(editor, [
      new File(["success"], "slow-success.png", { type: "image/png" }),
    ]);
    expect(editor.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-1",
    );

    instance.commands.undo();
    expect(editor.querySelector("img")).toBeNull();

    const result = uploaded("slow-success");
    pendingUpload.resolve(result);
    await waitFor(() =>
      expect(props.cleanupOrphanedImage).toHaveBeenCalledWith(
        result,
        "placeholder_deleted",
      ),
    );
    expect(props.cleanupOrphanedImage).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview-1");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      instance.commands.redo();
      await waitFor(() => expect(editor.querySelector("img")).toBeNull());
      expect(JSON.stringify(instance.getJSON())).not.toContain("blob:");
      instance.commands.undo();
      expect(editor.querySelector("img")).toBeNull();
    }
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(props.cleanupOrphanedImage).toHaveBeenCalledTimes(1);

    const changesBeforeTyping = props.onChange.mock.calls.length;
    instance.commands.focus("end");
    await userEvent.setup().type(editor, "후속 성공 변경");
    await waitFor(() =>
      expect(props.onChange.mock.calls.length).toBeGreaterThan(
        changesBeforeTyping,
      ),
    );
    expect(props.onChange.mock.lastCall?.[0].html).toContain("후속 성공 변경");
  });

  it("tombstones a successful upload deleted while pending across undo and redo", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    const instance = editorInstance(editor);
    pasteFiles(editor, [
      new File(["delete"], "slow-delete.png", { type: "image/png" }),
    ]);
    instance.view.dispatch(closeHistory(instance.state.tr));
    selectImage(editor).commands.deleteSelection();
    expect(editor.querySelector("img")).toBeNull();

    const result = uploaded("slow-delete");
    pendingUpload.resolve(result);
    await waitFor(() =>
      expect(props.cleanupOrphanedImage).toHaveBeenCalledWith(
        result,
        "placeholder_deleted",
      ),
    );
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      instance.commands.undo();
      await waitFor(() => expect(editor.querySelector("img")).toBeNull());
      expect(JSON.stringify(instance.getJSON())).not.toContain("blob:");
      instance.commands.redo();
      expect(editor.querySelector("img")).toBeNull();
    }
    expect(props.cleanupOrphanedImage).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);

    const changesBeforeTyping = props.onChange.mock.calls.length;
    instance.commands.focus("end");
    await userEvent.setup().type(editor, "후속 삭제 변경");
    await waitFor(() =>
      expect(props.onChange.mock.calls.length).toBeGreaterThan(
        changesBeforeTyping,
      ),
    );
    expect(props.onChange.mock.lastCall?.[0].html).toContain("후속 삭제 변경");
  });

  it("normalizes a completed successful image restored from insertion history", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    const instance = editorInstance(editor);
    pasteFiles(editor, [
      new File(["restore"], "restore.png", { type: "image/png" }),
    ]);

    const result = uploaded("restore");
    pendingUpload.resolve(result);
    await waitFor(() => expect(props.onChange).toHaveBeenCalledTimes(1));

    for (let attempt = 0; attempt < 2; attempt += 1) {
      instance.commands.undo();
      await waitFor(() => expect(editor.querySelector("img")).toBeNull());
      instance.commands.redo();
      await waitFor(() =>
        expect(editor.querySelector("img")?.getAttribute("src")).toBe(
          result.url,
        ),
      );
      const restoredImage = instance
        .getJSON()
        .content?.find((node) => node.type === "image");
      expect(restoredImage?.attrs?.uploadId).toBeNull();
      expect(JSON.stringify(instance.getJSON())).not.toContain("blob:");
    }
    expect(props.cleanupOrphanedImage).not.toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });

  it("tombstones a failed upload undone while pending across repeated redo", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const failure = new Error("slow failure");
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    const instance = editorInstance(editor);
    pasteFiles(editor, [
      new File(["failure"], "slow-failure.png", { type: "image/png" }),
    ]);
    expect(editor.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-1",
    );

    instance.commands.undo();
    expect(editor.querySelector("img")).toBeNull();

    pendingUpload.reject(failure);
    await waitFor(() => {
      expect(props.onUploadError).toHaveBeenCalledWith(failure);
      expect(props.onPendingAssetWorkChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ count: 0, generation: "new-record" }),
      );
    });
    expect(editor.querySelector("img")).toBeNull();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview-1");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      instance.commands.redo();
      await waitFor(() => expect(editor.querySelector("img")).toBeNull());
      expect(JSON.stringify(instance.getJSON())).not.toContain("blob:");
      instance.commands.undo();
      expect(editor.querySelector("img")).toBeNull();
    }
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(props.cleanupOrphanedImage).not.toHaveBeenCalled();

    const changesBeforeTyping = props.onChange.mock.calls.length;
    instance.commands.focus("end");
    await userEvent.setup().type(editor, "후속 실패 변경");
    await waitFor(() =>
      expect(props.onChange.mock.calls.length).toBeGreaterThan(
        changesBeforeTyping,
      ),
    );
    expect(props.onChange.mock.lastCall?.[0].html).toContain("후속 실패 변경");
  });

  it("rejects and cleans an uploaded image URL outside the document scope", async () => {
    const result: UploadedEditorImage = {
      alt: "wrong scope",
      path: "content/blog/other/images/wrong.png",
      url: "https://storage.example.com/content/blog/other/images/wrong.png",
    };
    const props = createEditorProps({
      uploadImage: vi.fn(async () => result),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["wrong"], "wrong.png", { type: "image/png" }),
    ]);

    await waitFor(() => {
      expect(props.cleanupOrphanedImage).toHaveBeenCalledWith(
        result,
        "placeholder_deleted",
      );
      expect(props.onPendingAssetWorkChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ count: 0, generation: "new-record" }),
      );
    });
    expect(props.onUploadError).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
    expect(editor.querySelector("img")).toBeNull();
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });

  it("cleans a successful upload when its placeholder was deleted", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["delete"], "delete.png", { type: "image/png" }),
    ]);
    const image = editor.querySelector("img");
    if (!image) throw new Error("Expected an upload placeholder.");
    const instance = selectImage(editor);
    instance.commands.deleteSelection();
    expect(editor.querySelector("img")).toBeNull();

    const result = uploaded("delete");
    pendingUpload.resolve(result);
    await waitFor(() =>
      expect(props.cleanupOrphanedImage).toHaveBeenCalledWith(
        result,
        "placeholder_deleted",
      ),
    );
    expect(props.cleanupOrphanedImage).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it("settles pending state when orphan cleanup fails and reports the error once", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const cleanupFailure = new Error("safe cleanup failure");
    const props = createEditorProps({
      cleanupOrphanedImage: vi.fn(async () => {
        throw cleanupFailure;
      }),
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["cleanup"], "cleanup.png", { type: "image/png" }),
    ]);
    selectImage(editor).commands.deleteSelection();

    pendingUpload.resolve(uploaded("cleanup"));
    await waitFor(() => {
      expect(props.onUploadError).toHaveBeenCalledWith(cleanupFailure);
      expect(props.onPendingAssetWorkChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ count: 0, generation: "new-record" }),
      );
    });
    expect(props.cleanupOrphanedImage).toHaveBeenCalledTimes(1);
    expect(props.onUploadError).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it("keeps a tombstoned A removed while B remains pending", async () => {
    const firstUpload = deferred<UploadedEditorImage>();
    const secondUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn((file: File) =>
        file.name === "a.png" ? firstUpload.promise : secondUpload.promise,
      ),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ]);
    const instance = editorInstance(editor);
    instance.view.dispatch(closeHistory(instance.state.tr));
    selectImage(editor).commands.deleteSelection();

    const firstResult = uploaded("a");
    firstUpload.resolve(firstResult);
    await waitFor(() =>
      expect(props.cleanupOrphanedImage).toHaveBeenCalledWith(
        firstResult,
        "placeholder_deleted",
      ),
    );
    expect(editor.querySelectorAll("img")).toHaveLength(1);
    expect(editor.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-2",
    );

    instance.commands.undo();
    await waitFor(() => expect(editor.querySelectorAll("img")).toHaveLength(1));
    expect(editor.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview-2",
    );
    expect(JSON.stringify(instance.getJSON())).not.toContain("blob:preview-1");
    expect(props.cleanupOrphanedImage).toHaveBeenCalledTimes(1);

    secondUpload.resolve(uploaded("b"));
    await waitFor(() => expect(props.onChange).toHaveBeenCalledTimes(1));
    expect(editor.querySelectorAll("img")).toHaveLength(1);
    expect(editor.querySelector("img")?.getAttribute("src")).toBe(
      uploaded("b").url,
    );
    expect(props.cleanupOrphanedImage).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(2);
    expect(props.onChange.mock.lastCall?.[0].html).not.toContain("blob:");
  });

  it("cleans a late upload after a keyed editor replacement without touching it", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    const view = renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["stale"], "stale.png", { type: "image/png" }),
    ]);

    const replacementProps = {
      ...props,
      document: savedDocument,
      documentKey: "other-row-v1",
    };
    view.rerender(
      <StrictMode>
        <AdminRichTextEditor {...replacementProps} />
      </StrictMode>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "본문 WYSIWYG 편집기" })
          .textContent,
      ).toContain("저장된 본문"),
    );

    const result = uploaded("stale");
    pendingUpload.resolve(result);
    await waitFor(() =>
      expect(props.cleanupOrphanedImage).toHaveBeenCalledWith(
        result,
        "editor_replaced",
      ),
    );
    expect(
      screen.getByRole("textbox", { name: "본문 WYSIWYG 편집기" }).textContent,
    ).toContain("저장된 본문");
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview-1");
  });

  it("cleans a late upload after unmount and revokes its object URL once", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    const view = renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["unmount"], "unmount.png", { type: "image/png" }),
    ]);
    view.unmount();
    await waitFor(() =>
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview-1"),
    );

    const result = uploaded("unmount");
    pendingUpload.resolve(result);
    await waitFor(() =>
      expect(props.cleanupOrphanedImage).toHaveBeenCalledWith(
        result,
        "editor_replaced",
      ),
    );
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });

  it("stores reviewed alt and decorative intent only in JSON private attrs", async () => {
    const props = createEditorProps({
      document: {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              alt: "photo",
              src: "https://storage.example.com/content/blog/scope/images/photo.png",
            },
          },
        ],
      },
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    const image = editor.querySelector("img");
    if (!image) throw new Error("Expected a managed image.");
    const user = userEvent.setup();
    selectImage(editor);
    const alt = await screen.findByRole("textbox", { name: "대체 텍스트" });
    await user.clear(alt);
    await user.type(alt, "팀 회의 화면");

    await waitFor(() => {
      const value = props.onChange.mock.lastCall?.[0];
      if (!value) throw new Error("Expected an alt-text change.");
      expect(value.document.content?.[0]?.attrs).toEqual(
        expect.objectContaining({
          alt: "팀 회의 화면",
          altReviewed: true,
          decorative: false,
        }),
      );
      expect(value.html).toBe(
        '<img src="https://storage.example.com/content/blog/scope/images/photo.png" alt="팀 회의 화면"><p></p>',
      );
      expect(value.html).not.toMatch(/altReviewed|decorative|uploadId/);
    });

    await user.click(screen.getByRole("checkbox", { name: "장식용 이미지" }));
    await waitFor(() => {
      const value = props.onChange.mock.lastCall?.[0];
      if (!value) throw new Error("Expected a decorative-image change.");
      expect(value.document.content?.[0]?.attrs).toEqual(
        expect.objectContaining({
          alt: "",
          altReviewed: true,
          decorative: true,
        }),
      );
      expect(value.html).toBe(
        '<img src="https://storage.example.com/content/blog/scope/images/photo.png" alt=""><p></p>',
      );
      expect(value.html).not.toMatch(/altReviewed|decorative|uploadId/);
    });
    expect(screen.getByText("장식용 이미지로 검토했습니다.")).toBeTruthy();

    await user.click(screen.getByRole("checkbox", { name: "장식용 이미지" }));
    await waitFor(() => {
      const value = props.onChange.mock.lastCall?.[0];
      if (!value) throw new Error("Expected a nondecorative-image change.");
      expect(value.document.content?.[0]?.attrs).toEqual(
        expect.objectContaining({
          alt: "",
          altReviewed: false,
          decorative: false,
        }),
      );
    });
    expect(
      screen.getByText(
        "파일 이름은 임시 값입니다. 게시 전에 의미 있는 설명을 검토해 주세요.",
      ),
    ).toBeTruthy();
  });

  it("keeps the editor editable while pending and disables only pending image metadata", async () => {
    const pendingUpload = deferred<UploadedEditorImage>();
    const props = createEditorProps({
      uploadImage: vi.fn(() => pendingUpload.promise),
    });
    renderEditor(props);
    const editor = await readyEditor(props);
    pasteFiles(editor, [
      new File(["pending"], "pending.png", { type: "image/png" }),
    ]);
    const image = editor.querySelector("img");
    if (!image) throw new Error("Expected a pending image.");
    selectImage(editor);

    expect(editor.getAttribute("contenteditable")).toBe("true");
    expect(
      (screen.getByRole("textbox", { name: "대체 텍스트" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("checkbox", {
          name: "장식용 이미지",
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
  });

  it("shares the link allowlist between editor commands and the official link popover", async () => {
    const props = createEditorProps({ document: savedDocument });
    renderEditor(props);
    const editor = await readyEditor(props);
    const instance = editorInstance(editor);
    instance.commands.setTextSelection({ from: 1, to: 2 });

    expect(instance.commands.setLink({ href: "javascript:alert(1)" })).toBe(
      false,
    );
    expect(instance.getHTML()).not.toContain("<a");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "링크 설정" }));
    const url = await screen.findByRole("textbox", { name: "링크 URL" });
    await user.type(url, "example.com/docs");
    await user.click(screen.getByRole("button", { name: "링크 적용" }));

    await waitFor(() =>
      expect(editor.querySelector("a")?.getAttribute("href")).toBe(
        "https://example.com/docs",
      ),
    );
  });

  it("subscribes toolbar pressed and command state with no H1 control", async () => {
    const props = createEditorProps({ document: savedDocument });
    renderEditor(props);
    const editor = await readyEditor(props);
    const user = userEvent.setup();
    await user.click(editor);
    const bold = screen.getByRole("button", { name: "굵게" });
    expect(bold.getAttribute("aria-pressed")).toBe("false");
    await user.click(bold);
    await waitFor(() => expect(bold.getAttribute("aria-pressed")).toBe("true"));
    expect(screen.queryByText("제목 1")).toBeNull();
    expect(
      screen.getByLabelText("본문 이미지 파일 선택").getAttribute("accept"),
    ).toBe("image/png,image/jpeg,image/webp");
    expect(
      screen
        .getByRole("toolbar", { name: "본문 서식 도구" })
        .querySelectorAll(".tiptap-separator").length,
    ).toBe(4);
    for (const label of [
      "제목 서식",
      "목록 서식",
      "굵게",
      "기울임",
      "밑줄",
      "취소선",
      "링크 설정",
      "인용문",
      "구분선",
      "왼쪽 정렬",
      "가운데 정렬",
      "오른쪽 정렬",
      "실행 취소",
      "다시 실행",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("follows hard disabled ARIA and contenteditable state dynamically", async () => {
    const props = createEditorProps();
    const view = renderEditor(props);
    const editor = await readyEditor(props);
    expect(editor.getAttribute("aria-disabled")).toBe("false");
    expect(editor.getAttribute("aria-readonly")).toBe("false");

    view.rerender(
      <StrictMode>
        <AdminRichTextEditor {...props} disabled />
      </StrictMode>,
    );
    await waitFor(() => {
      expect(editor.getAttribute("contenteditable")).toBe("false");
      expect(editor.getAttribute("aria-disabled")).toBe("true");
      expect(editor.getAttribute("aria-readonly")).toBe("true");
      expect(editor.getAttribute("aria-invalid")).toBe("false");
    });
    expect(
      (screen.getByRole("button", { name: "굵게" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
