export interface SiteOverview {
  clientsWired: number;
  clientsWireless: number;
  guests: number;
  accessPoints: number;
  gateways: number;
  switches: number;
  disconnected: number;
}

export interface WanStatus {
  rxRateBytes: number | null;
  txRateBytes: number | null;
  latencySeconds: number | null;
  uptimeSeconds: number | null;
  speedtestDownMbps: number | null;
  speedtestUpMbps: number | null;
  speedtestPingMs: number | null;
}

export interface DeviceStatus {
  key: string;
  name: string;
  type: string;
  model: string | null;
  ip: string | null;
  uptimeSeconds: number | null;
  cpuRatio: number | null;
  memRatio: number | null;
  temperatureCelsius: number | null;
  stationCount: number | null;
}

export interface MetricsSnapshot {
  fetchedAt: string;
  controllerReachable: boolean;
  site: SiteOverview | null;
  wan: WanStatus | null;
  devices: DeviceStatus[];
}
