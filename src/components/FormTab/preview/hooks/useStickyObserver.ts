import { RefObject, useEffect, useState } from "react";

interface UseStickyObserverOptions {
  enabled: boolean;
  targetRef: RefObject<HTMLElement>;
  containerRef: RefObject<HTMLElement>;
}

/**
 * Hook for detecting when a target element leaves the viewport
 * Used for showing sticky CTA when main CTA scrolls out of view
 */
export function useStickyObserver({
  enabled,
  targetRef,
  containerRef,
}: UseStickyObserverOptions): boolean {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    if (!enabled || !targetRef.current || !containerRef.current) {
      setIsSticky(false);
      return;
    }

    const checkVisibility = () => {
      const targetRect = targetRef.current?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (!targetRect || !containerRect) {
        setIsSticky(false);
        return;
      }

      // Check if target is out of view within the container
      const containerTop = containerRect.top;
      const containerBottom = containerRect.bottom;
      const targetTop = targetRect.top;
      const targetBottom = targetRect.bottom;

      // Target is visible if any part of it is within the container's visible area
      const isVisible = targetBottom >= containerTop && targetTop <= containerBottom;
      setIsSticky(!isVisible);
    };

    const container = containerRef.current;
    container?.addEventListener("scroll", checkVisibility);
    window.addEventListener("scroll", checkVisibility);
    checkVisibility();

    return () => {
      container?.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("scroll", checkVisibility);
    };
  }, [enabled, targetRef, containerRef]);

  return isSticky;
}
