import { ReactNode } from "react";
import styles from "./index.module.scss";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
}

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  bodyClassName,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        {title && <header>{title}</header>}
        <div className={`${styles.body} ${bodyClassName ?? ""}`.trim()}>
          {children}
        </div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
}

export default Modal;
