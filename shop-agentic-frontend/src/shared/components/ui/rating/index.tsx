import Button from "../button";
import styles from "./index.module.scss";

interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  wrapperClassName?: string;
}

function Rating({
  value,
  max = 5,
  onChange,
  readonly = false,
  wrapperClassName,
}: RatingProps) {
  return (
    <div className={`${styles.rating} ${wrapperClassName ?? ""}`.trim()}>
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;

        return (
          <Button
            key={starValue}
            type="button"
            variant="text"
            className={`${styles.star} ${active ? styles.active : ""}`}
            onClick={() => !readonly && onChange?.(starValue)}
            aria-label={`Rate ${starValue}`}
            disabled={readonly}
          >
            ★
          </Button>
        );
      })}
    </div>
  );
}

export default Rating;
