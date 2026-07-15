import type { Editor } from "@tiptap/core";
import { useRef, type ChangeEvent } from "react";
import { ImagePlusIcon } from "../tiptap-icons/image-plus-icon";
import { BlockquoteButton } from "../tiptap-ui/blockquote-button";
import { HeadingDropdownMenu } from "../tiptap-ui/heading-dropdown-menu";
import { LinkPopover } from "../tiptap-ui/link-popover";
import { ListDropdownMenu } from "../tiptap-ui/list-dropdown-menu";
import { MarkButton } from "../tiptap-ui/mark-button";
import { TextAlignButton } from "../tiptap-ui/text-align-button";
import { UndoRedoButton } from "../tiptap-ui/undo-redo-button";
import { Button } from "../tiptap-ui-primitive/button";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "../tiptap-ui-primitive/toolbar";
import { normalizeEditorLinkHref } from "./contentEditorExtensions";
import styles from "./AdminRichTextToolbar.module.css";

type AdminRichTextToolbarProps = {
  readonly disabled: boolean;
  readonly editor: Editor;
  readonly onImage: (file: File) => void;
};

export function AdminRichTextToolbar({
  disabled,
  editor,
  onImage,
}: AdminRichTextToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const changeImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) onImage(file);
    event.currentTarget.value = "";
  };

  return (
    <Toolbar aria-label="본문 서식 도구">
      <ToolbarGroup>
        <UndoRedoButton
          action="undo"
          aria-label="실행 취소"
          disabled={disabled}
          editor={editor}
          tooltip="실행 취소"
        />
        <UndoRedoButton
          action="redo"
          aria-label="다시 실행"
          disabled={disabled}
          editor={editor}
          tooltip="다시 실행"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu
          aria-label="제목 서식"
          disabled={disabled}
          editor={editor}
          levels={[2, 3, 4]}
          modal={false}
          tooltip="제목 서식"
        />
        <ListDropdownMenu
          aria-label="목록 서식"
          disabled={disabled}
          editor={editor}
          modal={false}
          tooltip="목록 서식"
          types={["bulletList", "orderedList"]}
        />
        <BlockquoteButton
          aria-label="인용문"
          disabled={disabled}
          editor={editor}
          tooltip="인용문"
        />
        <Button
          aria-label="구분선"
          disabled={disabled}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          showTooltip={false}
          title="구분선"
          type="button"
        >
          <span aria-hidden="true">—</span>
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton
          aria-label="굵게"
          disabled={disabled}
          editor={editor}
          tooltip="굵게"
          type="bold"
        />
        <MarkButton
          aria-label="기울임"
          disabled={disabled}
          editor={editor}
          tooltip="기울임"
          type="italic"
        />
        <MarkButton
          aria-label="밑줄"
          disabled={disabled}
          editor={editor}
          tooltip="밑줄"
          type="underline"
        />
        <MarkButton
          aria-label="취소선"
          disabled={disabled}
          editor={editor}
          tooltip="취소선"
          type="strike"
        />
        <LinkPopover
          aria-label="링크 설정"
          disabled={disabled}
          editor={editor}
          normalizeUrl={normalizeEditorLinkHref}
          tooltip="링크 설정"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton
          align="left"
          aria-label="왼쪽 정렬"
          disabled={disabled}
          editor={editor}
          tooltip="왼쪽 정렬"
        />
        <TextAlignButton
          align="center"
          aria-label="가운데 정렬"
          disabled={disabled}
          editor={editor}
          tooltip="가운데 정렬"
        />
        <TextAlignButton
          align="right"
          aria-label="오른쪽 정렬"
          disabled={disabled}
          editor={editor}
          tooltip="오른쪽 정렬"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <input
          accept="image/png,image/jpeg,image/webp"
          aria-label="본문 이미지 파일 선택"
          className={styles.imageInput}
          disabled={disabled}
          onChange={changeImage}
          ref={imageInputRef}
          type="file"
        />
        <Button
          aria-label="본문 이미지 업로드"
          disabled={disabled}
          onClick={() => imageInputRef.current?.click()}
          tooltip="본문 이미지 업로드"
          type="button"
        >
          <ImagePlusIcon className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>
    </Toolbar>
  );
}
