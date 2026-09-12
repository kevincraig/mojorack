import type { SiteOverview, WanStatus } from "@/lib/types";
import { formatBitsPerSecond, formatUptime } from "@/lib/format";
import { HudPanel } from "@/components/HudPanel";
import { StatTile } from "@/components/StatTile";
import { Sparkline } from "@/components/Sparkline";

interface OverviewPageProps {
  site: SiteOverview | null;
  wan: WanStatus | null;
  rxHistory: number[];
  txHistory: number[];
}

export function OverviewPage({ site, wan, rxHistory, txHistory }: OverviewPageProps) {
  return (
    <div className="h-full flex flex-col gap-2 px-1">
      <HudPanel title="Site Overview" className="flex-1">
        <div className="flex h-full items-center justify-between gap-2">
          <StatTile label="Wired" value={String(site?.clientsWired ?? "--")} size="xl" />
          <StatTile label="Wireless" value={String(site?.clientsWireless ?? "--")} size="xl" accent="magenta" />
          <StatTile label="Guests" value={String(site?.guests ?? "--")} accent="magenta" size="lg" />
          <StatTile label="Disconnected" value={String(site?.disconnected ?? "--")} accent="yellow" size="lg" />
          <StatTile label="Access Points" value={String(site?.accessPoints ?? "--")} size="lg" />
          <StatTile label="Gateways" value={String(site?.gateways ?? "--")} size="lg" />
          <StatTile label="Switches" value={String(site?.switches ?? "--")} size="lg" />
        </div>
      </HudPanel>

      <HudPanel title="WAN Uplink" accent="magenta" className="flex-1">
        <div className="flex h-full items-center gap-4">
          <StatTile label="Download" value={formatBitsPerSecond(wan?.rxRateBytes ?? null)} size="xl" />
          <StatTile label="Upload" value={formatBitsPerSecond(wan?.txRateBytes ?? null)} size="xl" accent="magenta" />
          <div className="relative flex-1 h-10 min-w-0">
            <Sparkline values={rxHistory} color="var(--cyan)" height={40} fill className="absolute inset-0" />
            <Sparkline values={txHistory} color="var(--magenta)" height={40} fill className="absolute inset-0" />
          </div>
          <StatTile
            label="Latency"
            value={wan?.latencySeconds != null ? `${Math.round(wan.latencySeconds * 1000)}ms` : "--"}
            size="lg"
          />
          <StatTile label="Uptime" value={formatUptime(wan?.uptimeSeconds ?? null)} accent="yellow" size="lg" />
        </div>
      </HudPanel>
    </div>
  );
}
