import type { AdminSelectOption } from "../../components/admin";
import styles from "../BlogAdminPage.module.css";

type BlogFilterSelectProps = {
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly AdminSelectOption[];
  readonly value: string;
};

export function BlogFilterSelect({ label, onChange, options, value }: BlogFilterSelectProps) {
  return (
    <label className={styles.filterSelect}>
      <span className={styles.filterLabel}>{label}</span>
      <select className={styles.select} onChange={(event) => onChange(event.currentTarget.value)} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
