import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(callback: () => void, hasMore: boolean, loading: boolean) {
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      }, { threshold: 0.1 });
      if (node) observer.current.observe(node);
    },
    [callback, hasMore, loading]
  );

  useEffect(() => {
    return () => observer.current?.disconnect();
  }, []);

  return lastElementRef;
}
