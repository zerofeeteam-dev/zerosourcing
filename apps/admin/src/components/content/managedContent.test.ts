import { describe, expect, it } from "vitest";
import type { ManagedContentRow } from "../../lib/adminRepositoryTypes";
import {
  convertLegacyTextToRaw,
  convertLegacyTextToWysiwyg,
  EMPTY_TIPTAP_DOCUMENT,
  escapeLegacyText,
  legacyTextToRawHtml,
  legacyTextToTiptapDocument,
  managedContentFormFromRow,
  managedContentImagePublishIssues,
  managedContentInputFromForm,
  ManagedContentSchemaError,
  rotateRawAssetScope,
  switchRawToWysiwyg,
  switchWysiwygToRaw,
  tiptapDocumentHasImage,
  type ManagedContentFormValue,
} from "../../lib/managedContent";

const lowercaseScope = "00000000-0000-4000-8000-0000000000ab";
const uppercaseScope = "00000000-0000-4000-8000-0000000000AB";

function row(overrides: Partial<ManagedContentRow> = {}): ManagedContentRow {
  return {
    content: "<!doctype html>\n<p>원문</p>\n",
    content_asset_base_enabled: true,
    content_asset_scope: uppercaseScope,
    content_authoring_mode: "raw_html",
    content_json: {
      content: [
        {
          content: [{ text: "편집본", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    },
    content_mode: "html",
    content_schema_version: 1,
    content_source_backup: "<p>최초 원문</p>",
    published_at: null,
    ...overrides,
  };
}

function rawValue(
  overrides: Partial<ManagedContentFormValue> = {},
): ManagedContentFormValue {
  return {
    content: "A",
    contentAssetBaseEnabled: false,
    contentAssetScope: lowercaseScope,
    contentAuthoringMode: "raw_html",
    contentJson: {
      content: [
        {
          content: [{ text: "B", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    },
    contentMode: "html",
    contentSchemaVersion: 1,
    contentSourceBackup: null,
    ...overrides,
  };
}

describe("managed content boundary", () => {
  it("shares a deeply immutable empty Tiptap document", () => {
    expect(Object.isFrozen(EMPTY_TIPTAP_DOCUMENT)).toBe(true);
    expect(Object.isFrozen(EMPTY_TIPTAP_DOCUMENT.content)).toBe(true);
    expect(Object.isFrozen(EMPTY_TIPTAP_DOCUMENT.content?.[0])).toBe(true);
  });

  it("canonicalizes scope on row to form to input round trip", () => {
    const form = managedContentFormFromRow(row());
    expect(form.contentAssetScope).toBe(lowercaseScope);
    expect(managedContentInputFromForm(form)).toEqual({
      content: "<!doctype html>\n<p>원문</p>\n",
      contentAssetBaseEnabled: true,
      contentAssetScope: lowercaseScope,
      contentAuthoringMode: "raw_html",
      contentJson: row().content_json,
      contentMode: "html",
      contentSchemaVersion: 1,
      contentSourceBackup: "<p>최초 원문</p>",
    });
  });

  it("fails closed for invalid row and form scopes", () => {
    expect(() =>
      managedContentFormFromRow(row({ content_asset_scope: "scope" })),
    ).toThrow(ManagedContentSchemaError);
    expect(
      managedContentInputFromForm(rawValue({ contentAssetScope: "scope" })),
    ).toBeNull();
  });
});

describe("managed content mode transitions", () => {
  it("restores the previous WYSIWYG document and preserves the first raw backup", () => {
    const restored = switchRawToWysiwyg(rawValue(), "restore_previous");
    expect(restored.content).toBe("");
    expect(restored.contentJson).toEqual(rawValue().contentJson);
    expect(restored.contentSourceBackup).toBe("A");

    const rawAgain = switchWysiwygToRaw(
      { ...restored, content: "<p>B</p>" },
      "backup",
    );
    expect(rawAgain.content).toBe("A");
    expect(rawAgain.contentJson).toEqual(rawValue().contentJson);
    expect(rawAgain.contentSourceBackup).toBe("A");

    const wysAgain = switchRawToWysiwyg(rawAgain, "restore_previous");
    expect(wysAgain.contentJson).toEqual(rawValue().contentJson);
    expect(wysAgain.contentSourceBackup).toBe("A");
  });

  it("uses generated HTML without replacing the retained raw backup", () => {
    const wys = switchRawToWysiwyg(rawValue(), "restore_previous");
    const generated = switchWysiwygToRaw(
      { ...wys, content: "<p>B</p>" },
      "generated",
    );
    expect(generated.content).toBe("<p>B</p>");
    expect(generated.contentSourceBackup).toBe("A");
  });

  it("starts a genuinely empty document and replaces the inactive backup when named", () => {
    const converted = switchRawToWysiwyg(
      rawValue({ content: "새 A", contentSourceBackup: "옛 A" }),
      "new_from_current_backup",
    );
    expect(converted.contentJson).toBe(EMPTY_TIPTAP_DOCUMENT);
    expect(converted.contentSourceBackup).toBe("새 A");
  });

  it("requires explicit inactive-image discard when rotating a raw asset scope", () => {
    const withImage = rawValue({
      contentJson: {
        content: [
          {
            content: [
              {
                attrs: { src: "https://storage.example.com/old.png" },
                type: "image",
              },
            ],
            type: "blockquote",
          },
        ],
        type: "doc",
      },
    });
    expect(tiptapDocumentHasImage(withImage.contentJson)).toBe(true);
    expect(
      rotateRawAssetScope(withImage, {
        discardInactiveWysiwygImages: false,
        nextAssetScope: "00000000-0000-4000-8000-0000000000cd",
      }),
    ).toBeNull();

    const rotated = rotateRawAssetScope(withImage, {
      discardInactiveWysiwygImages: true,
      nextAssetScope: "00000000-0000-4000-8000-0000000000CD",
    });
    expect(rotated?.contentAssetScope).toBe(
      "00000000-0000-4000-8000-0000000000cd",
    );
    expect(rotated?.contentJson).toBe(EMPTY_TIPTAP_DOCUMENT);
    expect(
      rotated && switchRawToWysiwyg(rotated, "restore_previous").contentJson,
    ).toBe(EMPTY_TIPTAP_DOCUMENT);
  });

  it("preserves an inactive image-free WYSIWYG draft during scope rotation", () => {
    const current = rawValue();
    const rotated = rotateRawAssetScope(current, {
      discardInactiveWysiwygImages: false,
      nextAssetScope: "00000000-0000-4000-8000-0000000000cd",
    });
    expect(rotated?.contentJson).toBe(current.contentJson);
  });
});

describe("legacy text conversion", () => {
  const legacy = "<태그 attr=\"값\"> & '인용'\n둘째 줄";

  it("escapes markup and both quote forms before adding p/br HTML", () => {
    expect(escapeLegacyText(legacy)).toBe(
      "&lt;태그 attr=&quot;값&quot;&gt; &amp; &#39;인용&#39;\n둘째 줄",
    );
    expect(legacyTextToRawHtml(legacy)).toBe(
      "<p>&lt;태그 attr=&quot;값&quot;&gt; &amp; &#39;인용&#39;<br>둘째 줄</p>",
    );
    expect(
      convertLegacyTextToRaw(
        rawValue({ content: legacy, contentMode: "text" }),
      ),
    ).toMatchObject({
      content: legacyTextToRawHtml(legacy),
      contentAuthoringMode: "raw_html",
      contentMode: "html",
      contentSourceBackup: legacyTextToRawHtml(legacy),
    });
  });

  it("uses raw characters and hard breaks in Tiptap without double escaping", () => {
    const document = legacyTextToTiptapDocument(legacy);
    expect(document).toEqual({
      content: [
        {
          content: [
            { text: "<태그 attr=\"값\"> & '인용'", type: "text" },
            { type: "hardBreak" },
            { text: "둘째 줄", type: "text" },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    });
    const converted = convertLegacyTextToWysiwyg(
      rawValue({ content: legacy, contentMode: "text" }),
    );
    expect(JSON.stringify(converted.contentJson)).not.toContain("&lt;");
    expect(converted.contentSourceBackup).toBe(legacyTextToRawHtml(legacy));
  });
});

describe("managed image publish validation", () => {
  const owned = (url: string) =>
    url.startsWith("https://storage.example.com/current/images/");

  it("recursively reports transient, review, alt, decorative and ownership issues", () => {
    const issues = managedContentImagePublishIssues(
      {
        content: [
          {
            content: [
              {
                attrs: {
                  alt: "",
                  altReviewed: false,
                  decorative: false,
                  src: "blob:pending",
                  uploadId: "upload-1",
                },
                type: "image",
              },
              {
                attrs: {
                  alt: "외부",
                  altReviewed: true,
                  decorative: false,
                  src: "https://external.example.com/image.png",
                  uploadId: null,
                },
                type: "image",
              },
            ],
            type: "blockquote",
          },
          {
            attrs: {
              alt: "장식 설명",
              altReviewed: true,
              decorative: true,
              src: "https://storage.example.com/current/images/a.png",
              uploadId: null,
            },
            type: "image",
          },
          {
            attrs: {
              alt: "  ",
              altReviewed: true,
              decorative: false,
              src: "https://storage.example.com/current/images/b.png",
              uploadId: null,
            },
            type: "image",
          },
          {
            attrs: {
              alt: "완료",
              altReviewed: true,
              decorative: false,
              src: "https://storage.example.com/current/images/c.png",
              uploadId: null,
            },
            type: "image",
          },
        ],
        type: "doc",
      },
      owned,
    );

    expect(issues.map(({ code, imageIndex }) => [imageIndex, code])).toEqual([
      [0, "pending_upload"],
      [0, "alt_review_required"],
      [0, "nondecorative_alt_required"],
      [0, "invalid_image_url"],
      [1, "invalid_image_url"],
      [2, "decorative_alt_must_be_empty"],
      [3, "nondecorative_alt_required"],
    ]);
  });

  it("does not block an empty or clean draft document", () => {
    expect(managedContentImagePublishIssues(null, owned)).toEqual([]);
    expect(
      managedContentImagePublishIssues(EMPTY_TIPTAP_DOCUMENT, owned),
    ).toEqual([]);
  });

  it("accepts an exact local-loopback image through the ownership boundary", () => {
    const localUrl =
      "http://127.0.0.1:54321/storage/v1/object/public/zerosourcing/" +
      "content/blog/00000000-0000-4000-8000-000000000001/images/" +
      "00000000-0000-4000-8000-000000000002.png";
    const issues = managedContentImagePublishIssues(
      {
        content: [
          {
            attrs: {
              alt: "로컬 이미지",
              altReviewed: true,
              decorative: false,
              src: localUrl,
              uploadId: null,
            },
            type: "image",
          },
        ],
        type: "doc",
      },
      (url) => url === localUrl,
    );
    expect(issues).toEqual([]);
  });
});
