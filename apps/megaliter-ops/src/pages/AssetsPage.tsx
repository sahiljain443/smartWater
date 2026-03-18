import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const STATUS_STYLES: Record<string, string> = {
  operational: "bg-green-100 text-green-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  faulty: "bg-red-100 text-red-700",
  decommissioned: "bg-gray-100 text-gray-500",
};

const CATEGORY_ICONS: Record<string, string> = {
  pump: "P",
  blower: "B",
  membrane: "M",
  filter: "F",
  motor: "E",
  valve: "V",
  sensor: "S",
  panel: "C",
  other: "O",
};

export function AssetsPage() {
  const { data: sitesData } = useQuery({ queryKey: ["sites"], queryFn: api.getSites });
  const sites = sitesData?.sites || [];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Asset Registry — All Sites</h2>
      {sites.map((site: any) => (
        <SiteAssets key={site.id} site={site} />
      ))}
    </div>
  );
}

function SiteAssets({ site }: { site: any }) {
  const { data } = useQuery({
    queryKey: ["assets", site.id],
    queryFn: () => api.getAssets(site.id),
  });

  const assets = data?.assets || [];
  if (assets.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <div>
          <Link to={`/sites/${site.id}`} className="font-semibold text-water-700 hover:underline text-sm">
            {site.name}
          </Link>
          <span className="text-xs text-gray-400 ml-2">{site.society_name}</span>
        </div>
        <span className="text-xs text-gray-500">{assets.length} assets</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {assets.map((asset: any) => (
          <div key={asset.id} className="border rounded-lg p-3 hover:border-water-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-water-100 text-water-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {CATEGORY_ICONS[asset.category] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{asset.name}</p>
                <p className="text-xs text-gray-500">{asset.make} {asset.model}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400 capitalize">{asset.process_stage}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_STYLES[asset.status] || STATUS_STYLES.operational}`}>
                    {asset.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
