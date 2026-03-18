import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { TrafficLightBadge } from "../components/TrafficLight";
import { SensorGrid, SensorSummaryBar } from "../components/SensorGrid";
import { SensorChart } from "../components/SensorChart";
import { ProcessFlowDiagram } from "../components/ProcessFlowDiagram";

type TabId = "sensors" | "alerts" | "workorders" | "logbook" | "assets";

const TABS: { id: TabId; label: string }[] = [
  { id: "sensors", label: "Live Sensors" },
  { id: "alerts", label: "Alerts" },
  { id: "workorders", label: "Work Orders" },
  { id: "logbook", label: "Logbook" },
  { id: "assets", label: "Assets" },
];

export function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("sensors");
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);

  const { data: siteData } = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => api.getSite(siteId!),
    enabled: !!siteId,
  });

  const { data: sensorsData, isLoading: sensorsLoading } = useQuery({
    queryKey: ["liveSensors", siteId],
    queryFn: () => api.getLiveSensors(siteId!),
    enabled: !!siteId,
    refetchInterval: 3000,
  });

  const { data: kpisData } = useQuery({
    queryKey: ["kpis", siteId],
    queryFn: () => api.getSiteKPIs(siteId!),
    enabled: !!siteId,
    refetchInterval: 30000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ["alerts", siteId],
    queryFn: () => api.getAlerts(siteId!),
    enabled: !!siteId && activeTab === "alerts",
  });

  const { data: workOrdersData } = useQuery({
    queryKey: ["workOrders", siteId],
    queryFn: () => api.getWorkOrders(siteId!),
    enabled: !!siteId && activeTab === "workorders",
  });

  const { data: logbookData } = useQuery({
    queryKey: ["logbook", siteId],
    queryFn: () => api.getLogbook(siteId!),
    enabled: !!siteId && activeTab === "logbook",
  });

  const { data: assetsData } = useQuery({
    queryKey: ["assets", siteId],
    queryFn: () => api.getAssets(siteId!),
    enabled: !!siteId && activeTab === "assets",
  });

  const site = siteData?.site;
  const sensors = sensorsData?.sensors || [];
  const selectedSensor = sensors.find((s: any) => s.sensor_id === selectedSensorId);

  // Derive KPIs from sensor data
  const flowIn = sensors.find((s: any) => s.process_stage === "inlet" && s.sensor_type === "flow_rate");
  const flowOut = sensors.find((s: any) => s.process_stage === "outlet" && s.sensor_type === "flow_rate");
  const power = sensors.find((s: any) => s.sensor_type === "motor_power");

  const kpis = [
    {
      label: "Inlet Flow",
      value: flowIn?.value != null ? `${Number(flowIn.value).toFixed(1)}` : "—",
      unit: "m3/h",
      color: "text-blue-600",
    },
    {
      label: "Outlet Flow",
      value: flowOut?.value != null ? `${Number(flowOut.value).toFixed(1)}` : "—",
      unit: "m3/h",
      color: "text-green-600",
    },
    {
      label: "Recovery Rate",
      value: flowIn?.value && flowOut?.value
        ? `${((Number(flowOut.value) / Number(flowIn.value)) * 100).toFixed(0)}`
        : "—",
      unit: "%",
      color: "text-emerald-600",
    },
    {
      label: "Power",
      value: power?.value != null ? `${Number(power.value).toFixed(1)}` : "—",
      unit: "kW",
      color: "text-orange-600",
    },
    {
      label: "Sensors Online",
      value: `${sensors.filter((s: any) => s.value !== null).length}/${sensors.length}`,
      unit: "",
      color: "text-gray-700",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link to="/" className="text-water-600 hover:text-water-700 text-sm">
          &larr; All Sites
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{site?.name || "Loading..."}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {site?.society_name} &middot; {site?.capacity_kld} KLD &middot; {site?.technology_type}
            </p>
          </div>
          {site && <TrafficLightBadge status={site.health_status} />}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${kpi.color}`}>
              {kpi.value}
              {kpi.unit && <span className="text-xs font-normal text-gray-400 ml-1">{kpi.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Process Flow Diagram */}
      {sensors.length > 0 && <ProcessFlowDiagram sensors={sensors} />}

      {/* Sensor Summary Bar */}
      {sensors.length > 0 && (
        <div className="flex items-center justify-between">
          <SensorSummaryBar sensors={sensors} />
          <span className="text-xs text-gray-400">Auto-refreshing every 3s</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-water-600 text-water-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "sensors" && (
        <div className="space-y-6">
          {sensorsLoading ? (
            <div className="text-gray-500">Loading sensors...</div>
          ) : (
            <SensorGrid
              sensors={sensors}
              selectedSensorId={selectedSensorId}
              onSensorClick={(s) => setSelectedSensorId(
                s.sensor_id === selectedSensorId ? null : s.sensor_id
              )}
            />
          )}

          {/* Chart for selected sensor */}
          {selectedSensor && siteId && (
            <SensorChart
              siteId={siteId}
              sensorId={selectedSensor.sensor_id}
              sensorName={selectedSensor.name}
              unit={selectedSensor.unit}
              minThreshold={selectedSensor.min_threshold}
              maxThreshold={selectedSensor.max_threshold}
            />
          )}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">Severity</th>
                <th className="px-4 py-3 text-left text-gray-600">Message</th>
                <th className="px-4 py-3 text-left text-gray-600">Sensor</th>
                <th className="px-4 py-3 text-left text-gray-600">Value</th>
                <th className="px-4 py-3 text-left text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {alertsData?.alerts.map((alert: any) => (
                <tr key={alert.id} className="border-t">
                  <td className="px-4 py-3">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{alert.message}</td>
                  <td className="px-4 py-3 text-gray-500">{alert.sensor_type || "—"}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">
                    {alert.value != null ? Number(alert.value).toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(alert.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!alertsData?.alerts || alertsData.alerts.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No alerts recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "workorders" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">Title</th>
                <th className="px-4 py-3 text-left text-gray-600">Priority</th>
                <th className="px-4 py-3 text-left text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-gray-600">Assigned To</th>
                <th className="px-4 py-3 text-left text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody>
              {workOrdersData?.workOrders.map((wo: any) => (
                <tr key={wo.id} className="border-t">
                  <td className="px-4 py-3 text-gray-700 font-medium">{wo.title}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={wo.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={wo.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{wo.assigned_to_name || "Unassigned"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(wo.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!workOrdersData?.workOrders || workOrdersData.workOrders.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No work orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "logbook" && (
        <div className="space-y-3">
          {logbookData?.entries.map((entry: any) => (
            <div key={entry.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{entry.author_name}</span>
                  <ShiftBadge shift={entry.shift_type} />
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{entry.content}</p>
            </div>
          ))}
          {(!logbookData?.entries || logbookData.entries.length === 0) && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
              No logbook entries yet
            </div>
          )}
        </div>
      )}

      {activeTab === "assets" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-gray-600">Category</th>
                <th className="px-4 py-3 text-left text-gray-600">Make / Model</th>
                <th className="px-4 py-3 text-left text-gray-600">Process Stage</th>
                <th className="px-4 py-3 text-left text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {assetsData?.assets.map((asset: any) => (
                <tr key={asset.id} className="border-t">
                  <td className="px-4 py-3 text-gray-700 font-medium">{asset.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{asset.make} {asset.model}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{asset.process_stage}</td>
                  <td className="px-4 py-3"><AssetStatusBadge status={asset.status} /></td>
                </tr>
              ))}
              {(!assetsData?.assets || assetsData.assets.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No assets registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-100 text-blue-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[severity] || styles.info}`}>{severity}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-600",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[priority] || styles.low}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    assigned: "bg-purple-100 text-purple-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    verified: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>{status.replace("_", " ")}</span>;
}

function ShiftBadge({ shift }: { shift: string }) {
  const styles: Record<string, string> = {
    morning: "bg-amber-100 text-amber-700",
    afternoon: "bg-sky-100 text-sky-700",
    night: "bg-indigo-100 text-indigo-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${styles[shift] || "bg-gray-100 text-gray-600"}`}>{shift}</span>;
}

function AssetStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    operational: "bg-green-100 text-green-700",
    maintenance: "bg-yellow-100 text-yellow-700",
    faulty: "bg-red-100 text-red-700",
    decommissioned: "bg-gray-100 text-gray-500",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.operational}`}>{status}</span>;
}
