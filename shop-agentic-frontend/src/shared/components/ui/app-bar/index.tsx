import { ReactNode } from "react";
import styles from "./index.module.scss";

interface AppBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

function AppBar({ left, center, right, className }: AppBarProps) {
  return (
    <header className={`${styles.bar} ${className ?? ""}`.trim()}>
      <div className={styles.left}>{left}</div>
      <div className={styles.center}>{center}</div>
      <div className={styles.right}>{right}</div>
    </header>
  );
}

export default AppBar;
