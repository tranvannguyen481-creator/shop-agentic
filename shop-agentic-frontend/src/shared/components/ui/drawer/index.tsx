import { ReactNode } from "react";
import styles from "./index.module.scss";

interface DrawerProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  side?: "left" | "right";
}

function Drawer({ open, onClose, children, side = "left" }: DrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside
        className={`${styles.drawer} ${side === "right" ? styles.right : styles.left}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  );
}

export default Drawer;
