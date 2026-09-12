"use client";

import { useEffect, useState } from "react";
import type { MetricsSnapshot } from "@/lib/types";
import { formatBitsPerSecond, formatUptime } from "@/lib/format";
import { HudPanel } from "@/components/HudPanel";
import { StatTile } from "@/components/StatTile";
import { Sparkline } from "@/components/Sparkline";
import { DeviceGrid } from "@/components/DeviceGrid";

const POLL_INTERVAL_MS = 15_000;
const HISTORY_LENGTH = 40;

export function Dashboard() {
  const [snapshot, setSnapshot] = useState<MetricsSnapshot | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [rxHistory, setRxHistory] = useState<number[]>([]);
  const [txHistory, setTxHistory] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/metrics", { cache: "no-store" });
        const data = (await response.json()) as MetricsSnapshot;
        if (cancelled) return;

        setSnapshot(data);

        if (data.wan?.rxRateBytes !== null && data.wan?.rxRateBytes !== undefined) {
          const rxRateBytes = data.wan.rxRateBytes;
          setRxHistory((history) => [...history, rxRateBytes].slice(-HISTORY_LENGTH));
        }
        if (data.wan?.txRateBytes !== null && data.wan?.txRateBytes !== undefined) {
          const txRateBytes = data.wan.txRateBytes;
          setTxHistory((history) => [...history, txRateBytes].slice(-HISTORY_LENGTH));
        }
      } catch (error) {
        console.error("Metrics poll failed:", error);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  const online = snapshot?.controllerReachable ?? false;
  const site = snapshot?.site ?? null;
  const wan = snapshot?.wan ?? null;

  return (
    <div className="hud-grid-bg flex flex-col h-full w-full p-2 gap-2 overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <h1 className="font-display text-xs font-black tracking-[0.3em] text-glow-cyan hud-flicker">
          MOJORACK // NETCTRL
        </h1>
        <div className="flex items-center gap-2 text-[9px]">
          <span className={online ? "text-glow-cyan" : "text-glow-red"}>
            {online ? "● LINK OK" : "● LINK LOST"}
          </span>
          <span className="font-hud text-[var(--text-dim)]">
            {now ? now.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
          </span>
        </div>
      </header>

      <HudPanel title="Site + WAN" className="shrink-0">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-1.5">
          <StatTile label="Wired" value={String(site?.clientsWired ?? "--")} size="md" />
          <StatTile label="Wireless" value={String(site?.clientsWireless ?? "--")} size="md" accent="magenta" />
          <StatTile label="Guests" value={String(site?.guests ?? "--")} accent="magenta" />
          <StatTile label="Disc." value={String(site?.disconnected ?? "--")} accent="yellow" />
          <StatTile label="APs" value={String(site?.accessPoints ?? "--")} />
          <StatTile label="GW" value={String(site?.gateways ?? "--")} />
          <StatTile label="SW" value={String(site?.switches ?? "--")} />
          <div className="w-px self-stretch bg-[var(--line)]" />
          <StatTile label="Down" value={formatBitsPerSecond(wan?.rxRateBytes ?? null)} size="md" />
          <StatTile label="Up" value={formatBitsPerSecond(wan?.txRateBytes ?? null)} size="md" accent="magenta" />
          <div className="relative w-16 h-6 self-center">
            <Sparkline values={rxHistory} color="var(--cyan)" height={24} className="absolute inset-0" />
            <Sparkline values={txHistory} color="var(--magenta)" height={24} className="absolute inset-0" />
          </div>
          <StatTile
            label="Latency"
            value={wan?.latencySeconds != null ? `${Math.round(wan.latencySeconds * 1000)}ms` : "--"}
          />
          <StatTile label="Uptime" value={formatUptime(wan?.uptimeSeconds ?? null)} accent="yellow" />
        </div>
      </HudPanel>

      <HudPanel title="Devices" className="flex-1 min-h-0">
        <DeviceGrid devices={snapshot?.devices ?? []} />
      </HudPanel>
    </div>
  );
}
