import { ReactNode } from "react";
import styles from "./index.module.scss";

interface GridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

function Grid({ children, columns = 2, gap = 12, className }: GridProps) {
  return (
    <div
      className={`${styles.grid} ${className ?? ""}`.trim()}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

export default Grid;
