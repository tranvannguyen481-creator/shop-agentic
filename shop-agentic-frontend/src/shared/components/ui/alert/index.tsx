import { ReactNode } from "react";
import styles from "./index.module.scss";

interface AlertProps {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "error";
  className?: string;
}

function Alert({ children, tone = "info", className }: AlertProps) {
  const role = tone === "error" ? "alert" : "status";

  return (
    <div
      className={`${styles.alert} ${styles[tone]} ${className ?? ""}`.trim()}
      role={role}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      {children}
    </div>
  );
}

export default Alert;
