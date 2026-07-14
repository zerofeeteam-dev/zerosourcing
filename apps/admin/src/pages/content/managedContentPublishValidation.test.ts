import type { TiptapDocument } from "@repo/content/types";
import { describe, expect, it, vi } from "vitest";
import type { ManagedContentInput } from "../../lib/adminRepositoryTypes";
import type { SupabaseConfig } from "../../lib/supabase";
import {
  firstManagedContentPublishIssue,
  validateManagedContentImagesForPublish,
} from "./managedContentPublishValidation";

const scope = "00000000-0000-4000-8000-000000000123";

function candidate(
  status: "draft" | "published",
  document: TiptapDocument,
): ManagedContentInput & { readonly status: "draft" | "published" } {
  return {
    content: "<p>본문</p>",
    contentAssetBaseEnabled: false,
    contentAssetScope: scope,
    contentAuthoringMode: "wysiwyg",
    contentJson: document,
    contentMode: "html",
    contentSchemaVersion: 1,
    contentSourceBackup: null,
    status,
  };
}

describe("managed content publish validation", () => {
  it("allows unfinished image state in drafts and ignores inactive raw JSON", () => {
    const unfinished = {
      type: "doc",
      content: [
        {
          attrs: { alt: "", src: "blob:pending", uploadId: "upload-1" },
          type: "image",
        },
      ],
    } as const satisfies TiptapDocument;
    const isAllowed = vi.fn(() => false);

    expect(
      firstManagedContentPublishIssue(
        candidate("draft", unfinished),
        isAllowed,
      ),
    ).toBeUndefined();
    expect(isAllowed).not.toHaveBeenCalled();

    const raw: ManagedContentInput & { readonly status: "published" } = {
      ...candidate("published", unfinished),
      contentAuthoringMode: "raw_html",
      contentJson: unfinished,
      contentMode: "html",
      status: "published",
    };
    expect(firstManagedContentPublishIssue(raw, isAllowed)).toBeUndefined();
    expect(isAllowed).not.toHaveBeenCalled();
  });

  it("reports pending, alt-review, alt-text, and ownership failures on publish", () => {
    const pending = candidate("published", {
      type: "doc",
      content: [
        {
          attrs: { alt: "", src: "blob:pending", uploadId: "upload-1" },
          type: "image",
        },
      ],
    });
    expect(firstManagedContentPublishIssue(pending, () => false)).toBe(
      "업로드가 끝나지 않은 본문 이미지가 있습니다.",
    );

    const unreviewed = candidate("published", {
      type: "doc",
      content: [
        {
          attrs: { alt: "설명", src: "https://example.com/image.webp" },
          type: "image",
        },
      ],
    });
    expect(firstManagedContentPublishIssue(unreviewed, () => true)).toBe(
      "본문 이미지의 대체 텍스트 검토가 필요합니다.",
    );

    const missingAlt = candidate("published", {
      type: "doc",
      content: [
        {
          attrs: {
            alt: "",
            altReviewed: true,
            decorative: false,
            src: "https://example.com/image.webp",
          },
          type: "image",
        },
      ],
    });
    expect(firstManagedContentPublishIssue(missingAlt, () => true)).toBe(
      "본문 이미지에 대체 텍스트를 입력해 주세요.",
    );

    const external = candidate("published", {
      type: "doc",
      content: [
        {
          attrs: {
            alt: "설명",
            altReviewed: true,
            decorative: false,
            src: "https://example.com/image.webp",
          },
          type: "image",
        },
      ],
    });
    expect(firstManagedContentPublishIssue(external, () => false)).toBe(
      "현재 글의 asset scope에 속하지 않은 이미지가 있습니다.",
    );
  });

  it("checks the exact candidate entity and scope against Storage ownership", () => {
    const config = {
      client: {},
      kind: "enabled",
      url: "http://127.0.0.1:54321",
    } as SupabaseConfig;
    const ownedUrl =
      `http://127.0.0.1:54321/storage/v1/object/public/zerosourcing/` +
      `content/blog/${scope}/images/00000000-0000-4000-8000-000000000456.webp`;
    const input = candidate("published", {
      type: "doc",
      content: [
        {
          attrs: {
            alt: "설명",
            altReviewed: true,
            decorative: false,
            src: ownedUrl,
          },
          type: "image",
        },
      ],
    });

    expect(
      validateManagedContentImagesForPublish(config, "blog", input),
    ).toBeUndefined();
    expect(
      validateManagedContentImagesForPublish(config, "portfolio", input),
    ).toBe("현재 글의 asset scope에 속하지 않은 이미지가 있습니다.");
  });
});
