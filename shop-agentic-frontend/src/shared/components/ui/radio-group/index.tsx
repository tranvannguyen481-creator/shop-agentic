import { useId } from "react";
import styles from "./index.module.scss";

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  label?: string;
  name?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  wrapperClassName?: string;
}

function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  wrapperClassName,
}: RadioGroupProps) {
  const generatedName = useId();
  const fieldName = name ?? generatedName;

  return (
    <fieldset className={`${styles.group} ${wrapperClassName ?? ""}`.trim()}>
      {label && <legend>{label}</legend>}
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={fieldName}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange?.(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default RadioGroup;
