import {
  SUPPORTED_CONTENT_SCHEMA_VERSION,
  type ContentAuthoringMode,
  type ContentOutputMode,
  type TiptapDocument,
  type TiptapNode,
} from "@repo/content/types";
import {
  ContentAssetScopeError,
  parseContentAssetScope,
} from "@repo/content/asset-url";
import type {
  ManagedContentInput,
  ManagedContentRow,
} from "./adminRepositoryTypes";

const emptyParagraph = Object.freeze({ type: "paragraph" } as const);
const emptyDocumentContent = Object.freeze([emptyParagraph]);

/**
 * Shared empty document for every managed-content form. Keep this immutable so
 * one editor cannot accidentally mutate the initial value of another record.
 */
export const EMPTY_TIPTAP_DOCUMENT = Object.freeze({
  content: emptyDocumentContent,
  type: "doc",
}) satisfies TiptapDocument;

export const managedContentSchemaErrorMessage =
  "이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다.";

export class ManagedContentSchemaError extends Error {
  override readonly name = "ManagedContentSchemaError";

  constructor() {
    super(managedContentSchemaErrorMessage);
  }
}

export type ManagedContentFormValue = {
  readonly content: string;
  readonly contentAssetBaseEnabled: boolean;
  readonly contentAssetScope: string;
  readonly contentAuthoringMode: ContentAuthoringMode;
  readonly contentJson: TiptapDocument | null;
  readonly contentMode: ContentOutputMode;
  readonly contentSchemaVersion: typeof SUPPORTED_CONTENT_SCHEMA_VERSION;
  readonly contentSourceBackup: string | null;
};

function isTiptapDocument(value: unknown): value is TiptapDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "type" in value &&
    value.type === "doc"
  );
}

function canonicalContentAssetScope(value: unknown): string | null {
  try {
    return parseContentAssetScope(value);
  } catch (error) {
    if (error instanceof ContentAssetScopeError) return null;
    throw error;
  }
}

function rowHasSupportedManagedContent(row: ManagedContentRow): boolean {
  if (row.content_schema_version !== SUPPORTED_CONTENT_SCHEMA_VERSION) {
    return false;
  }

  if (row.content_mode !== "html" && row.content_mode !== "text") return false;
  if (
    row.content_authoring_mode !== "raw_html" &&
    row.content_authoring_mode !== "wysiwyg"
  ) {
    return false;
  }

  const document = row.content_json;
  if (document !== null && !isTiptapDocument(document)) return false;

  if (row.content_authoring_mode === "wysiwyg") {
    return row.content_mode === "html" && document !== null;
  }

  return true;
}

export function managedContentFormFromRow(
  row: ManagedContentRow,
): ManagedContentFormValue {
  const contentAssetScope = canonicalContentAssetScope(row.content_asset_scope);
  if (!rowHasSupportedManagedContent(row) || contentAssetScope === null) {
    throw new ManagedContentSchemaError();
  }

  return {
    content: row.content,
    contentAssetBaseEnabled: row.content_asset_base_enabled,
    contentAssetScope,
    contentAuthoringMode: row.content_authoring_mode,
    contentJson: row.content_json,
    contentMode: row.content_mode,
    contentSchemaVersion: SUPPORTED_CONTENT_SCHEMA_VERSION,
    contentSourceBackup: row.content_source_backup,
  };
}

export function managedContentInputFromForm(
  form: ManagedContentFormValue,
): ManagedContentInput | null {
  if (form.contentSchemaVersion !== SUPPORTED_CONTENT_SCHEMA_VERSION) {
    return null;
  }

  const document = form.contentJson;
  if (document !== null && !isTiptapDocument(document)) return null;
  const contentAssetScope = canonicalContentAssetScope(form.contentAssetScope);
  if (contentAssetScope === null) return null;

  const base = {
    content: form.content,
    contentAssetBaseEnabled: form.contentAssetBaseEnabled,
    contentAssetScope,
    contentSchemaVersion: SUPPORTED_CONTENT_SCHEMA_VERSION,
    contentSourceBackup: form.contentSourceBackup,
  } as const;

  if (form.contentAuthoringMode === "raw_html") {
    return {
      ...base,
      contentAuthoringMode: "raw_html",
      contentJson: document,
      contentMode: form.contentMode,
    };
  }

  if (
    form.contentAuthoringMode !== "wysiwyg" ||
    form.contentMode !== "html" ||
    document === null
  ) {
    return null;
  }

  return {
    ...base,
    contentAuthoringMode: "wysiwyg",
    contentJson: document,
    contentMode: "html",
  };
}

function documentHasVisibleContent(node: TiptapNode): boolean {
  if (node.type === "image" || node.type === "horizontalRule") return true;
  if (typeof node.text === "string" && node.text.trim().length > 0) return true;
  return node.content?.some(documentHasVisibleContent) ?? false;
}

function nodeHasImage(node: TiptapNode): boolean {
  return node.type === "image" || (node.content?.some(nodeHasImage) ?? false);
}

export function tiptapDocumentHasImage(
  document: TiptapDocument | null,
): boolean {
  return document !== null && nodeHasImage(document);
}

export function rotateRawAssetScope(
  current: ManagedContentFormValue,
  input: {
    readonly discardInactiveWysiwygImages: boolean;
    readonly nextAssetScope: string;
  },
): ManagedContentFormValue | null {
  if (current.contentAuthoringMode !== "raw_html") return null;
  const nextAssetScope = canonicalContentAssetScope(input.nextAssetScope);
  if (nextAssetScope === null) return null;

  const hasInactiveImages = tiptapDocumentHasImage(current.contentJson);
  if (hasInactiveImages && !input.discardInactiveWysiwygImages) return null;
  return {
    ...current,
    contentAssetScope: nextAssetScope,
    contentJson: hasInactiveImages
      ? EMPTY_TIPTAP_DOCUMENT
      : current.contentJson,
  };
}

export function managedContentIsEmpty(form: {
  readonly content: string;
  readonly contentAuthoringMode: ContentAuthoringMode;
  readonly contentJson: TiptapDocument | null;
  readonly contentMode: ContentOutputMode;
}): boolean {
  if (form.contentMode === "text" || form.contentAuthoringMode === "raw_html") {
    return form.content.trim().length === 0;
  }

  return !form.contentJson || !documentHasVisibleContent(form.contentJson);
}

export type RawToWysiwygStrategy =
  | "restore_previous"
  | "new_from_current_backup";

export type WysiwygToRawSource = "backup" | "generated";

export function switchRawToWysiwyg(
  current: ManagedContentFormValue,
  strategy: RawToWysiwygStrategy,
): ManagedContentFormValue {
  const currentRawSource = current.content;
  return {
    ...current,
    content: "",
    contentAuthoringMode: "wysiwyg",
    contentJson:
      strategy === "restore_previous"
        ? (current.contentJson ?? EMPTY_TIPTAP_DOCUMENT)
        : EMPTY_TIPTAP_DOCUMENT,
    contentMode: "html",
    contentSourceBackup:
      strategy === "restore_previous"
        ? (current.contentSourceBackup ?? currentRawSource)
        : currentRawSource,
  };
}

export function switchWysiwygToRaw(
  current: ManagedContentFormValue,
  source: WysiwygToRawSource,
): ManagedContentFormValue {
  return {
    ...current,
    content:
      source === "backup"
        ? (current.contentSourceBackup ?? current.content)
        : current.content,
    contentAuthoringMode: "raw_html",
    contentJson: current.contentJson,
    contentMode: "html",
  };
}

export function escapeLegacyText(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

export function legacyTextToRawHtml(value: string): string {
  return `<p>${escapeLegacyText(value).replace(/\r\n|\r|\n/gu, "<br>")}</p>`;
}

export function legacyTextToTiptapDocument(value: string): TiptapDocument {
  const content: TiptapNode[] = [];
  const parts = value.split(/(\r\n|\r|\n)/gu);
  for (const part of parts) {
    if (part === "\r\n" || part === "\r" || part === "\n") {
      content.push({ type: "hardBreak" });
    } else if (part.length > 0) {
      content.push({ text: part, type: "text" });
    }
  }

  return {
    content: [
      content.length > 0
        ? { content, type: "paragraph" }
        : { type: "paragraph" },
    ],
    type: "doc",
  };
}

export function convertLegacyTextToRaw(
  current: ManagedContentFormValue,
): ManagedContentFormValue {
  const escapedSource = legacyTextToRawHtml(current.content);
  return {
    ...current,
    content: escapedSource,
    contentAuthoringMode: "raw_html",
    contentMode: "html",
    contentSourceBackup: current.contentSourceBackup ?? escapedSource,
  };
}

export function convertLegacyTextToWysiwyg(
  current: ManagedContentFormValue,
): ManagedContentFormValue {
  const escapedSource = legacyTextToRawHtml(current.content);
  return {
    ...current,
    content: "",
    contentAuthoringMode: "wysiwyg",
    contentJson: legacyTextToTiptapDocument(current.content),
    contentMode: "html",
    contentSourceBackup: current.contentSourceBackup ?? escapedSource,
  };
}

export const managedContentImageIssueCodes = [
  "pending_upload",
  "alt_review_required",
  "nondecorative_alt_required",
  "decorative_alt_must_be_empty",
  "invalid_image_url",
] as const;

export type ManagedContentImageIssueCode =
  (typeof managedContentImageIssueCodes)[number];

export type ManagedContentImageIssue = {
  readonly code: ManagedContentImageIssueCode;
  readonly imageIndex: number;
  readonly message: string;
};

function imageIssueMessage(code: ManagedContentImageIssueCode): string {
  switch (code) {
    case "pending_upload":
      return "업로드가 끝나지 않은 본문 이미지가 있습니다.";
    case "alt_review_required":
      return "본문 이미지의 대체 텍스트 검토가 필요합니다.";
    case "nondecorative_alt_required":
      return "본문 이미지에 대체 텍스트를 입력해 주세요.";
    case "decorative_alt_must_be_empty":
      return "장식용 이미지는 대체 텍스트를 비워야 합니다.";
    case "invalid_image_url":
      return "현재 글의 asset scope에 속하지 않은 이미지가 있습니다.";
  }
}

function isOwnedImageUrl(
  value: unknown,
  isAllowedImageUrl: (url: string) => boolean,
): value is string {
  if (typeof value !== "string") return false;
  try {
    return isAllowedImageUrl(value) === true;
  } catch {
    return false;
  }
}

/**
 * Returns publish-only image issues. Draft saves deliberately do not call this
 * helper, which lets authors keep unfinished alt reviews without losing work.
 */
export function managedContentImagePublishIssues(
  document: TiptapDocument | null,
  isAllowedImageUrl: (url: string) => boolean,
): readonly ManagedContentImageIssue[] {
  if (!document) return [];

  const issues: ManagedContentImageIssue[] = [];
  let imageIndex = 0;
  const visit = (node: TiptapNode) => {
    if (node.type === "image") {
      const currentImageIndex = imageIndex;
      imageIndex += 1;
      const attrs = node.attrs ?? {};
      const source = attrs.src;
      const uploadId = attrs.uploadId;
      const alt = typeof attrs.alt === "string" ? attrs.alt : "";
      const decorative = attrs.decorative === true;
      const addIssue = (code: ManagedContentImageIssueCode) => {
        issues.push({
          code,
          imageIndex: currentImageIndex,
          message: imageIssueMessage(code),
        });
      };

      if (
        (uploadId !== undefined && uploadId !== null) ||
        (typeof source === "string" && source.startsWith("blob:"))
      ) {
        addIssue("pending_upload");
      }
      if (attrs.altReviewed !== true) addIssue("alt_review_required");
      if (decorative) {
        if (alt !== "") addIssue("decorative_alt_must_be_empty");
      } else if (alt.trim().length === 0) {
        addIssue("nondecorative_alt_required");
      }
      if (!isOwnedImageUrl(source, isAllowedImageUrl)) {
        addIssue("invalid_image_url");
      }
    }

    for (const child of node.content ?? []) visit(child);
  };

  visit(document);
  return issues;
}
