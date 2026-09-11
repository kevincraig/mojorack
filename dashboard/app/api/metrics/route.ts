import { NextResponse } from "next/server";
import {
  firstValue,
  queryPrometheus,
  sumValues,
  type PrometheusSample,
} from "@/lib/prometheus";
import type { DeviceStatus, MetricsSnapshot, SiteOverview, WanStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function sampleFor(samples: PrometheusSample[], name: string): PrometheusSample | undefined {
  return samples.find((sample) => sample.metric.name === name);
}

function numberFor(samples: PrometheusSample[], name: string): number | null {
  const sample = sampleFor(samples, name);
  if (!sample) return null;
  const value = Number(sample.value[1]);
  return Number.isFinite(value) ? value : null;
}

function sumFor(samples: PrometheusSample[], name: string): number {
  return samples
    .filter((sample) => sample.metric.name === name)
    .reduce((total, sample) => total + (Number(sample.value[1]) || 0), 0);
}

export async function GET() {
  try {
    const [
      controllerInfo,
      lanUsers,
      wlanUsers,
      guests,
      aps,
      gateways,
      switches,
      disconnected,
      wanRx,
      wanTx,
      wanLatency,
      wanUptime,
      speedDown,
      speedUp,
      speedPing,
      deviceInfo,
      deviceUptime,
      deviceCpu,
      deviceMem,
      deviceTemp,
      deviceStations,
    ] = await Promise.all([
      queryPrometheus("unpoller_controller_info"),
      queryPrometheus('unpoller_site_users{subsystem="lan"}'),
      queryPrometheus('unpoller_site_users{subsystem="wlan"}'),
      queryPrometheus("unpoller_site_guests"),
      queryPrometheus('unpoller_site_aps{subsystem="wlan"}'),
      queryPrometheus('unpoller_site_gateways{subsystem="wan"}'),
      queryPrometheus('unpoller_site_switches{subsystem="lan"}'),
      queryPrometheus("unpoller_site_disconnected"),
      queryPrometheus('unpoller_site_receive_rate_bytes{subsystem="www"}'),
      queryPrometheus('unpoller_site_transmit_rate_bytes{subsystem="www"}'),
      queryPrometheus('unpoller_site_latency_seconds{subsystem="www"}'),
      queryPrometheus('unpoller_site_uptime_seconds{subsystem="www"}'),
      queryPrometheus("unpoller_site_xput_down_rate"),
      queryPrometheus("unpoller_site_xput_up_rate"),
      queryPrometheus("unpoller_site_speedtest_ping"),
      queryPrometheus("unpoller_device_info"),
      queryPrometheus("unpoller_device_uptime_seconds"),
      queryPrometheus("unpoller_device_cpu_utilization_ratio"),
      queryPrometheus("unpoller_device_memory_utilization_ratio"),
      queryPrometheus("unpoller_device_temperature_celsius"),
      queryPrometheus("unpoller_device_stations"),
    ]);

    const controllerReachable = controllerInfo.length > 0;

    const site: SiteOverview | null = controllerReachable
      ? {
          clientsWired: sumValues(lanUsers),
          clientsWireless: sumValues(wlanUsers),
          guests: sumValues(guests),
          accessPoints: sumValues(aps),
          gateways: sumValues(gateways),
          switches: sumValues(switches),
          disconnected: sumValues(disconnected),
        }
      : null;

    const wan: WanStatus | null = controllerReachable
      ? {
          rxRateBytes: firstValue(wanRx),
          txRateBytes: firstValue(wanTx),
          latencySeconds: firstValue(wanLatency),
          uptimeSeconds: firstValue(wanUptime),
          speedtestDownMbps: firstValue(speedDown),
          speedtestUpMbps: firstValue(speedUp),
          speedtestPingMs: firstValue(speedPing),
        }
      : null;

    const devices: DeviceStatus[] = deviceInfo.map((sample) => {
      const name = sample.metric.name ?? "unknown";
      const type = sample.metric.type ?? "unknown";

      // "stations" means directly-associated wireless clients for an AP, but
      // for switches/gateways unpoller reports port-activity or network-wide
      // totals under the same metric — not a comparable per-device count.
      const isAccessPoint = type === "uap";

      return {
        key: `${type}-${name}`,
        name,
        type,
        model: sample.metric.model ?? null,
        ip: sample.metric.ip ?? null,
        uptimeSeconds: numberFor(deviceUptime, name),
        cpuRatio: numberFor(deviceCpu, name),
        memRatio: numberFor(deviceMem, name),
        temperatureCelsius: numberFor(deviceTemp, name),
        stationCount:
          isAccessPoint && deviceStations.some((s) => s.metric.name === name)
            ? sumFor(deviceStations, name)
            : null,
      };
    });

    const snapshot: MetricsSnapshot = {
      fetchedAt: new Date().toISOString(),
      controllerReachable,
      site,
      wan,
      devices,
    };

    return NextResponse.json(snapshot);
  } catch (error) {
    const snapshot: MetricsSnapshot = {
      fetchedAt: new Date().toISOString(),
      controllerReachable: false,
      site: null,
      wan: null,
      devices: [],
    };

    console.error("Failed to build metrics snapshot:", error);

    return NextResponse.json(snapshot, { status: 502 });
  }
}
