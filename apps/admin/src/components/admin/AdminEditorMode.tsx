import type { ContentAuthoringMode } from "@repo/content/types";
import styles from "./AdminForm.module.css";

type AdminEditorModeSegmentedControlProps = {
  readonly description?: string;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly onChange: (mode: ContentAuthoringMode) => void;
  readonly value: ContentAuthoringMode;
};

const editorModeOptions = [
  { label: "HTML 원문", value: "raw_html" },
  { label: "WYSIWYG 에디터", value: "wysiwyg" },
] as const satisfies readonly {
  readonly label: string;
  readonly value: ContentAuthoringMode;
}[];

function descriptionId(id: string): string {
  return `${id}-description`;
}

export function AdminEditorModeSegmentedControl({
  description,
  disabled,
  fullWidth = false,
  id,
  label,
  name,
  onChange,
  value,
}: AdminEditorModeSegmentedControlProps) {
  return (
    <fieldset
      className={`${styles.segmentedField} ${fullWidth ? styles.segmentedFieldFull : ""}`}
    >
      <legend
        className={fullWidth ? styles.labelLarge : styles.legend}
      >
        {label}
      </legend>
      {description ? (
        <p className={styles.description} id={descriptionId(id)}>
          {description}
        </p>
      ) : null}
      <div
        aria-describedby={description ? descriptionId(id) : undefined}
        className={`${styles.segmentGroup} ${fullWidth ? styles.segmentGroupFull : ""}`}
      >
        {editorModeOptions.map((option) => (
          <label
            className={`${styles.segmentOption} ${fullWidth ? styles.segmentOptionFull : ""}`}
            key={option.value}
          >
            <input
              checked={option.value === value}
              className={styles.segmentInput}
              disabled={disabled}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span
              className={`${styles.segmentText} ${fullWidth ? styles.segmentTextFull : ""}`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
