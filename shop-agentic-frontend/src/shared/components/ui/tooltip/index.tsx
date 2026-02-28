import { ReactNode } from "react";
import styles from "./index.module.scss";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={`${styles.wrapper} ${className ?? ""}`.trim()}>
      {children}
      <span className={styles.tooltip}>{content}</span>
    </span>
  );
}

export default Tooltip;
