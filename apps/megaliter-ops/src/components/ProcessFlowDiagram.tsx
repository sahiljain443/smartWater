interface Sensor {
  sensor_id: string;
  sensor_type: string;
  name: string;
  unit: string;
  value: number | null;
  process_stage: string;
  min_threshold: number;
  max_threshold: number;
}

function getColor(sensor: Sensor | undefined): string {
  if (!sensor || sensor.value === null) return "#9CA3AF";
  const v = Number(sensor.value);
  if (v > Number(sensor.max_threshold) || v < Number(sensor.min_threshold)) return "#EF4444";
  const range = Number(sensor.max_threshold) - Number(sensor.min_threshold);
  if (v > Number(sensor.max_threshold) - range * 0.1 || v < Number(sensor.min_threshold) + range * 0.1) return "#F59E0B";
  return "#22C55E";
}

function val(sensor: Sensor | undefined): string {
  if (!sensor || sensor.value === null) return "—";
  return `${Number(sensor.value).toFixed(1)} ${sensor.unit}`;
}

interface Props {
  sensors: Sensor[];
}

export function ProcessFlowDiagram({ sensors }: Props) {
  const byStageType = (stage: string, type: string) =>
    sensors.find((s) => s.process_stage === stage && s.sensor_type === type);

  const stages = [
    {
      id: "inlet",
      label: "Inlet / Collection",
      icon: "🔽",
      readings: [
        { label: "Flow", sensor: byStageType("inlet", "flow_rate") },
        { label: "pH", sensor: byStageType("inlet", "ph") },
        { label: "TDS", sensor: byStageType("inlet", "tds") },
      ],
    },
    {
      id: "collection",
      label: "Collection Tank",
      icon: "🪣",
      readings: [
        { label: "Level", sensor: byStageType("collection", "level") },
      ],
    },
    {
      id: "pumping",
      label: "Pumping",
      icon: "⚡",
      readings: [
        { label: "Current", sensor: byStageType("pumping", "motor_current") },
        { label: "Power", sensor: byStageType("pumping", "motor_power") },
      ],
    },
    {
      id: "aeration",
      label: "Aeration",
      icon: "💨",
      readings: [
        { label: "DO", sensor: byStageType("aeration", "dissolved_oxygen") },
      ],
    },
    {
      id: "filtration",
      label: "Filtration",
      icon: "🔬",
      readings: [
        { label: "Pressure", sensor: byStageType("filtration", "pressure") },
      ],
    },
    {
      id: "outlet",
      label: "Treated Output",
      icon: "✅",
      readings: [
        { label: "Flow", sensor: byStageType("outlet", "flow_rate") },
        { label: "pH", sensor: byStageType("outlet", "ph") },
        { label: "TDS", sensor: byStageType("outlet", "tds") },
        { label: "Turbidity", sensor: byStageType("outlet", "turbidity") },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">STP Process Flow</h3>
      <div className="flex items-start gap-1 overflow-x-auto pb-2">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center">
            <div className="flex flex-col items-center min-w-[130px]">
              <div className="text-2xl mb-1">{stage.icon}</div>
              <div className="text-xs font-semibold text-gray-700 mb-2">{stage.label}</div>
              <div className="bg-gray-50 rounded border border-gray-200 p-2 w-full space-y-1">
                {stage.readings.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-500">{r.label}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getColor(r.sensor) }} />
                      <span className="text-[10px] font-mono font-medium">{val(r.sensor)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className="text-gray-300 text-lg px-1 mt-6">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
