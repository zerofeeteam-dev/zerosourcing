import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import styles from "./AdminChoiceDialog.module.css";

export type AdminChoice = {
  readonly description?: string;
  readonly id: string;
  readonly label: string;
  readonly tone?: "default" | "danger";
};

export type AdminChoiceRequest = {
  readonly cancelLabel?: string;
  readonly choices: readonly AdminChoice[];
  readonly description: string;
  readonly onSelect: (choiceId: string) => void;
  readonly title: string;
};

export type AdminChoiceDialogProps = {
  readonly cancelLabel?: string;
  readonly choices: readonly AdminChoice[];
  readonly description: string;
  readonly onCancel: () => void;
  readonly onSelect: (choiceId: string) => void;
  readonly open: boolean;
  readonly title: string;
};

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
}

export function AdminChoiceDialog({
  cancelLabel = "취소",
  choices,
  description,
  onCancel,
  onSelect,
  open,
  title,
}: AdminChoiceDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    firstChoiceRef.current?.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = focusableElements(dialogRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={styles.backdrop}>
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        onKeyDown={onKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <p className={styles.description} id={descriptionId}>
            {description}
          </p>
        </div>
        <div className={styles.choices}>
          {choices.map((choice, index) => (
            <button
              className={styles.choice}
              data-tone={choice.tone === "danger" ? "danger" : undefined}
              key={choice.id}
              onClick={() => onSelect(choice.id)}
              ref={index === 0 ? firstChoiceRef : undefined}
              type="button"
            >
              <span className={styles.choiceLabel}>{choice.label}</span>
              {choice.description ? (
                <span className={styles.choiceDescription}>
                  {choice.description}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <span aria-hidden="true" className={styles.divider} />
        <button className={styles.cancel} onClick={onCancel} type="button">
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
