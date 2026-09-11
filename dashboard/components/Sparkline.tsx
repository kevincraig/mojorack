interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  fill?: boolean;
  className?: string;
}

const VIEWBOX_WIDTH = 400;

export function Sparkline({
  values,
  color = "var(--cyan)",
  height = 36,
  fill = false,
  className = "",
}: SparklineProps) {
  if (values.length < 2) {
    return <div style={{ height }} className={`w-full ${className}`} />;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * VIEWBOX_WIDTH;
    const y = height - ((value - min) / range) * height;
    return [x, y] as const;
  });

  const points = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPoints = `0,${height} ${points} ${VIEWBOX_WIDTH},${height}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
      preserveAspectRatio="none"
      className={`overflow-visible ${className}`}
    >
      {fill && <polygon points={areaPoints} fill={color} opacity={0.12} />}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
