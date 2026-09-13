'use client';

import { useEffect, useRef, useState } from 'react';

interface UseLiveRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
  onRefresh: () => Promise<void> | void;
}

export function useLiveRefresh({
  intervalMs = 30000,
  enabled = true,
  onRefresh,
}: UseLiveRefreshOptions) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    if (!enabled) return;

    const executeRefresh = async () => {
      if (isRefreshingRef.current || document.visibilityState === 'hidden') {
        return;
      }

      isRefreshingRef.current = true;
      try {
        await onRefreshRef.current();
        setLastUpdated(new Date());
      } catch (err) {
        console.warn('Live refresh sync error:', err);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        executeRefresh();
      }
    };

    const timer = setInterval(executeRefresh, intervalMs);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, enabled]);

  return { lastUpdated };
}

