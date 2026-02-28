import { ReactNode, useState } from "react";
import Button from "../button";
import styles from "./index.module.scss";

interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function Accordion({
  title,
  children,
  defaultOpen = false,
  className,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`${styles.accordion} ${className ?? ""}`.trim()}>
      <Button
        type="button"
        variant="text"
        className={styles.trigger}
        onClick={() => setOpen((prevState) => !prevState)}
      >
        <span>{title}</span>
        <strong>{open ? "−" : "+"}</strong>
      </Button>
      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
}

export default Accordion;
