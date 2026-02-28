import { HTMLAttributes, ReactNode } from "react";
import styles from "./index.module.scss";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}

function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
  ...restProps
}: EmptyStateProps) {
  return (
    <div
      className={`${styles.emptyState} ${className ?? ""}`.trim()}
      {...restProps}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

export default EmptyState;
