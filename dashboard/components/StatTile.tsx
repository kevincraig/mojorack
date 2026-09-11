interface StatTileProps {
  label: string;
  value: string;
  accent?: "cyan" | "magenta" | "yellow";
  size?: "md" | "lg" | "hero";
}

const ACCENT_CLASS: Record<NonNullable<StatTileProps["accent"]>, string> = {
  cyan: "text-glow-cyan",
  magenta: "text-glow-magenta",
  yellow: "text-[var(--yellow)]",
};

const SIZE_CLASS: Record<NonNullable<StatTileProps["size"]>, string> = {
  md: "text-2xl",
  lg: "text-4xl",
  hero: "text-6xl",
};

export function StatTile({ label, value, accent = "cyan", size = "md" }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs tracking-[0.2em] uppercase text-[var(--text-dim)]">{label}</span>
      <span className={`font-display font-bold leading-none ${SIZE_CLASS[size]} ${ACCENT_CLASS[accent]}`}>
        {value}
      </span>
    </div>
  );
}
