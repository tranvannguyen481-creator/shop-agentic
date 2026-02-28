import { ReactNode } from "react";
import styles from "./index.module.scss";

interface ToastProps {
  message: ReactNode;
  action?: ReactNode;
  className?: string;
}

function Toast({ message, action, className }: ToastProps) {
  return (
    <div className={`${styles.toast} ${className ?? ""}`.trim()} role="status">
      <span>{message}</span>
      {action && <div>{action}</div>}
    </div>
  );
}

export default Toast;
