import { ReactNode } from "react";
import styles from "./index.module.scss";

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  time?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={`${styles.timeline} ${className ?? ""}`.trim()}>
      {items.map((item) => (
        <li key={item.id}>
          <span className={styles.dot} aria-hidden="true" />
          <div>
            <strong>{item.title}</strong>
            {item.description && <p>{item.description}</p>}
            {item.time && <small>{item.time}</small>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default Timeline;
