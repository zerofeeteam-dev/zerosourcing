import { Extension, mergeAttributes, type Editor } from "@tiptap/core";
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";

export const managedImageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

const managedImageMimeTypeSet = new Set<string>(managedImageMimeTypes);

const allowedEditorLinkProtocols = new Set([
  "http:",
  "https:",
  "mailto:",
  "tel:",
]);
const bareHostnamePattern =
  /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#].*)?$/i;
const hiddenUriCodePoints = new Set([0x200b, 0x200c, 0x200d, 0x2060, 0xfeff]);
const maxEncodedUriDecodeDepth = 4;
const percentEscapePattern = /%[\da-f]{2}/i;
const malformedPercentPattern = /%(?![\da-f]{2})/i;

function hasUnsafeUriCharacters(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (
      /\s/u.test(character) ||
      codePoint === undefined ||
      codePoint <= 0x1f ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      hiddenUriCodePoints.has(codePoint)
    ) {
      return true;
    }
  }
  return false;
}

function hasEncodedUnsafeUriCharacters(value: string): boolean {
  let decoded = value;
  for (
    let depth = 0;
    depth < maxEncodedUriDecodeDepth && decoded.includes("%");
    depth += 1
  ) {
    if (!percentEscapePattern.test(decoded)) return depth === 0;
    if (malformedPercentPattern.test(decoded)) return true;
    try {
      const next = decodeURIComponent(decoded);
      if (hasUnsafeUriCharacters(next)) return true;
      if (next === decoded) return false;
      decoded = next;
    } catch {
      return true;
    }
  }
  // Ordinary encoded path/query text settles within the bound. If another
  // escape layer remains, reject instead of guessing whether it hides control
  // or formatting characters. A decoded literal "%" has no escape and passes.
  return percentEscapePattern.test(decoded);
}

function parseEditorLinkHref(
  href: string,
  allowBareHostname: boolean,
): string | null {
  if (
    href.length === 0 ||
    href.includes("\\") ||
    hasUnsafeUriCharacters(href) ||
    hasEncodedUnsafeUriCharacters(href)
  ) {
    return null;
  }

  const candidate = bareHostnamePattern.test(href)
    ? allowBareHostname
      ? `https://${href}`
      : null
    : href;
  if (candidate === null) return null;

  const lowerCandidate = candidate.toLowerCase();
  if (
    !lowerCandidate.startsWith("http://") &&
    !lowerCandidate.startsWith("https://") &&
    !lowerCandidate.startsWith("mailto:") &&
    !lowerCandidate.startsWith("tel:")
  ) {
    return null;
  }

  try {
    const url = new URL(candidate);
    if (!allowedEditorLinkProtocols.has(url.protocol.toLowerCase())) {
      return null;
    }
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.hostname.length > 0 ? url.toString() : null;
    }
    if (
      lowerCandidate.startsWith(`${url.protocol}//`) ||
      url.pathname.length === 0
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export type EditorImageInsertionPosition =
  | number
  | {
      readonly from: number;
      readonly to: number;
    };

export type HandleEditorImageFiles = (
  editor: Editor,
  files: readonly File[],
  position: EditorImageInsertionPosition,
) => void;

export type UploadedEditorImage = {
  readonly alt: string;
  readonly path: string;
  readonly url: string;
};

export type UploadEditorImage = (
  file: File,
) => Promise<UploadedEditorImage>;

export type OrphanedEditorImageReason =
  | "placeholder_deleted"
  | "editor_replaced";

export type CleanupOrphanedEditorImage = (
  image: UploadedEditorImage,
  reason: OrphanedEditorImageReason,
) => Promise<void>;

export function isAllowedEditorLinkHref(href: unknown): href is string {
  return typeof href === "string" && parseEditorLinkHref(href, false) !== null;
}

export function normalizeEditorLinkHref(
  input: string | null,
): string | null {
  if (input === null) return null;
  return parseEditorLinkHref(input, true);
}

export const ManagedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      altReviewed: {
        default: false,
        rendered: false,
      },
      decorative: {
        default: false,
        rendered: false,
      },
      uploadId: {
        default: null,
        rendered: false,
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        alt: node.attrs.decorative ? "" : (node.attrs.alt ?? ""),
      }),
    ];
  },
});

export function isManagedEditorImageFile(file: File): boolean {
  return managedImageMimeTypeSet.has(file.type);
}

function acceptedImageFiles(files: FileList | readonly File[]): File[] {
  return Array.from(files).filter((file) =>
    isManagedEditorImageFile(file),
  );
}

function createManagedImagePasteExtension(
  onImageFiles: HandleEditorImageFiles,
) {
  return Extension.create({
    name: "managedImagePaste",
    priority: 1_000,

    addProseMirrorPlugins() {
      const editor = this.editor;

      return [
        new Plugin({
          key: new PluginKey("managedImagePaste"),
          props: {
            handlePaste: (_view, event) => {
              const files = acceptedImageFiles(
                event.clipboardData?.files ?? [],
              );
              if (files.length === 0) return false;

              const { from, to } = editor.state.selection;
              event.preventDefault();
              event.stopPropagation();
              onImageFiles(editor, files, { from, to });
              return true;
            },
          },
        }),
      ];
    },
  });
}

export function createContentEditorExtensions(
  onImageFiles: HandleEditorImageFiles,
) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: {
        defaultProtocol: "https",
        isAllowedUri: (href) => isAllowedEditorLinkHref(href),
        openOnClick: false,
        protocols: ["http", "https", "mailto", "tel"],
      },
    }),
    ManagedImage.configure({ allowBase64: false, inline: false }),
    Placeholder.configure({ placeholder: "본문을 작성해 주세요." }),
    TextAlign.configure({
      alignments: ["left", "center", "right"],
      types: ["heading", "paragraph"],
    }),
    createManagedImagePasteExtension(onImageFiles),
    FileHandler.configure({
      allowedMimeTypes: [...managedImageMimeTypes],
      onDrop: (editor, files, position) => {
        onImageFiles(editor, files, position);
      },
    }),
  ];
}
