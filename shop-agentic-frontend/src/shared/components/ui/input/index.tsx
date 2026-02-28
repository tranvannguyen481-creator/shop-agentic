import { InputHTMLAttributes, ReactNode } from "react";
import styles from "./index.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  requiredMark?: boolean;
  wrapperClassName?: string;
  trailingAction?: ReactNode;
}

function Input({
  label,
  requiredMark = false,
  wrapperClassName,
  trailingAction,
  ...inputProps
}: InputProps) {
  return (
    <label className={`${styles.field} ${wrapperClassName ?? ""}`.trim()}>
      {label && (
        <div className={styles.label}>
          {typeof label === "string" ? <span>{label}</span> : label}
          {requiredMark && <em className={styles.required}>*</em>}
        </div>
      )}
      <div className={styles.inputWrap}>
        <input {...inputProps} />
        {trailingAction ? (
          <span className={styles.trailingAction}>{trailingAction}</span>
        ) : null}
      </div>
    </label>
  );
}

export default Input;
