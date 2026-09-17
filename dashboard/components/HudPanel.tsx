import type { ReactNode } from "react";

interface HudPanelProps {
  title: string;
  accent?: "cyan" | "magenta";
  children: ReactNode;
  className?: string;
}

export function HudPanel({ title, accent = "cyan", children, className = "" }: HudPanelProps) {
  const glow = accent === "cyan" ? "text-glow-cyan" : "text-glow-magenta";

  return (
    <section className={`hud-panel flex flex-col p-3 ${className}`}>
      <h2 className={`font-display text-[10px] tracking-[0.2em] uppercase mb-2 shrink-0 ${glow}`}>
        {title}
      </h2>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}
