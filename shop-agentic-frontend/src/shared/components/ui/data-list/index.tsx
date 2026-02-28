import { ReactNode } from "react";
import styles from "./index.module.scss";

export interface DataListItem {
  key: string;
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}

interface DataListProps {
  items: DataListItem[];
  className?: string;
}

function DataList({ items, className }: DataListProps) {
  return (
    <ul className={`${styles.list} ${className ?? ""}`.trim()}>
      {items.map((item) => (
        <li key={item.key}>
          {item.leading && <div className={styles.leading}>{item.leading}</div>}
          <div className={styles.content}>
            <strong>{item.title}</strong>
            {item.subtitle && <p>{item.subtitle}</p>}
          </div>
          {item.trailing && (
            <div className={styles.trailing}>{item.trailing}</div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default DataList;
