import { useId } from "react";

/**
 * Sparkline — minimal trend line with a gradient stroke and a soft area fill.
 * Pass a brand hex in `color`; the stroke fades toward the Emoney coral so a
 * flat series still reads as "alive".
 */
export function Sparkline({
  values,
  color = "#185df5",
  height = 40,
  width = 140
}: {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  // Inset the line a touch so the rounded stroke isn't clipped at the edges.
  const pad = 2;
  const innerH = height - pad * 2;
  const pts = values.map((v, i) => ({
    x: i * step,
    y: pad + (innerH - ((v - min) / range) * innerH),
  }));
  const points = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `0,${height} ${points} ${width},${height}`;

  const fillId = `spark-fill-${uid}`;
  const strokeId = `spark-stroke-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${fillId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={`url(#${strokeId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
