import { SelectHTMLAttributes } from "react";
import styles from "./index.module.scss";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  requiredMark?: boolean;
  options: SelectOption[];
  wrapperClassName?: string;
}

function SelectField({
  label,
  requiredMark = false,
  options,
  wrapperClassName,
  ...selectProps
}: SelectFieldProps) {
  return (
    <label className={`${styles.field} ${wrapperClassName ?? ""}`.trim()}>
      {label && (
        <span>
          {label}
          {requiredMark && <em className={styles.required}>*</em>}
        </span>
      )}
      <select {...selectProps}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SelectField;
