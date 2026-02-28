import styles from "./index.module.scss";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: string;
  className?: string;
}

function Breadcrumbs({ items, separator = "/", className }: BreadcrumbsProps) {
  return (
    <nav className={`${styles.breadcrumbs} ${className ?? ""}`.trim()}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className={styles.item}>
            {item.href && !isLast ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <strong>{item.label}</strong>
            )}
            {!isLast && <em>{separator}</em>}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
