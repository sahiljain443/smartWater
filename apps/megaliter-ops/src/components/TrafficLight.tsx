const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; pulse?: boolean }> = {
  green:   { color: "bg-green-500", bg: "bg-green-50 border-green-200", label: "Healthy" },
  amber:   { color: "bg-yellow-500", bg: "bg-yellow-50 border-yellow-200", label: "Warning", pulse: true },
  red:     { color: "bg-red-500", bg: "bg-red-50 border-red-200", label: "Critical", pulse: true },
  offline: { color: "bg-gray-400", bg: "bg-gray-50 border-gray-200", label: "Offline" },
};

export function TrafficLight({ status, size = "md" }: { status: string; size?: "sm" | "md" | "lg" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const sizes = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-6 h-6" };

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`${sizes[size]} rounded-full ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`} />
      <span className="text-sm font-medium text-gray-700">{cfg.label}</span>
    </span>
  );
}

export function TrafficLightBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bg}`}>
      <span className={`w-3 h-3 rounded-full ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`} />
      <span className="text-sm font-semibold">{cfg.label}</span>
    </div>
  );
}
