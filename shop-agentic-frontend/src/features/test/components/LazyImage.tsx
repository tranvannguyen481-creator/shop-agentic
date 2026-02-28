import { useLazyImage } from "../hooks/use-lazy-image";
import styles from "./LazyImage.module.scss";

interface LazyImageProps {
  src: string;
  alt: string;
  title?: string;
}

function LazyImage({ src, alt, title }: LazyImageProps) {
  const { ref, isVisible } = useLazyImage();

  return (
    <div ref={ref} className={styles.wrapper}>
      {isVisible ? (
        <img src={src} alt={alt} className={styles.image} loading="lazy" />
      ) : (
        <div className={styles.placeholder} aria-hidden="true" />
      )}
      {title && <p className={styles.caption}>{title}</p>}
    </div>
  );
}

export default LazyImage;
