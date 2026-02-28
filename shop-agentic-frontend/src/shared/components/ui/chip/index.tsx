import { ReactNode } from "react";
import Button from "../button";
import styles from "./index.module.scss";

interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}

function Chip({ children, onRemove, className }: ChipProps) {
  return (
    <span className={`${styles.chip} ${className ?? ""}`.trim()}>
      <span>{children}</span>
      {onRemove && (
        <Button
          type="button"
          variant="text"
          className={styles.remove}
          onClick={onRemove}
          aria-label="Remove chip"
        >
          ×
        </Button>
      )}
    </span>
  );
}

export default Chip;
