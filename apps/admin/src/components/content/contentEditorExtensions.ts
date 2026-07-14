import { Extension, type Editor, type JSONContent } from "@tiptap/core";
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";

const managedImageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
const managedImageMimeTypeSet = new Set<string>(managedImageMimeTypes);

export type UploadEditorImage = (file: File) => Promise<{
  readonly alt: string;
  readonly url: string;
}>;

async function insertFiles(
  editor: Editor,
  files: readonly File[],
  uploadImage: UploadEditorImage,
  position: number,
) {
  const uploadedFiles = await Promise.all(files.map(uploadImage));
  const imageNodes: JSONContent[] = uploadedFiles.map((uploaded) => ({
    attrs: { alt: uploaded.alt, src: uploaded.url },
    type: "image",
  }));

  if (!editor.commands.insertContentAt(position, imageNodes)) {
    throw new Error("Failed to insert uploaded images into the editor.");
  }
}

function createManagedImagePasteExtension(
  uploadImage: UploadEditorImage,
  onUploadError: (error: unknown) => void,
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
              const files = Array.from(event.clipboardData?.files ?? []).filter(
                (file) => managedImageMimeTypeSet.has(file.type),
              );
              if (files.length === 0) return false;

              event.preventDefault();
              event.stopPropagation();
              void insertFiles(
                editor,
                files,
                uploadImage,
                editor.state.selection.from,
              ).catch(onUploadError);
              return true;
            },
          },
        }),
      ];
    },
  });
}

export function createContentEditorExtensions(
  uploadImage: UploadEditorImage,
  onUploadError: (error: unknown) => void,
) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: {
        defaultProtocol: "https",
        openOnClick: false,
        protocols: ["http", "https", "mailto", "tel"],
      },
    }),
    Image.configure({ allowBase64: false, inline: false }),
    Placeholder.configure({ placeholder: "본문을 작성해 주세요." }),
    TextAlign.configure({
      alignments: ["left", "center", "right"],
      types: ["heading", "paragraph"],
    }),
    createManagedImagePasteExtension(uploadImage, onUploadError),
    FileHandler.configure({
      allowedMimeTypes: [...managedImageMimeTypes],
      onDrop: (editor, files, position) => {
        void insertFiles(editor, files, uploadImage, position).catch(
          onUploadError,
        );
      },
    }),
  ];
}
