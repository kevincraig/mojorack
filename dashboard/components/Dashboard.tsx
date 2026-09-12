"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import type { MetricsSnapshot } from "@/lib/types";
import { PageDots } from "@/components/PageDots";
import { OverviewPage } from "@/components/pages/OverviewPage";
import { DevicesPage } from "@/components/pages/DevicesPage";
import { ComingSoonPage } from "@/components/pages/ComingSoonPage";

const POLL_INTERVAL_MS = 15_000;
const HISTORY_LENGTH = 40;
const ROTATE_INTERVAL_MS = 25_000;
const SWIPE_THRESHOLD_PX = 40;
const PAGE_COUNT = 3;

export function Dashboard() {
  const [snapshot, setSnapshot] = useState<MetricsSnapshot | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [rxHistory, setRxHistory] = useState<number[]>([]);
  const [txHistory, setTxHistory] = useState<number[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

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

  // Restarts on every page change (auto or manual) so a swipe always buys a
  // full interval before the next auto-advance, instead of being cut short.
  useEffect(() => {
    const timer = setInterval(() => {
      setPageIndex((i) => (i + 1) % PAGE_COUNT);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pageIndex]);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (deltaX > SWIPE_THRESHOLD_PX) {
      setPageIndex((i) => (i - 1 + PAGE_COUNT) % PAGE_COUNT);
    } else if (deltaX < -SWIPE_THRESHOLD_PX) {
      setPageIndex((i) => (i + 1) % PAGE_COUNT);
    }
  }

  const online = snapshot?.controllerReachable ?? false;
  const site = snapshot?.site ?? null;
  const wan = snapshot?.wan ?? null;

  return (
    <div className="hud-grid-bg flex flex-col h-full w-full p-2 gap-1 overflow-hidden">
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

      <div
        className="relative flex-1 min-h-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {[
          <OverviewPage key="overview" site={site} wan={wan} rxHistory={rxHistory} txHistory={txHistory} />,
          <DevicesPage key="devices" devices={snapshot?.devices ?? []} />,
          <ComingSoonPage key="more" />,
        ].map((page, i) => (
          <div
            key={page.key}
            className="absolute inset-0 h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${(i - pageIndex) * 100}%)` }}
          >
            {page}
          </div>
        ))}
      </div>

      <PageDots count={PAGE_COUNT} active={pageIndex} onSelect={setPageIndex} />
    </div>
  );
}
