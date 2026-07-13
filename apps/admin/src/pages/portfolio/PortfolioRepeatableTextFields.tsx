import { AdminCheckIcon } from "../../components/admin";
import styles from "../PortfolioAdminPage.module.css";

type PortfolioRepeatableTextFieldsProps = {
  readonly disabled: boolean;
  readonly idPrefix: string;
  readonly items: readonly string[];
  readonly label: string;
  readonly onChange: (items: readonly string[]) => void;
};

export function PortfolioRepeatableTextFields({
  disabled,
  idPrefix,
  items,
  label,
  onChange,
}: PortfolioRepeatableTextFieldsProps) {
  const updateItem = (index: number, value: string) => {
    onChange(
      items.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  return (
    <div className={styles.portfolioField}>
      <label className={styles.portfolioLabel} htmlFor={`${idPrefix}-0`}>
        {label}
      </label>
      <div className={styles.repeatableList}>
        {items.map((item, index) => (
          <div
            className={styles.repeatableRow}
            key={`${idPrefix}-${index.toString()}`}
          >
            <div aria-hidden="true" className={styles.repeatableAddButton}>
              <span className={styles.repeatableCheck}>
                <AdminCheckIcon size={24} />
              </span>
              <span>항목 추가</span>
            </div>
            <input
              className={styles.inlineInput}
              disabled={disabled}
              id={`${idPrefix}-${index.toString()}`}
              onChange={(event) => updateItem(index, event.currentTarget.value)}
              placeholder={`${label}${label.endsWith("위") ? "를" : "을"} 입력해주세요.`}
              value={item}
            />
          </div>
        ))}
        <div className={styles.repeatableRow}>
          <button
            aria-label={`${label} 입력 항목 추가`}
            className={styles.repeatableAddButtonIdle}
            disabled={disabled}
            onClick={() => onChange([...items, ""])}
            type="button"
          >
            <span className={styles.repeatableCheckDisabled}>
              <AdminCheckIcon size={24} />
            </span>
            <span>항목 추가</span>
          </button>
          <input
            aria-hidden="true"
            className={styles.inlineInputDisabled}
            disabled
            placeholder={`${label}${label.endsWith("위") ? "를" : "을"} 입력해주세요.`}
          />
        </div>
      </div>
    </div>
  );
}
