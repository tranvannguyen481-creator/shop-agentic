import { TextareaHTMLAttributes } from "react";
import styles from "./index.module.scss";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  requiredMark?: boolean;
  wrapperClassName?: string;
}

function Textarea({
  label,
  requiredMark = false,
  wrapperClassName,
  ...textareaProps
}: TextareaProps) {
  return (
    <label className={`${styles.field} ${wrapperClassName ?? ""}`.trim()}>
      <span>
        {label}
        {requiredMark && <em className={styles.required}>*</em>}
      </span>
      <textarea {...textareaProps} />
    </label>
  );
}

export default Textarea;
