import styles from "./index.module.scss";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const safePercent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={`${styles.track} ${className ?? ""}`.trim()}>
      <div className={styles.fill} style={{ width: `${safePercent}%` }} />
    </div>
  );
}

export default ProgressBar;
