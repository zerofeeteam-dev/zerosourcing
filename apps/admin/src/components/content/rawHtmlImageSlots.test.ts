import { describe, expect, it } from "vitest";
import {
  replaceImagesForPreview,
  replaceImageSlotSource,
} from "./rawHtmlImageSlots";

describe("raw HTML image slots", () => {
  it("replaces a selected existing image and preserves the original source around it", () => {
    const source =
      '<!doctype html>\n<img src="" alt="first">\n<img src="https://example.com/kept.png">\n<img alt="last" />';

    expect(replaceImageSlotSource(source, 1, "https://cdn.example.com/replaced.png")).toBe(
      '<!doctype html>\n<img src="" alt="first">\n<img src="https://cdn.example.com/replaced.png">\n<img alt="last" />',
    );
  });

  it("clears srcset when replacing an existing source", () => {
    const source = '<img src="https://example.com/old.webp" srcset="https://example.com/old@2x.webp 2x">';

    expect(replaceImageSlotSource(source, 0, "https://cdn.example.com/new.webp")).toBe(
      '<img src="https://cdn.example.com/new.webp" srcset="">',
    );
  });

  it("makes missing, empty, and existing images selectable", () => {
    const source = '<img src> <img src=" "> <img src="about:blank"> <img>';

    expect(replaceImagesForPreview(source)).toBe(
      '<button aria-label="이미지 파일 선택" data-admin-image-slot="0" type="button">이미지 선택</button> <button aria-label="이미지 파일 선택" data-admin-image-slot="1" type="button">이미지 선택</button> <img src="about:blank" data-admin-image-slot="2" role="button" tabindex="0" aria-label="이미지 변경"> <button aria-label="이미지 파일 선택" data-admin-image-slot="3" type="button">이미지 선택</button>',
    );
  });

  it("does not treat image-looking text in comments or script blocks as an image slot", () => {
    const source =
      '<!-- <img src=""> --><script>const template = \'<img src="">\';</script><img src="">';

    expect(replaceImagesForPreview(source)).toContain(
      '<script>const template = \'<img src="">\';</script><button aria-label="이미지 파일 선택" data-admin-image-slot="0" type="button">이미지 선택</button>',
    );
  });

  it("does not patch an unfinished image tag", () => {
    expect(replaceImageSlotSource('<p><img src=""', 0, "https://cdn.example.com/image.webp")).toBeNull();
  });
});
