export function formatBitsPerSecond(bytesPerSecond: number | null): string {
  if (bytesPerSecond === null) return "--";

  const bits = bytesPerSecond * 8;
  const units = ["bps", "Kbps", "Mbps", "Gbps"];
  let value = bits;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatUptime(seconds: number | null): string {
  if (seconds === null || seconds < 0) return "--";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatPercent(ratio: number | null): string {
  if (ratio === null) return "--";
  return `${Math.round(ratio * 100)}%`;
}

export function formatTemperature(celsius: number | null): string {
  if (celsius === null) return "--";
  return `${Math.round(celsius)}°C`;
}

export function formatMbps(mbps: number | null): string {
  if (mbps === null) return "--";
  return `${mbps.toFixed(1)} Mbps`;
}
