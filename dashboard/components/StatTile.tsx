interface StatTileProps {
  label: string;
  value: string;
  accent?: "cyan" | "magenta" | "yellow";
  size?: "sm" | "md" | "lg" | "xl";
}

const ACCENT_CLASS: Record<NonNullable<StatTileProps["accent"]>, string> = {
  cyan: "text-glow-cyan",
  magenta: "text-glow-magenta",
  yellow: "text-[var(--yellow)]",
};

const SIZE_CLASS: Record<NonNullable<StatTileProps["size"]>, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl",
};

export function StatTile({ label, value, accent = "cyan", size = "sm" }: StatTileProps) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[9px] leading-none tracking-[0.15em] uppercase text-[var(--text-dim)] truncate">
        {label}
      </span>
      <span className={`font-display font-bold leading-none ${SIZE_CLASS[size]} ${ACCENT_CLASS[accent]}`}>
        {value}
      </span>
    </div>
  );
}
