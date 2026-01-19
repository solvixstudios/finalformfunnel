import { useEffect, useState } from "react";

/**
 * Custom hook to detect media query matches
 * Useful for responsive design that depends on screen size
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating whether the query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Check if window is defined (for SSR compatibility)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener function
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener (support both old and new API)
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    } else {
      mediaQuery.addEventListener("change", handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      } else {
        mediaQuery.removeEventListener("change", handleChange);
      }
    };
  }, [query]);

  return matches;
};

/**
 * Common breakpoint queries based on Tailwind CSS
 */
export const useBreakpoints = () => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)");
  const isLargeDesktop = useMediaQuery("(min-width: 1280px)");

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
  };
};
