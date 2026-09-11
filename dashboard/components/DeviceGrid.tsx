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
    return <p className="text-[var(--text-dim)] text-sm">No devices reporting.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-full pr-1">
      {devices.map((device) => (
        <div
          key={device.key}
          className="border border-[var(--line)] bg-black/30 px-3 py-2 flex flex-col gap-1"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-bold uppercase truncate">{device.name}</span>
            <span className="text-[10px] text-[var(--text-dim)] uppercase">{device.type}</span>
          </div>
          <div className="flex items-baseline justify-between text-[11px]">
            <span className={healthAccent(device.cpuRatio)}>
              CPU {formatPercent(device.cpuRatio)}
            </span>
            <span className="text-[var(--text-dim)]">MEM {formatPercent(device.memRatio)}</span>
          </div>
          <div className="flex items-baseline justify-between text-[11px] text-[var(--text-dim)]">
            <span>{formatTemperature(device.temperatureCelsius)}</span>
            <span>UP {formatUptime(device.uptimeSeconds)}</span>
            {device.stationCount !== null && <span>{device.stationCount} sta</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
