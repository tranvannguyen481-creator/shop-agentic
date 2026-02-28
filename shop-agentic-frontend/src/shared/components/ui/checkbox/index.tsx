import { InputHTMLAttributes, ReactNode } from "react";
import styles from "./index.module.scss";

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  description?: ReactNode;
  wrapperClassName?: string;
}

function Checkbox({
  label,
  description,
  wrapperClassName,
  ...checkboxProps
}: CheckboxProps) {
  return (
    <div className={`${styles.wrapper} ${wrapperClassName ?? ""}`.trim()}>
      <label className={styles.row}>
        <input type="checkbox" {...checkboxProps} />
        <span>{label}</span>
      </label>
      {description && <p>{description}</p>}
    </div>
  );
}

export default Checkbox;
