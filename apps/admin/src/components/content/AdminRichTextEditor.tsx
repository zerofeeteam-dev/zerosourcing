import type { TiptapDocument } from "@repo/content/types";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createContentEditorExtensions,
  type UploadEditorImage,
} from "./contentEditorExtensions";

type AdminRichTextEditorProps = {
  readonly disabled: boolean;
  readonly document: TiptapDocument;
  readonly documentKey: string;
  readonly onChange: (value: {
    readonly document: TiptapDocument;
    readonly html: string;
  }) => void;
  readonly onContentError: (error: unknown) => void;
  readonly onUploadError: (error: unknown) => void;
  readonly uploadImage: UploadEditorImage;
};

const emptyDocument: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function createEditorAttributes(disabled: boolean, hasContentError: boolean) {
  return {
    "aria-disabled": String(disabled),
    "aria-invalid": String(hasContentError),
    "aria-label": "본문 WYSIWYG 편집기",
    "aria-multiline": "true",
    "aria-readonly": String(disabled || hasContentError),
    role: "textbox",
  };
}

export function AdminRichTextEditor({
  disabled,
  document,
  documentKey,
  onChange,
  onContentError,
  onUploadError,
  uploadImage,
}: AdminRichTextEditorProps) {
  const [hasContentError, setHasContentError] = useState(false);
  const incomingDocument = useRef(document);
  incomingDocument.current = document;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadErrorRef = useRef(onUploadError);
  onUploadErrorRef.current = onUploadError;
  const onContentErrorRef = useRef(onContentError);
  onContentErrorRef.current = onContentError;
  const uploadImageRef = useRef(uploadImage);
  uploadImageRef.current = uploadImage;
  const extensions = useMemo(
    () =>
      createContentEditorExtensions(
        (file) => uploadImageRef.current(file),
        (error) => onUploadErrorRef.current(error),
      ),
    // Tiptap extension instances share the editor's document-key lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentKey],
  );
  const editor = useEditor(
    {
      content: emptyDocument,
      editable: !disabled && !hasContentError,
      enableContentCheck: true,
      editorProps: {
        attributes: createEditorAttributes(disabled, hasContentError),
      },
      extensions,
      onUpdate: ({ editor: currentEditor }) => {
        onChangeRef.current({
          document: currentEditor.getJSON() as TiptapDocument,
          html: currentEditor.getHTML(),
        });
      },
      onContentError: ({ error }) => {
        setHasContentError(true);
        onContentErrorRef.current(error);
      },
    },
    [documentKey],
  );

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    try {
      editor.commands.setContent(incomingDocument.current as JSONContent, {
        emitUpdate: false,
      });
      setHasContentError(false);
    } catch (error) {
      setHasContentError(true);
      onContentErrorRef.current(error);
    }
  }, [documentKey, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setOptions({
      editorProps: {
        attributes: createEditorAttributes(disabled, hasContentError),
      },
    });
    editor.setEditable(!disabled && !hasContentError, false);
  }, [disabled, editor, hasContentError]);

  return <EditorContent className="rich-content" editor={editor} />;
}
