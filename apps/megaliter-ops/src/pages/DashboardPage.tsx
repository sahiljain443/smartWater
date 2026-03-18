import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const HEALTH_COLORS: Record<string, string> = {
  green: "bg-green-500",
  amber: "bg-yellow-500",
  red: "bg-red-500",
  offline: "bg-gray-400",
};

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Operations Dashboard</h2>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total Sites" value={data?.sites.length ?? "—"} />
        <KPICard
          label="Healthy"
          value={data?.sites.filter((s: any) => s.health_status === "green").length ?? "—"}
          color="text-green-600"
        />
        <KPICard
          label="Warnings"
          value={data?.sites.filter((s: any) => s.health_status === "amber").length ?? "—"}
          color="text-yellow-600"
        />
        <KPICard
          label="Critical"
          value={data?.sites.filter((s: any) => ["red", "offline"].includes(s.health_status)).length ?? "—"}
          color="text-red-600"
        />
      </div>

      {/* Site List */}
      {isLoading && <p className="text-gray-500">Loading sites...</p>}
      {error && <p className="text-red-600">Failed to load sites: {(error as Error).message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.sites.map((site: any) => (
          <Link
            key={site.id}
            to={`/sites/${site.id}`}
            className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{site.name}</h3>
              <span className={`w-3 h-3 rounded-full ${HEALTH_COLORS[site.health_status] || "bg-gray-400"}`} />
            </div>
            <p className="text-sm text-gray-500">{site.society_name}</p>
            <div className="mt-3 flex justify-between text-sm text-gray-600">
              <span>{site.capacity_kld} KLD</span>
              <span>{site.technology_type}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function KPICard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || "text-gray-900"}`}>{value}</p>
    </div>
  );
}
