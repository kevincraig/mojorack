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
    <section className={`hud-panel flex flex-col p-4 ${className}`}>
      <h2 className={`font-display text-xs tracking-[0.3em] uppercase mb-3 ${glow}`}>
        {title}
      </h2>
      <div className="flex-1">{children}</div>
    </section>
  );
}
