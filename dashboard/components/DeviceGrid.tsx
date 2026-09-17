import type { DeviceStatus } from "@/lib/types";
import { formatPercent, formatTemperature, formatUptime } from "@/lib/format";

interface DeviceGridProps {
  devices: DeviceStatus[];
}

function healthAccent(cpuRatio: number | null): string {
  if (cpuRatio === null) return "text-[var(--text-dim)]";
  if (cpuRatio > 0.85) return "text-glow-red";
  if (cpuRatio > 0.6) return "text-[var(--yellow)]";
  return "text-glow-cyan";
}

export function DeviceGrid({ devices }: DeviceGridProps) {
  if (devices.length === 0) {
    return <p className="text-[var(--text-dim)] text-xs">No devices reporting.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-full content-start">
      {devices.map((device) => (
        <div
          key={device.key}
          className="border border-[var(--line)] bg-black/30 px-4 py-3 flex flex-col gap-2 min-w-0"
        >
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-sm font-bold uppercase truncate">{device.name}</span>
            <span className="text-[10px] text-[var(--text-dim)] uppercase shrink-0">{device.type}</span>
          </div>
          <div className="flex items-baseline justify-between text-xs gap-1">
            <span className={healthAccent(device.cpuRatio)}>CPU {formatPercent(device.cpuRatio)}</span>
            <span className="text-[var(--text-dim)]">MEM {formatPercent(device.memRatio)}</span>
          </div>
          <div className="flex items-baseline justify-between text-xs text-[var(--text-dim)] gap-1">
            <span>{formatTemperature(device.temperatureCelsius)}</span>
            <span>UP {formatUptime(device.uptimeSeconds)}</span>
            {device.stationCount !== null && <span>{device.stationCount} sta</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
