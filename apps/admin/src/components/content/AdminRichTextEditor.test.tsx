// @vitest-environment jsdom
import type { TiptapDocument } from "@repo/content/types";
import type { Editor } from "@tiptap/core";
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
  type MockInstance,
  vi,
} from "vitest";
import { AdminRichTextEditor } from "./AdminRichTextEditor";
import { createContentEditorExtensions } from "./contentEditorExtensions";

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

function stringifyConsoleCall(call: readonly unknown[]) {
  return call
    .map((value) =>
      value instanceof Error ? `${value.name}: ${value.message}` : String(value),
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

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
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

    consoleError.mockRestore();
    consoleWarn.mockRestore();

    expect(unexpectedErrors).toEqual([]);
    expect(unexpectedWarnings).toEqual([]);
  });

  it("mounts in StrictMode and emits Tiptap JSON plus HTML", async () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={emptyDocument}
          documentKey="new"
          onChange={onChange}
          onContentError={vi.fn()}
          onUploadError={vi.fn()}
          uploadImage={vi.fn()}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    await userEvent.click(editor);
    await userEvent.keyboard("테스트 본문");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.lastCall?.[0].html).toContain("테스트 본문");
    expect(onChange.mock.lastCall?.[0].document.type).toBe("doc");
  });

  it("loads a keyed document without emitting an update and follows disabled state", async () => {
    const onChange = vi.fn();
    const onContentError = vi.fn();
    const onUploadError = vi.fn();
    const uploadImage = vi.fn();
    const view = render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={emptyDocument}
          documentKey="new"
          onChange={onChange}
          onContentError={onContentError}
          onUploadError={onUploadError}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    const initialEditor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    expect(initialEditor.getAttribute("aria-disabled")).toBe("false");
    expect(initialEditor.getAttribute("aria-readonly")).toBe("false");
    expect(initialEditor.getAttribute("aria-invalid")).toBe("false");

    view.rerender(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={savedDocument}
          documentKey="saved-row-v1"
          onChange={onChange}
          onContentError={onContentError}
          onUploadError={onUploadError}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", {
          name: "본문 WYSIWYG 편집기",
        }).textContent,
      ).toContain("저장된 본문");
    });
    expect(onChange).not.toHaveBeenCalled();

    view.rerender(
      <StrictMode>
        <AdminRichTextEditor
          disabled
          document={savedDocument}
          documentKey="saved-row-v1"
          onChange={onChange}
          onContentError={onContentError}
          onUploadError={onUploadError}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    await waitFor(() => {
      const disabledEditor = screen.getByRole("textbox", {
        name: "본문 WYSIWYG 편집기",
      });
      expect(disabledEditor.getAttribute("contenteditable")).toBe("false");
      expect(disabledEditor.getAttribute("aria-disabled")).toBe("true");
      expect(disabledEditor.getAttribute("aria-readonly")).toBe("true");
      expect(disabledEditor.getAttribute("aria-invalid")).toBe("false");
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the cursor stable during controlled rerenders with the same document key", async () => {
    const onChange = vi.fn();
    const cursorDocument: TiptapDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "AC" }],
        },
      ],
    };
    const onContentError = vi.fn();
    const onUploadError = vi.fn();
    const uploadImage = vi.fn();
    const view = render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={cursorDocument}
          documentKey="saved-row-v1"
          onChange={onChange}
          onContentError={onContentError}
          onUploadError={onUploadError}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    const user = userEvent.setup();
    await user.click(editor);

    const textNode = editor.querySelector("p")?.firstChild;
    if (!(textNode instanceof Text)) {
      throw new Error("Expected the editor paragraph to contain a text node.");
    }

    const range = document.createRange();
    range.setStart(textNode, 1);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange", { bubbles: true }));

    view.rerender(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={{ ...cursorDocument }}
          documentKey="saved-row-v1"
          onChange={onChange}
          onContentError={onContentError}
          onUploadError={onUploadError}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    expect(selection?.anchorNode).toBe(textNode);
    expect(selection?.anchorOffset).toBe(1);

    await user.keyboard("B");

    expect(onChange.mock.lastCall?.[0].html).toBe("<p>ABC</p>");
    expect(editor.textContent).toBe("ABC");
  });

  it("uses current upload callbacks after a same-key rerender", async () => {
    const firstUpload = vi.fn(async () => ({
      alt: "first",
      url: "https://example.com/first.png",
    }));
    const firstUploadError = vi.fn();
    const currentUploadError = vi.fn();
    const uploadFailure = new Error("upload failed");
    const currentUpload = vi.fn(async () => {
      throw uploadFailure;
    });
    const view = render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={emptyDocument}
          documentKey="saved-row-v1"
          onChange={vi.fn()}
          onContentError={vi.fn()}
          onUploadError={firstUploadError}
          uploadImage={firstUpload}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });

    view.rerender(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={emptyDocument}
          documentKey="saved-row-v1"
          onChange={vi.fn()}
          onContentError={vi.fn()}
          onUploadError={currentUploadError}
          uploadImage={currentUpload}
        />
      </StrictMode>,
    );

    const file = new File(["image"], "fresh.png", { type: "image/png" });
    fireEvent.paste(editor, {
      clipboardData: {
        files: [file],
        getData: () => "",
      },
    });

    await waitFor(() => {
      expect(currentUpload).toHaveBeenCalledWith(file);
      expect(currentUploadError).toHaveBeenCalledWith(uploadFailure);
    });
    expect(firstUpload).not.toHaveBeenCalled();
    expect(firstUploadError).not.toHaveBeenCalled();
  });

  it("consumes an HTML image paste and inserts exactly one managed image", async () => {
    const onChange = vi.fn();
    const uploadImage = vi.fn(async () => ({
      alt: "managed image",
      url: "https://example.com/managed.png",
    }));
    render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={emptyDocument}
          documentKey="new"
          onChange={onChange}
          onContentError={vi.fn()}
          onUploadError={vi.fn()}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    const file = new File(["image"], "managed.png", { type: "image/png" });
    fireEvent.paste(editor, {
      clipboardData: {
        files: [file],
        getData: (type: string) =>
          type === "text/html"
            ? '<img alt="clipboard image" src="https://example.com/clipboard.png">'
            : "",
      },
    });

    await waitFor(() => {
      expect(editor.querySelectorAll("img")).toHaveLength(1);
    });
    expect(editor.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/managed.png",
    );
    expect(onChange.mock.lastCall?.[0].html).not.toContain("clipboard.png");
    expect(uploadImage).toHaveBeenCalledTimes(1);
  });

  it("inserts multiple pasted images in file order with one document update", async () => {
    const onChange = vi.fn();
    const uploadImage = vi.fn(async (file: File) => ({
      alt: file.name,
      url: `https://example.com/${file.name}`,
    }));
    render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={emptyDocument}
          documentKey="new"
          onChange={onChange}
          onContentError={vi.fn()}
          onUploadError={vi.fn()}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    const first = new File(["first"], "first.png", { type: "image/png" });
    const second = new File(["second"], "second.webp", {
      type: "image/webp",
    });
    fireEvent.paste(editor, {
      clipboardData: {
        files: [first, second],
        getData: () => "",
      },
    });

    await waitFor(() => {
      expect(editor.querySelectorAll("img")).toHaveLength(2);
    });
    expect(
      Array.from(editor.querySelectorAll("img"), (image) =>
        image.getAttribute("src"),
      ),
    ).toEqual([
      "https://example.com/first.png",
      "https://example.com/second.webp",
    ]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("uploads and inserts a dropped image", async () => {
    const onChange = vi.fn();
    const onUploadError = vi.fn();
    const uploadImage = vi.fn(async () => ({
      alt: "dropped image",
      url: "https://example.com/dropped.jpg",
    }));
    render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={emptyDocument}
          documentKey="new"
          onChange={onChange}
          onContentError={vi.fn()}
          onUploadError={onUploadError}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    const file = new File(["image"], "dropped.jpg", {
      type: "image/jpeg",
    });
    fireEvent.drop(editor, {
      clientX: 0,
      clientY: 0,
      dataTransfer: { files: [file], getData: () => "", types: ["Files"] },
    });

    await waitFor(() => {
      expect(editor.querySelector("img")?.getAttribute("src")).toBe(
        "https://example.com/dropped.jpg",
      );
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onUploadError).not.toHaveBeenCalled();
  });

  it("reports a dropped image upload error without changing the document", async () => {
    const onChange = vi.fn();
    const onUploadError = vi.fn();
    const uploadFailure = new Error("drop upload failed");
    const uploadImage = vi.fn(async () => {
      throw uploadFailure;
    });
    render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={emptyDocument}
          documentKey="new"
          onChange={onChange}
          onContentError={vi.fn()}
          onUploadError={onUploadError}
          uploadImage={uploadImage}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    const file = new File(["image"], "failed.png", { type: "image/png" });
    fireEvent.drop(editor, {
      clientX: 0,
      clientY: 0,
      dataTransfer: { files: [file], getData: () => "", types: ["Files"] },
    });

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith(uploadFailure);
    });
    expect(editor.querySelector("img")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports a failed ordered image insertion", async () => {
    const onUploadError = vi.fn();
    const uploadImage = vi.fn(async (file: File) => ({
      alt: file.name,
      url: `https://example.com/${file.name}`,
    }));
    const insertContentAt = vi.fn(() => false);
    const editor = { commands: { insertContentAt } } as unknown as Editor;
    const fileHandler = createContentEditorExtensions(
      uploadImage,
      onUploadError,
    ).find((extension) => extension.name === "fileHandler");

    if (!fileHandler?.options.onDrop) {
      throw new Error("Expected the file handler drop callback.");
    }

    const first = new File(["first"], "first.png", { type: "image/png" });
    const second = new File(["second"], "second.png", { type: "image/png" });
    fileHandler.options.onDrop(editor, [first, second], 4);

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalled();
    });
    expect(onUploadError.mock.lastCall?.[0]).toBeInstanceOf(Error);
    expect(insertContentAt).toHaveBeenCalledTimes(1);
    expect(insertContentAt).toHaveBeenCalledWith(4, [
      {
        attrs: { alt: "first.png", src: "https://example.com/first.png" },
        type: "image",
      },
      {
        attrs: { alt: "second.png", src: "https://example.com/second.png" },
        type: "image",
      },
    ]);
  });

  it("makes invalid schema content read-only without emitting a replacement", async () => {
    const onChange = vi.fn();
    const onContentError = vi.fn();
    const invalidDocument: TiptapDocument = {
      type: "doc",
      content: [{ type: "newer-schema-node" }],
    };

    render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={invalidDocument}
          documentKey="future-row-v2"
          onChange={onChange}
          onContentError={onContentError}
          onUploadError={vi.fn()}
          uploadImage={vi.fn()}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });

    await waitFor(() => {
      expect(onContentError).toHaveBeenCalled();
      expect(editor.getAttribute("contenteditable")).toBe("false");
      expect(editor.getAttribute("aria-disabled")).toBe("false");
      expect(editor.getAttribute("aria-readonly")).toBe("true");
      expect(editor.getAttribute("aria-invalid")).toBe("true");
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
