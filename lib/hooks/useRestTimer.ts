'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRestTimerOptions {
  defaultDuration?: number;
  onComplete?: () => void;
}

export function useRestTimer({
  defaultDuration = 90,
  onComplete,
}: UseRestTimerOptions = {}) {
  const [duration, setDuration] = useState(defaultDuration);
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep the ref up to date
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setRemaining(0);
  }, []);

  const start = useCallback(
    (customDuration?: number) => {
      stop();
      const seconds = customDuration ?? duration;
      setRemaining(seconds);
      setIsRunning(true);
    },
    [duration, stop],
  );

  // Tick effect
  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Vibrate on mobile if supported
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining]);

  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  return {
    remaining,
    isRunning,
    progress,
    duration,
    setDuration,
    start,
    stop,
  };
}
