import { useCallback, useEffect, useRef, useState } from "react";
import type { TestImage } from "../services/test-api";
import { fetchTestImages } from "../services/test-api";

export const useTestImages = () => {
  const [images, setImages] = useState<TestImage[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTestImages(pageNum, 4);
      setImages((prev) =>
        pageNum === 1 ? data.items : [...prev, ...data.items],
      );
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load images. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // IntersectionObserver on sentinel for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          setPage((prev) => {
            const next = prev + 1;
            if (next <= totalPages) {
              loadPage(next);
              return next;
            }
            return prev;
          });
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading, totalPages, loadPage]);

  const hasMore = page < totalPages;

  return { images, isLoading, error, hasMore, sentinelRef };
};
