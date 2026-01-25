import { RefObject, useEffect, useState } from "react";

export interface UseStickyObserverOptions {
  enabled: boolean;
  targetRef: RefObject<HTMLElement>;
  containerRef: RefObject<HTMLElement>;
  useWindowRoot?: boolean;
}

/**
 * Hook for detecting when a target element leaves the viewport
 * Used for showing sticky CTA when main CTA scrolls out of view
 */
export function useStickyObserver({
  enabled,
  targetRef,
  containerRef,
  useWindowRoot = false,
}: UseStickyObserverOptions): boolean {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    if (!enabled || !targetRef.current) {
      setIsSticky(false);
      return;
    }

    const target = targetRef.current;
    const container = containerRef.current; // Might be null if useWindowRoot, or ignored

    // Use IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
        root: useWindowRoot ? null : container, // null = viewport
        threshold: 0,
        rootMargin: "0px",
      },
    );

    observer.observe(target);

    // Backup scroll check
    const checkVisibility = () => {
      if (!target) return;
      const targetRect = target.getBoundingClientRect();

      let isVisible = false;
      if (useWindowRoot) {
        // Check against viewport
        isVisible = targetRect.top < window.innerHeight && targetRect.bottom > 0;
      } else {
        // Check against container
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        isVisible =
          targetRect.top < containerRect.bottom &&
          targetRect.bottom > containerRect.top;
      }

      setIsSticky(!isVisible);
    };

    checkVisibility();

    const scrollTarget = useWindowRoot ? window : container;
    if (scrollTarget) {
      scrollTarget.addEventListener("scroll", checkVisibility, { passive: true });
    }

    return () => {
      observer.disconnect();
      if (scrollTarget) {
        scrollTarget.removeEventListener("scroll", checkVisibility);
      }
    };
  }, [enabled, targetRef, containerRef, useWindowRoot]);

  return isSticky;
}
