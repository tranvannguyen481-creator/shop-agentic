import styles from "./index.module.scss";

interface SpinnerProps {
  size?: number;
  className?: string;
}

function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${className ?? ""}`.trim()}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export default Spinner;
