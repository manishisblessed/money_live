"use client";

import { useMemo, useRef } from "react";
import { useInView } from "framer-motion";
import { useCountUp } from "./useCountUp";

type Parsed = {
  prefix: string;
  num: number | null;
  suffix: string;
  decimals: number;
  grouping: boolean;
};

/** Splits "₹240 Cr+" → { prefix: "₹", num: 240, suffix: " Cr+" }. */
function parseStat(value: string): Parsed {
  const m = value.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: "", num: null, suffix: value, decimals: 0, grouping: false };
  const [, prefix, numStr, suffix] = m;
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  return {
    prefix,
    num: parseFloat(numStr.replace(/,/g, "")),
    suffix,
    decimals,
    grouping: numStr.includes(",")
  };
}

export function formatStatNumber(n: number, decimals: number, grouping: boolean) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping
  });
}

/**
 * Animates the numeric part of a display string ("72K+", "1,400+", "₹240 Cr+")
 * when it scrolls into view. Screen readers get the final value immediately.
 */
export function CountUp({
  value,
  className,
  duration
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  const parsed = useMemo(() => parseStat(value), [value]);
  const n = useCountUp(parsed.num ?? 0, { start: inView, duration });

  const text =
    parsed.num === null
      ? value
      : `${parsed.prefix}${formatStatNumber(n, parsed.decimals, parsed.grouping)}${parsed.suffix}`;

  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{text}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
