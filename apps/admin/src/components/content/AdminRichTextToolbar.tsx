import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import type { ChangeEvent, ReactNode } from "react";
import {
  AdminAlignCenterIcon,
  AdminAlignLeftIcon,
  AdminAlignRightIcon,
  AdminBoldIcon,
  AdminBulletListIcon,
  AdminHorizontalRuleIcon,
  AdminImageIcon,
  AdminItalicIcon,
  AdminLinkIcon,
  AdminOrderedListIcon,
  AdminQuoteIcon,
  AdminRedoIcon,
  AdminStrikeIcon,
  AdminUnderlineIcon,
  AdminUndoIcon,
} from "../admin/icons";
import { normalizeEditorLinkHref } from "./contentEditorExtensions";
import styles from "./AdminRichTextToolbar.module.css";

type AdminRichTextToolbarProps = {
  readonly disabled: boolean;
  readonly editor: Editor;
  readonly onImage: (file: File) => void;
};

type ToolbarButtonProps = {
  readonly active?: boolean;
  readonly children: ReactNode;
  readonly disabled: boolean;
  readonly label: string;
  readonly onClick: () => void;
  readonly text?: boolean;
};

const unavailableToolbarState = {
  active: {
    alignCenter: false,
    alignLeft: false,
    alignRight: false,
    blockquote: false,
    bold: false,
    bulletList: false,
    h2: false,
    h3: false,
    h4: false,
    italic: false,
    link: false,
    orderedList: false,
    paragraph: false,
    strike: false,
    underline: false,
  },
  can: {
    alignCenter: false,
    alignLeft: false,
    alignRight: false,
    blockquote: false,
    bold: false,
    bulletList: false,
    h2: false,
    h3: false,
    h4: false,
    horizontalRule: false,
    italic: false,
    link: false,
    orderedList: false,
    paragraph: false,
    redo: false,
    strike: false,
    underline: false,
    undo: false,
  },
} as const;

function ToolbarButton({
  active,
  children,
  disabled,
  label,
  onClick,
  text = false,
}: ToolbarButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={text ? styles.textButton : styles.iconButton}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span
      aria-hidden="true"
      className={styles.divider}
      data-toolbar-divider="true"
    />
  );
}

export function AdminRichTextToolbar({
  disabled,
  editor,
  onImage,
}: AdminRichTextToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (currentEditor.isDestroyed) return unavailableToolbarState;
      return {
        active: {
          alignCenter: currentEditor.isActive({ textAlign: "center" }),
          alignLeft: currentEditor.isActive({ textAlign: "left" }),
          alignRight: currentEditor.isActive({ textAlign: "right" }),
          blockquote: currentEditor.isActive("blockquote"),
          bold: currentEditor.isActive("bold"),
          bulletList: currentEditor.isActive("bulletList"),
          h2: currentEditor.isActive("heading", { level: 2 }),
          h3: currentEditor.isActive("heading", { level: 3 }),
          h4: currentEditor.isActive("heading", { level: 4 }),
          italic: currentEditor.isActive("italic"),
          link: currentEditor.isActive("link"),
          orderedList: currentEditor.isActive("orderedList"),
          paragraph: currentEditor.isActive("paragraph"),
          strike: currentEditor.isActive("strike"),
          underline: currentEditor.isActive("underline"),
        },
        can: {
          alignCenter: currentEditor
            .can()
            .chain()
            .focus()
            .setTextAlign("center")
            .run(),
          alignLeft: currentEditor
            .can()
            .chain()
            .focus()
            .setTextAlign("left")
            .run(),
          alignRight: currentEditor
            .can()
            .chain()
            .focus()
            .setTextAlign("right")
            .run(),
          blockquote: currentEditor
            .can()
            .chain()
            .focus()
            .toggleBlockquote()
            .run(),
          bold: currentEditor.can().chain().focus().toggleBold().run(),
          bulletList: currentEditor
            .can()
            .chain()
            .focus()
            .toggleBulletList()
            .run(),
          h2: currentEditor
            .can()
            .chain()
            .focus()
            .toggleHeading({ level: 2 })
            .run(),
          h3: currentEditor
            .can()
            .chain()
            .focus()
            .toggleHeading({ level: 3 })
            .run(),
          h4: currentEditor
            .can()
            .chain()
            .focus()
            .toggleHeading({ level: 4 })
            .run(),
          horizontalRule: currentEditor
            .can()
            .chain()
            .focus()
            .setHorizontalRule()
            .run(),
          italic: currentEditor.can().chain().focus().toggleItalic().run(),
          link: currentEditor
            .can()
            .chain()
            .focus()
            .setLink({ href: "https://example.com" })
            .run(),
          orderedList: currentEditor
            .can()
            .chain()
            .focus()
            .toggleOrderedList()
            .run(),
          paragraph: currentEditor.can().chain().focus().setParagraph().run(),
          redo: currentEditor.can().chain().focus().redo().run(),
          strike: currentEditor.can().chain().focus().toggleStrike().run(),
          underline: currentEditor
            .can()
            .chain()
            .focus()
            .toggleUnderline()
            .run(),
          undo: currentEditor.can().chain().focus().undo().run(),
        },
      };
    },
  });

  const unavailable = (canRun: boolean) => disabled || !canRun;
  const changeImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) onImage(file);
    event.currentTarget.value = "";
  };
  const changeLink = () => {
    if (state.active.link) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const currentHref = String(editor.getAttributes("link").href ?? "");
    const href = window.prompt("링크 URL을 입력해 주세요.", currentHref);
    const normalizedHref = normalizeEditorLinkHref(href);
    if (!normalizedHref) return;
    editor.chain().focus().setLink({ href: normalizedHref }).run();
  };

  return (
    <div aria-label="본문 서식 도구" className={styles.toolbar} role="toolbar">
      <div className={styles.group}>
        <ToolbarButton
          active={state.active.paragraph}
          disabled={unavailable(state.can.paragraph)}
          label="본문 단락"
          onClick={() => editor.chain().focus().setParagraph().run()}
          text
        >
          P
        </ToolbarButton>
        {([2, 3, 4] as const).map((level) => (
          <ToolbarButton
            active={state.active[`h${level}`]}
            disabled={unavailable(state.can[`h${level}`])}
            key={level}
            label={`제목 ${level}`}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            text
          >
            H{level}
          </ToolbarButton>
        ))}
      </div>
      <ToolbarDivider />
      <div className={styles.group}>
        <ToolbarButton
          active={state.active.bold}
          disabled={unavailable(state.can.bold)}
          label="굵게"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <AdminBoldIcon />
        </ToolbarButton>
        <ToolbarButton
          active={state.active.italic}
          disabled={unavailable(state.can.italic)}
          label="기울임"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <AdminItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          active={state.active.underline}
          disabled={unavailable(state.can.underline)}
          label="밑줄"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <AdminUnderlineIcon />
        </ToolbarButton>
        <ToolbarButton
          active={state.active.strike}
          disabled={unavailable(state.can.strike)}
          label="취소선"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <AdminStrikeIcon />
        </ToolbarButton>
        <ToolbarButton
          active={state.active.link}
          disabled={unavailable(state.can.link)}
          label={state.active.link ? "링크 해제" : "링크 설정"}
          onClick={changeLink}
        >
          <AdminLinkIcon />
        </ToolbarButton>
      </div>
      <ToolbarDivider />
      <div className={styles.group}>
        <ToolbarButton
          active={state.active.bulletList}
          disabled={unavailable(state.can.bulletList)}
          label="글머리 기호 목록"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <AdminBulletListIcon />
        </ToolbarButton>
        <ToolbarButton
          active={state.active.orderedList}
          disabled={unavailable(state.can.orderedList)}
          label="번호 목록"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <AdminOrderedListIcon />
        </ToolbarButton>
        <ToolbarButton
          active={state.active.blockquote}
          disabled={unavailable(state.can.blockquote)}
          label="인용문"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <AdminQuoteIcon />
        </ToolbarButton>
        <ToolbarButton
          disabled={unavailable(state.can.horizontalRule)}
          label="구분선"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <AdminHorizontalRuleIcon />
        </ToolbarButton>
      </div>
      <ToolbarDivider />
      <div className={styles.group}>
        <ToolbarButton
          active={state.active.alignLeft}
          disabled={unavailable(state.can.alignLeft)}
          label="왼쪽 정렬"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AdminAlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton
          active={state.active.alignCenter}
          disabled={unavailable(state.can.alignCenter)}
          label="가운데 정렬"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AdminAlignCenterIcon />
        </ToolbarButton>
        <ToolbarButton
          active={state.active.alignRight}
          disabled={unavailable(state.can.alignRight)}
          label="오른쪽 정렬"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AdminAlignRightIcon />
        </ToolbarButton>
      </div>
      <ToolbarDivider />
      <div className={styles.group}>
        <label
          aria-disabled={disabled}
          className={styles.fileButton}
          title="본문 이미지 업로드"
        >
          <AdminImageIcon />
          <input
            accept="image/png,image/jpeg,image/webp"
            aria-label="본문 이미지 업로드"
            className={styles.fileInput}
            disabled={disabled}
            onChange={changeImage}
            type="file"
          />
        </label>
        <ToolbarButton
          disabled={unavailable(state.can.undo)}
          label="실행 취소"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <AdminUndoIcon />
        </ToolbarButton>
        <ToolbarButton
          disabled={unavailable(state.can.redo)}
          label="다시 실행"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <AdminRedoIcon />
        </ToolbarButton>
      </div>
    </div>
  );
}
