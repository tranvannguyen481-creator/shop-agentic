import LazyImage from "../../components/LazyImage";
import { useTestImages } from "../../hooks/use-test-images";
import styles from "./index.module.scss";

export const routePath = "/test";

function TestPage() {
  const { images, isLoading, error, hasMore, sentinelRef } = useTestImages();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lazy Load Test</h1>
        <p className={styles.subtitle}>
          Images are fetched from <code>GET /api/test/images</code> and loaded
          lazily as they enter the viewport via{" "}
          <code>IntersectionObserver</code>.
        </p>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.grid}>
        {images.map((img) => (
          <LazyImage
            key={img.id}
            src={img.url}
            alt={img.title}
            title={img.title}
          />
        ))}
      </div>

      {/* Sentinel element triggers next page when visible */}
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />

      {isLoading && (
        <div className={styles.loader}>
          <div className={styles.spinner} />
          <span>Loading images…</span>
        </div>
      )}

      {!hasMore && !isLoading && images.length > 0 && (
        <p className={styles.endMessage}>All {images.length} images loaded.</p>
      )}
    </div>
  );
}

export default TestPage;
