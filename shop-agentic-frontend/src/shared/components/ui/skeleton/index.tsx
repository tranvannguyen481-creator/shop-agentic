import styles from "./index.module.scss";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

function Skeleton({ width = "100%", height = 16, className }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className ?? ""}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
