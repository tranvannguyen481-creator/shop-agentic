import styles from "./index.module.scss";

interface DividerProps {
  vertical?: boolean;
  className?: string;
}

function Divider({ vertical = false, className }: DividerProps) {
  return (
    <span
      className={`${styles.divider} ${vertical ? styles.vertical : styles.horizontal} ${className ?? ""}`.trim()}
      aria-hidden="true"
    />
  );
}

export default Divider;
