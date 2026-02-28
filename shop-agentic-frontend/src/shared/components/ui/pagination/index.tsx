import Button from "../button";
import styles from "./index.module.scss";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange?: (page: number) => void;
  className?: string;
}

function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className={`${styles.pagination} ${className ?? ""}`.trim()}>
      <Button
        type="button"
        variant="text"
        className={styles["page-btn"]}
        onClick={() => onChange?.(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Prev
      </Button>
      {pages.map((pageNumber) => (
        <Button
          key={pageNumber}
          type="button"
          variant="text"
          className={`${styles["page-btn"]} ${pageNumber === page ? styles.active : ""}`}
          onClick={() => onChange?.(pageNumber)}
        >
          {pageNumber}
        </Button>
      ))}
      <Button
        type="button"
        variant="text"
        className={styles["page-btn"]}
        onClick={() => onChange?.(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </div>
  );
}

export default Pagination;
