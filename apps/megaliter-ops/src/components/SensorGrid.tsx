interface Sensor {
  sensor_id: string;
  sensor_type: string;
  name: string;
  unit: string;
  value: number | null;
  quality: string | null;
  min_threshold: number;
  max_threshold: number;
  process_stage: string;
  time: string | null;
}

function getSensorStatus(sensor: Sensor): "normal" | "warning" | "critical" | "offline" {
  if (sensor.value === null) return "offline";
  const v = Number(sensor.value);
  const min = Number(sensor.min_threshold);
  const max = Number(sensor.max_threshold);
  const range = max - min;

  if (v > max || v < min) return "critical";
  if (v > max - range * 0.1 || v < min + range * 0.1) return "warning";
  return "normal";
}

const STATUS_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  normal:   { border: "border-green-200", bg: "bg-green-50", icon: "bg-green-500" },
  warning:  { border: "border-yellow-200", bg: "bg-yellow-50", icon: "bg-yellow-500" },
  critical: { border: "border-red-200", bg: "bg-red-50", icon: "bg-red-500" },
  offline:  { border: "border-gray-200", bg: "bg-gray-50", icon: "bg-gray-400" },
};

const STAGE_LABELS: Record<string, string> = {
  inlet: "Inlet",
  outlet: "Outlet",
  aeration: "Aeration",
  filtration: "Filtration",
  pumping: "Pumping",
  collection: "Collection",
  disinfection: "Disinfection",
};

interface Props {
  sensors: Sensor[];
  onSensorClick?: (sensor: Sensor) => void;
  selectedSensorId?: string | null;
}

export function SensorGrid({ sensors, onSensorClick, selectedSensorId }: Props) {
  // Group by process stage
  const grouped = sensors.reduce<Record<string, Sensor[]>>((acc, s) => {
    const stage = s.process_stage || "other";
    (acc[stage] = acc[stage] || []).push(s);
    return acc;
  }, {});

  const stageOrder = ["inlet", "aeration", "filtration", "pumping", "collection", "outlet"];
  const sortedStages = Object.keys(grouped).sort(
    (a, b) => (stageOrder.indexOf(a) === -1 ? 99 : stageOrder.indexOf(a)) - (stageOrder.indexOf(b) === -1 ? 99 : stageOrder.indexOf(b))
  );

  return (
    <div className="space-y-6">
      {sortedStages.map((stage) => (
        <div key={stage}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            {STAGE_LABELS[stage] || stage}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {grouped[stage].map((sensor) => {
              const status = getSensorStatus(sensor);
              const style = STATUS_STYLES[status];
              const isSelected = selectedSensorId === sensor.sensor_id;
              return (
                <button
                  key={sensor.sensor_id}
                  onClick={() => onSensorClick?.(sensor)}
                  className={`text-left rounded-lg border p-3 transition-all ${style.border} ${
                    isSelected ? "ring-2 ring-water-500 shadow-md" : "hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 truncate">{sensor.name}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${style.icon} flex-shrink-0`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {sensor.value !== null ? Number(sensor.value).toFixed(1) : "—"}
                    </span>
                    <span className="text-xs text-gray-500">{sensor.unit}</span>
                  </div>
                  {sensor.time && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(sensor.time).toLocaleTimeString()}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SensorSummaryBar({ sensors }: { sensors: Sensor[] }) {
  const counts = { normal: 0, warning: 0, critical: 0, offline: 0 };
  sensors.forEach((s) => counts[getSensorStatus(s)]++);

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        {counts.normal} Normal
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        {counts.warning} Warning
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        {counts.critical} Critical
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        {counts.offline} Offline
      </span>
    </div>
  );
}
