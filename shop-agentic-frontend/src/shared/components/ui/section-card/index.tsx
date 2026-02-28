import { HTMLAttributes, ReactNode } from "react";
import styles from "./index.module.scss";

interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  unstyled?: boolean;
  interactive?: boolean;
}

function SectionCard({
  children,
  className,
  unstyled = false,
  interactive = false,
  ...restProps
}: SectionCardProps) {
  const baseClassName = unstyled
    ? ""
    : `${styles.card} ${interactive ? styles.interactive : ""}`.trim();

  return (
    <div
      className={`${baseClassName} ${className ?? ""}`.trim()}
      {...restProps}
    >
      {children}
    </div>
  );
}

export default SectionCard;
