import styles from "./index.module.scss";

interface SliderProps {
  label?: string;
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  wrapperClassName?: string;
}

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  wrapperClassName,
}: SliderProps) {
  return (
    <label className={`${styles.field} ${wrapperClassName ?? ""}`.trim()}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && <span>{label}</span>}
          {showValue && <strong>{value}</strong>}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
    </label>
  );
}

export default Slider;
