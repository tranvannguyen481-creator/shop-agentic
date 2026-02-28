import Button from "../button";
import styles from "./index.module.scss";

export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: ReadonlyArray<TabItem>;
  activeKey: string;
  onChange?: (key: string) => void;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
}

function Tabs({
  items,
  activeKey,
  onChange,
  className,
  tabClassName,
  activeTabClassName,
}: TabsProps) {
  return (
    <nav className={`${styles.tabs} ${className ?? ""}`.trim()}>
      {items.map((item) => (
        <Button
          key={item.key}
          type="button"
          variant="text"
          className={`${styles.tab} ${tabClassName ?? ""} ${
            activeKey === item.key
              ? `${styles.active} ${activeTabClassName ?? ""}`
              : ""
          }`.trim()}
          onClick={() => onChange?.(item.key)}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}

export default Tabs;
