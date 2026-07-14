// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyBlogFormState } from "./blogModel";
import { BlogFormFields } from "./BlogFormFields";

vi.mock("../../components/content/AdminContentEditor", () => ({
  AdminContentEditor: (props: {
    readonly documentKey: string;
    readonly entity: string;
  }) => (
    <div
      data-document-key={props.documentKey}
      data-entity={props.entity}
      data-testid="managed-content-editor"
    />
  ),
}));

describe("BlogFormFields", () => {
  afterEach(cleanup);

  it("announces the card summary error before the shared content editor", () => {
    render(
      <BlogFormFields
        documentKey="blog:new:test"
        fieldErrors={{
          content: "본문 이미지를 확인해 주세요.",
          summary: "게시하려면 카드 요약을 입력해 주세요.",
        }}
        form={createEmptyBlogFormState()}
        isDisabled={false}
        onContentBusyChange={vi.fn()}
        onContentChange={vi.fn()}
        onFieldChange={vi.fn()}
        onPendingAssetCountChange={vi.fn()}
        onThumbnailChange={vi.fn()}
        onThumbnailRemove={vi.fn()}
        thumbnail={{ removed: false }}
      />,
    );

    const summary = screen.getByRole("textbox", { name: "카드 요약" });
    expect(summary.getAttribute("aria-invalid")).toBe("true");
    expect(summary.getAttribute("aria-describedby")).toBe("blog-summary-error");
    expect(document.getElementById("blog-summary-error")?.textContent).toBe(
      "게시하려면 카드 요약을 입력해 주세요.",
    );
    const editor = screen.getByTestId("managed-content-editor");
    expect(editor.getAttribute("data-document-key")).toBe("blog:new:test");
    expect(editor.getAttribute("data-entity")).toBe("blog");
    expect(
      summary.compareDocumentPosition(editor) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(screen.getByRole("alert").textContent).toBe(
      "본문 이미지를 확인해 주세요.",
    );
  });
});
