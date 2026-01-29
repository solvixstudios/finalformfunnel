import { useEffect, useState } from "react";

/**
 * Configurable breakpoints matching Tailwind CSS defaults
 * Modify these values to change responsive behavior globally
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

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

    // Add listener
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
};

/**
 * Convenience hook for mobile detection
 * Used by sidebar and other components that need mobile breakpoint
 */
export const useIsMobile = () => useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);

/**
 * Common breakpoint queries based on configurable BREAKPOINTS
 */
export const useBreakpoints = () => {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.sm}px)`);
  const isTablet = useMediaQuery(`(max-width: ${BREAKPOINTS.lg}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.lg + 1}px)`);
  const isLargeDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
  };
};
