import { useEffect, useRef, useState } from "react";

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
}

interface UseCountdownTimerOptions {
  enabled: boolean;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

/**
 * Hook for managing a real-time countdown timer
 * Returns current countdown state that updates every second
 */
export function useCountdownTimer({
  enabled,
  hours = 0,
  minutes = 0,
  seconds = 0,
}: UseCountdownTimerOptions): CountdownState | null {
  const [countdown, setCountdown] = useState<CountdownState | null>(null);
  const initialTotalRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setCountdown(null);
      return;
    }

    // Calculate total seconds
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    initialTotalRef.current = totalSeconds;

    // Initialize countdown
    setCountdown({
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    });

    // Update every second
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (!prev) return null;

        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes--;
          if (newMinutes < 0) {
            newMinutes = 59;
            newHours--;
            if (newHours < 0) {
              // Timer expired
              return { hours: 0, minutes: 0, seconds: 0 };
            }
          }
        }

        return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, hours, minutes, seconds]);

  return countdown;
}

/**
 * Format countdown for display
 */
export function formatCountdown(countdown: CountdownState | null): string {
  if (!countdown) return "00:00:00";
  const { hours, minutes, seconds } = countdown;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
