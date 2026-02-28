import { InputHTMLAttributes } from "react";
import styles from "./index.module.scss";

interface DateTimePickerProps {
  label?: string;
  requiredMark?: boolean;
  type?: "date" | "time" | "datetime-local";
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  wrapperClassName?: string;
}

function DateTimePicker({
  label,
  requiredMark = false,
  type = "date",
  inputProps,
  wrapperClassName,
}: DateTimePickerProps) {
  return (
    <label className={`${styles.field} ${wrapperClassName ?? ""}`.trim()}>
      {label && (
        <span>
          {label}
          {requiredMark && <em className={styles.required}>*</em>}
        </span>
      )}
      <input type={type} {...inputProps} />
    </label>
  );
}

export default DateTimePicker;
