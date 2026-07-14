import {
  SUPPORTED_CONTENT_SCHEMA_VERSION,
  type ContentAuthoringMode,
  type ContentOutputMode,
  type TiptapDocument,
  type TiptapNode,
} from "@repo/content/types";
import type { ManagedContentInput, ManagedContentRow } from "./adminRepositoryTypes";

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
  if (!rowHasSupportedManagedContent(row)) {
    throw new ManagedContentSchemaError();
  }

  return {
    content: row.content,
    contentAssetBaseEnabled: row.content_asset_base_enabled,
    contentAssetScope: row.content_asset_scope,
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

  const base = {
    content: form.content,
    contentAssetBaseEnabled: form.contentAssetBaseEnabled,
    contentAssetScope: form.contentAssetScope,
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
