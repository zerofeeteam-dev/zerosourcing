export const contentAuthoringModes = ["raw_html", "wysiwyg"] as const;
export type ContentAuthoringMode = (typeof contentAuthoringModes)[number];

export const contentOutputModes = ["html", "text"] as const;
export type ContentOutputMode = (typeof contentOutputModes)[number];

export const SUPPORTED_CONTENT_SCHEMA_VERSION = 1 as const;

export type TiptapNode = {
  readonly attrs?: Readonly<Record<string, unknown>>;
  readonly content?: readonly TiptapNode[];
  readonly marks?: readonly Readonly<Record<string, unknown>>[];
  readonly text?: string;
  readonly type: string;
};

export type TiptapDocument = TiptapNode & {
  readonly type: "doc";
};
