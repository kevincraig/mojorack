export interface PrometheusSample {
  metric: Record<string, string>;
  value: [number, string];
}

interface PrometheusQueryResponse {
  status: "success" | "error";
  data?: {
    resultType: string;
    result: PrometheusSample[];
  };
  error?: string;
}

const PROMETHEUS_URL = process.env.PROMETHEUS_URL ?? "http://localhost:9090";

export async function queryPrometheus(promql: string): Promise<PrometheusSample[]> {
  const url = new URL("/api/v1/query", PROMETHEUS_URL);
  url.searchParams.set("query", promql);

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Prometheus query failed (${response.status}): ${promql}`);
  }

  const payload = (await response.json()) as PrometheusQueryResponse;

  if (payload.status !== "success" || !payload.data) {
    throw new Error(payload.error ?? `Prometheus returned an error for: ${promql}`);
  }

  return payload.data.result;
}

export function firstValue(samples: PrometheusSample[]): number | null {
  const sample = samples[0];
  if (!sample) return null;
  const value = Number(sample.value[1]);
  return Number.isFinite(value) ? value : null;
}

export function sumValues(samples: PrometheusSample[]): number {
  return samples.reduce((total, sample) => total + (Number(sample.value[1]) || 0), 0);
}
