"use client";

import { useEffect, useState } from "react";
import type { MetricsSnapshot } from "@/lib/types";
import { formatBitsPerSecond, formatMbps, formatUptime } from "@/lib/format";
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
    <div className="hud-grid-bg flex flex-col h-full w-full p-4 gap-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-lg font-black tracking-[0.4em] text-glow-cyan hud-flicker">
          MOJORACK // NETCTRL
        </h1>
        <div className="flex items-center gap-4 text-xs">
          <span className={online ? "text-glow-cyan" : "text-glow-red"}>
            {online ? "● CONTROLLER LINK OK" : "● CONTROLLER LINK LOST"}
          </span>
          <span className="font-hud text-[var(--text-dim)]">
            {now ? now.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4 flex-[3] min-h-0">
        <HudPanel title="Site Overview" className="col-span-1">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-baseline gap-6">
              <StatTile label="Wired" value={String(site?.clientsWired ?? "--")} size="hero" />
              <StatTile
                label="Wireless"
                value={String(site?.clientsWireless ?? "--")}
                size="hero"
                accent="magenta"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--line)]">
              <StatTile label="Guests" value={String(site?.guests ?? "--")} accent="magenta" size="lg" />
              <StatTile
                label="Disconnected"
                value={String(site?.disconnected ?? "--")}
                accent="yellow"
                size="lg"
              />
              <StatTile label="Access Points" value={String(site?.accessPoints ?? "--")} size="lg" />
              <StatTile label="Gateways" value={String(site?.gateways ?? "--")} size="lg" />
              <StatTile label="Switches" value={String(site?.switches ?? "--")} size="lg" />
            </div>
          </div>
        </HudPanel>

        <HudPanel title="WAN Uplink" accent="magenta" className="col-span-1">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-baseline gap-6">
              <StatTile label="Download" value={formatBitsPerSecond(wan?.rxRateBytes ?? null)} size="hero" />
              <StatTile
                label="Upload"
                value={formatBitsPerSecond(wan?.txRateBytes ?? null)}
                accent="magenta"
                size="hero"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--line)]">
              <StatTile
                label="Internet Uptime"
                value={formatUptime(wan?.uptimeSeconds ?? null)}
                accent="yellow"
                size="lg"
              />
              <StatTile
                label="Latency"
                value={wan?.latencySeconds != null ? `${Math.round(wan.latencySeconds * 1000)} ms` : "--"}
                size="lg"
              />
              <StatTile label="Last Speedtest ↓" value={formatMbps(wan?.speedtestDownMbps ?? null)} />
              <StatTile label="Last Speedtest ↑" value={formatMbps(wan?.speedtestUpMbps ?? null)} />
            </div>
          </div>
        </HudPanel>

        <HudPanel title="Devices" className="col-span-1">
          <DeviceGrid devices={snapshot?.devices ?? []} />
        </HudPanel>
      </div>

      <HudPanel title="WAN Throughput History" className="flex-1 min-h-0">
        <div className="flex flex-col h-full justify-center gap-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-glow-cyan">● DOWN {formatBitsPerSecond(wan?.rxRateBytes ?? null)}</span>
            <span className="text-glow-magenta">● UP {formatBitsPerSecond(wan?.txRateBytes ?? null)}</span>
          </div>
          <div className="relative flex-1 min-h-[60px]">
            <div className="absolute inset-0">
              <Sparkline values={rxHistory} color="var(--cyan)" height={80} fill className="absolute inset-0" />
            </div>
            <div className="absolute inset-0">
              <Sparkline values={txHistory} color="var(--magenta)" height={80} fill className="absolute inset-0" />
            </div>
          </div>
        </div>
      </HudPanel>

      <footer className="text-[10px] text-[var(--text-dim)] tracking-widest uppercase">
        Last sync: {snapshot ? new Date(snapshot.fetchedAt).toLocaleTimeString([], { hour12: false }) : "--"}
      </footer>
    </div>
  );
}
