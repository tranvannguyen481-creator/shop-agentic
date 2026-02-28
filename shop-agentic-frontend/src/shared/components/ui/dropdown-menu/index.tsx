import { ReactNode, useMemo, useState } from "react";
import Button from "../button";
import styles from "./index.module.scss";

export interface DropdownItem {
  key: string;
  label: string;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect?: (key: string) => void;
  className?: string;
}

function DropdownMenu({
  trigger,
  items,
  onSelect,
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const randomId = useMemo(
    () => `menu-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  return (
    <div className={`${styles.menu} ${className ?? ""}`.trim()}>
      <Button
        type="button"
        variant="text"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={randomId}
        onClick={() => setOpen((prevState) => !prevState)}
      >
        {trigger}
      </Button>

      {open && (
        <ul id={randomId}>
          {items.map((item) => (
            <li key={item.key}>
              <Button
                type="button"
                variant="text"
                className={styles["item-btn"]}
                onClick={() => {
                  onSelect?.(item.key);
                  setOpen(false);
                }}
              >
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DropdownMenu;
