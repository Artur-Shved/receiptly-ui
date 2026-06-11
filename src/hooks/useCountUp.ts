'use client';

import { useEffect, useState } from 'react';

/**
 * Animates a number from 0 to `target` with an ease-out curve using
 * requestAnimationFrame. Restarts when `target` changes.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(target) || target <= 0) {
      setValue(Math.max(0, target));
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(target * eased * 100) / 100);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
