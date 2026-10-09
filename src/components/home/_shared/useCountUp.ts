"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

type Options = {
  /** Tween duration in ms. Default 1400. */
  duration?: number;
  /** Gate the animation (e.g. until in view). Default true. */
  start?: boolean;
};

/**
 * requestAnimationFrame-driven number tween. Re-tweens from the current
 * value whenever `target` changes, so it works for both "reveal once" stats
 * and live calculators. Honours prefers-reduced-motion by snapping.
 */
export function useCountUp(target: number, { duration = 1400, start = true }: Options = {}) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (!start) return;
    if (reduce) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    const from = currentRef.current;
    let raf = 0;
    let t0: number | null = null;

    const tick = (t: number) => {
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      currentRef.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start, reduce]);

  return value;
}
