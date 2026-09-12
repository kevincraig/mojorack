import type { DeviceStatus } from "@/lib/types";
import { HudPanel } from "@/components/HudPanel";
import { DeviceGrid } from "@/components/DeviceGrid";

interface DevicesPageProps {
  devices: DeviceStatus[];
}

export function DevicesPage({ devices }: DevicesPageProps) {
  return (
    <div className="h-full px-1">
      <HudPanel title="Devices" className="h-full">
        <DeviceGrid devices={devices} />
      </HudPanel>
    </div>
  );
}
