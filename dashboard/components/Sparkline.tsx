import { useId } from "react";

interface SparklineProps {
  values: number[];
  color?: string;
  fill?: boolean;
  className?: string;
}

const VIEWBOX_WIDTH = 400;
// Coordinate space only - the <svg> itself stretches to fill whatever CSS
// size its wrapper gives it (preserveAspectRatio="none"), so this is
// unrelated to the element's actual rendered height.
const VIEWBOX_HEIGHT = 100;

export function Sparkline({ values, color = "var(--cyan)", fill = false, className = "" }: SparklineProps) {
  const gradientId = useId();

  if (values.length < 2) {
    return <div className={`w-full h-full ${className}`} />;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * VIEWBOX_WIDTH;
    // Keep the line off the very top/bottom edge so it reads as a graph,
    // not a shape clipped by the frame.
    const y = VIEWBOX_HEIGHT * 0.1 + (1 - (value - min) / range) * VIEWBOX_HEIGHT * 0.8;
    return [x, y] as const;
  });

  const points = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPoints = `0,${VIEWBOX_HEIGHT} ${points} ${VIEWBOX_WIDTH},${VIEWBOX_HEIGHT}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      className={`overflow-visible ${className}`}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
