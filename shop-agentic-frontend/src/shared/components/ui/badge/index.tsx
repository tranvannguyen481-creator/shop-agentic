import { ReactNode } from "react";
import styles from "./index.module.scss";

interface BadgeProps {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[tone]} ${className ?? ""}`.trim()}
    >
      {children}
    </span>
  );
}

export default Badge;
