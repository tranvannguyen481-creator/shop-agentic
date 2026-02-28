import styles from "./index.module.scss";

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  wrapperClassName?: string;
}

function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  wrapperClassName,
}: SwitchProps) {
  return (
    <label className={`${styles.switch} ${wrapperClassName ?? ""}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}

export default Switch;
