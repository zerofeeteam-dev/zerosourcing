import styles from "./AdminForm.module.css";

export type AdminEditorMode = "html" | "text";

type AdminEditorModeSegmentedControlProps = {
  readonly description?: string;
  readonly disabled?: boolean;
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly onChange: (mode: AdminEditorMode) => void;
  readonly value: AdminEditorMode;
};

const editorModeOptions = [
  { label: "HTML 작성", value: "html" },
  { label: "TEXT Editer 작성", value: "text" },
] as const satisfies readonly { readonly label: string; readonly value: AdminEditorMode }[];

function descriptionId(id: string): string {
  return `${id}-description`;
}

export function AdminEditorModeSegmentedControl({
  description,
  disabled,
  id,
  label,
  name,
  onChange,
  value,
}: AdminEditorModeSegmentedControlProps) {
  return (
    <fieldset className={styles.segmentedField}>
      <legend className={styles.legend}>{label}</legend>
      {description ? (
        <p className={styles.description} id={descriptionId(id)}>
          {description}
        </p>
      ) : null}
      <div aria-describedby={description ? descriptionId(id) : undefined} className={styles.segmentGroup}>
        {editorModeOptions.map((option) => (
          <label className={styles.segmentOption} key={option.value}>
            <input
              checked={option.value === value}
              className={styles.segmentInput}
              disabled={disabled}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span className={styles.segmentText}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
