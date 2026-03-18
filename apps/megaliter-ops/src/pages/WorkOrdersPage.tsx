import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export function WorkOrdersPage() {
  const { data: sitesData } = useQuery({ queryKey: ["sites"], queryFn: api.getSites });
  const sites = sitesData?.sites || [];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Work Orders — All Sites</h2>
      {sites.map((site: any) => (
        <SiteWorkOrders key={site.id} site={site} />
      ))}
    </div>
  );
}

function SiteWorkOrders({ site }: { site: any }) {
  const { data } = useQuery({
    queryKey: ["workOrders", site.id],
    queryFn: () => api.getWorkOrders(site.id),
  });

  const orders = data?.workOrders || [];
  if (orders.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <Link to={`/sites/${site.id}`} className="font-semibold text-water-700 hover:underline text-sm">
          {site.name}
        </Link>
        <span className="text-xs text-gray-400 ml-2">{site.society_name}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs border-b">
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Priority</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Assigned</th>
            <th className="px-4 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((wo: any) => (
            <tr key={wo.id} className="border-t">
              <td className="px-4 py-2.5 text-gray-700">{wo.title}</td>
              <td className="px-4 py-2.5">
                <Badge text={wo.priority} type={wo.priority} />
              </td>
              <td className="px-4 py-2.5">
                <Badge text={wo.status.replace("_", " ")} type={wo.status === "completed" || wo.status === "verified" ? "green" : "default"} />
              </td>
              <td className="px-4 py-2.5 text-gray-500">{wo.assigned_to_name || "—"}</td>
              <td className="px-4 py-2.5 text-gray-400 text-xs">{new Date(wo.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ text, type }: { text: string; type: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-600",
    green: "bg-green-100 text-green-700",
    default: "bg-blue-100 text-blue-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${styles[type] || styles.default}`}>{text}</span>;
}
