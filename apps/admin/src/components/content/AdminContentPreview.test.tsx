// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_PREVIEW_HEIGHT_MESSAGE_TYPE,
  ADMIN_PREVIEW_IMAGE_SELECT_MESSAGE_TYPE,
  AdminContentPreview,
  buildPreviewSource,
} from "./AdminContentPreview";

function previewFrame(container: HTMLElement): HTMLIFrameElement {
  const frame = container.querySelector<HTMLIFrameElement>(
    'iframe[title="본문 미리보기"]',
  );
  if (!frame) throw new Error("Expected the preview frame.");
  return frame;
}

function sendFrameMessage(
  frame: HTMLIFrameElement,
  data: Readonly<Record<string, unknown>>,
): void {
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data,
        source: frame.contentWindow,
      }),
    );
  });
}

describe("AdminContentPreview", () => {
  it("makes empty and existing images selectable in the preview", () => {
    const source = buildPreviewSource({
      disabled: false,
      html: '<img src=""><img src="https://example.com/kept.webp">',
      interactiveImages: true,
      uploadingSlot: null,
    });

    expect(source).toContain('data-admin-image-slot="0"');
    expect(source).toContain(
      'src="https://example.com/kept.webp" data-admin-image-slot="1"',
    );
    expect(source).toContain(
      'role="button" tabindex="0" aria-label="이미지 변경"',
    );
    expect(source).toContain("overflow-y: visible !important");
  });

  it("preserves document markup, styles, scripts, embeds, and buttons in the isolated preview", () => {
    const source = buildPreviewSource({
      disabled: false,
      html: '<link rel="stylesheet" href="https://cdn.example/style.css"><script>document.body.dataset.ready = "true"</script><iframe src="https://embed.example"></iframe><button type="button">계속</button>',
      interactiveImages: true,
      uploadingSlot: null,
    });

    expect(source).toContain("https://cdn.example/style.css");
    expect(source).toContain('document.body.dataset.ready = "true"');
    expect(source).toContain("https://embed.example");
    expect(source).toContain("계속</button>");
    expect(source).toContain(ADMIN_PREVIEW_HEIGHT_MESSAGE_TYPE);
    expect(source).not.toContain("script-src 'none'");
  });

  it("runs content in a script-enabled opaque-origin sandbox", () => {
    render(
      <AdminContentPreview
        disabled={false}
        html="<p>preview</p>"
        interactiveImages={false}
        onSelectImage={vi.fn()}
        uploadingSlot={null}
      />,
    );

    const frame = screen.getByTitle("본문 미리보기");
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.getAttribute("scrolling")).toBe("no");
    expect(frame.parentElement?.className).toContain("frameViewport");
  });

  it("grows the iframe to the full rendered document height while the viewport stays scrollable", () => {
    const { container } = render(
      <AdminContentPreview
        disabled={false}
        html="<p>preview</p>"
        interactiveImages={false}
        onSelectImage={vi.fn()}
        uploadingSlot={null}
      />,
    );
    const frame = previewFrame(container);

    sendFrameMessage(frame, {
      height: 2600,
      type: ADMIN_PREVIEW_HEIGHT_MESSAGE_TYPE,
    });

    expect(frame.style.height).toBe("2600px");
    expect(frame.parentElement?.className).toContain("frameViewport");
  });

  it("forwards only trusted preview image-slot messages to the upload handler", () => {
    const onSelectImage = vi.fn();
    const { container } = render(
      <AdminContentPreview
        disabled={false}
        html='<img src="">'
        interactiveImages
        onSelectImage={onSelectImage}
        uploadingSlot={null}
      />,
    );
    const frame = previewFrame(container);

    sendFrameMessage(frame, {
      slotIndex: 0,
      type: ADMIN_PREVIEW_IMAGE_SELECT_MESSAGE_TYPE,
    });
    sendFrameMessage(frame, {
      slotIndex: -1,
      type: ADMIN_PREVIEW_IMAGE_SELECT_MESSAGE_TYPE,
    });

    expect(onSelectImage).toHaveBeenCalledTimes(1);
    expect(onSelectImage).toHaveBeenCalledWith(0);
  });
});
