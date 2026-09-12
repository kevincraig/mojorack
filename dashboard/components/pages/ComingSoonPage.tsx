import { HudPanel } from "@/components/HudPanel";

const PLANNED = ["Per-client DPI usage", "Firewall drops", "Speedtest history", "Network topology"];

export function ComingSoonPage() {
  return (
    <div className="h-full px-1">
      <HudPanel title="More Telemetry" className="h-full">
        <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
          <p className="font-display text-sm tracking-[0.2em] uppercase text-glow-cyan hud-flicker">
            Additional Feeds Incoming
          </p>
          <ul className="text-xs text-[var(--text-dim)] flex flex-col gap-1">
            {PLANNED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </HudPanel>
    </div>
  );
}
