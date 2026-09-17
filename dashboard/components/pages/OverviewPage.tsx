import type { SiteOverview, WanStatus } from "@/lib/types";
import { formatBitsPerSecond, formatMbps, formatUptime } from "@/lib/format";
import { HudPanel } from "@/components/HudPanel";
import { StatTile } from "@/components/StatTile";
import { Sparkline } from "@/components/Sparkline";

interface OverviewPageProps {
  site: SiteOverview | null;
  wan: WanStatus | null;
  rxHistory: number[];
  txHistory: number[];
  now: Date | null;
}

export function OverviewPage({ site, wan, rxHistory, txHistory, now }: OverviewPageProps) {
  const hours = now ? String(now.getHours()).padStart(2, "0") : "--";
  const minutes = now ? String(now.getMinutes()).padStart(2, "0") : "--";

  return (
    <div className="h-full flex flex-col gap-2 px-1">
      <div className="flex flex-row gap-3 flex-[4] min-h-0">
        <HudPanel title="Site Overview" className="flex-1">
          <div className="h-full flex flex-col gap-4">
            <div className="flex items-center gap-2 font-display font-bold text-4xl leading-none">
              <span className="text-glow-cyan">{hours}</span>
              <span className="flex flex-col items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="text-glow-magenta">{minutes}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              <StatTile label="Wired" value={String(site?.clientsWired ?? "--")} size="xl" />
              <StatTile label="Wireless" value={String(site?.clientsWireless ?? "--")} size="xl" accent="magenta" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <StatTile label="Guests" value={String(site?.guests ?? "--")} accent="magenta" size="lg" />
              <StatTile label="Disconnected" value={String(site?.disconnected ?? "--")} accent="yellow" size="lg" />
              <StatTile label="Access Points" value={String(site?.accessPoints ?? "--")} size="lg" />
              <StatTile label="Gateways" value={String(site?.gateways ?? "--")} size="lg" />
              <StatTile label="Switches" value={String(site?.switches ?? "--")} size="lg" />
            </div>
          </div>
        </HudPanel>

        <HudPanel title="WAN Uplink" accent="magenta" className="flex-1">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-6">
              <StatTile label="Download" value={formatBitsPerSecond(wan?.rxRateBytes ?? null)} size="xl" />
              <StatTile
                label="Upload"
                value={formatBitsPerSecond(wan?.txRateBytes ?? null)}
                size="xl"
                accent="magenta"
              />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <StatTile
                label="Internet Uptime"
                value={formatUptime(wan?.uptimeSeconds ?? null)}
                accent="yellow"
                size="lg"
              />
              <StatTile
                label="Latency"
                value={wan?.latencySeconds != null ? `${Math.round(wan.latencySeconds * 1000)}ms` : "--"}
                size="lg"
              />
              <StatTile label="Last Speedtest ↓" value={formatMbps(wan?.speedtestDownMbps ?? null)} size="lg" />
              <StatTile
                label="Last Speedtest ↑"
                value={formatMbps(wan?.speedtestUpMbps ?? null)}
                size="lg"
                accent="magenta"
              />
            </div>
          </div>
        </HudPanel>
      </div>

      <HudPanel title="WAN Throughput History" className="flex-1 min-h-0">
        <div className="h-full flex flex-col gap-1.5">
          <div className="relative flex-1 min-h-0 w-full">
            <Sparkline values={rxHistory} color="var(--cyan)" fill className="absolute inset-0" />
            <Sparkline values={txHistory} color="var(--magenta)" fill className="absolute inset-0" />
          </div>
          <div className="flex items-center gap-4 shrink-0 text-[10px] uppercase tracking-[0.1em]">
            <span className="flex items-center gap-1.5 text-glow-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
              Down {formatBitsPerSecond(wan?.rxRateBytes ?? null)}
            </span>
            <span className="flex items-center gap-1.5 text-glow-magenta">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--magenta)]" />
              Up {formatBitsPerSecond(wan?.txRateBytes ?? null)}
            </span>
          </div>
        </div>
      </HudPanel>
    </div>
  );
}
