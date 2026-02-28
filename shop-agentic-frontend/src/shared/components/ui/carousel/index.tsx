import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";
import Button from "../button";
import styles from "./index.module.scss";

interface CarouselProps {
  items: ReactNode[];
  className?: string;
}

function Carousel({ items, className }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items.length) {
    return null;
  }

  const handlePrev = () => {
    setActiveIndex((prevState) =>
      prevState === 0 ? items.length - 1 : prevState - 1,
    );
  };

  const handleNext = () => {
    setActiveIndex((prevState) =>
      prevState === items.length - 1 ? 0 : prevState + 1,
    );
  };

  return (
    <div className={`${styles.carousel} ${className ?? ""}`.trim()}>
      <div className={styles.viewport}>{items[activeIndex]}</div>
      {items.length > 1 && (
        <div className={styles.controls}>
          <Button
            type="button"
            variant="text"
            className={styles["control-btn"]}
            onClick={handlePrev}
          >
            <ChevronLeft size={16} /> Prev
          </Button>
          <span>
            {activeIndex + 1}/{items.length}
          </span>
          <Button
            type="button"
            variant="text"
            className={styles["control-btn"]}
            onClick={handleNext}
          >
            <ChevronRight size={16} /> Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default Carousel;
