import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export function LogbookPage() {
  const { data: sitesData } = useQuery({ queryKey: ["sites"], queryFn: api.getSites });
  const sites = sitesData?.sites || [];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Digital Logbook — All Sites</h2>
      {sites.map((site: any) => (
        <SiteLogbook key={site.id} site={site} />
      ))}
      {sites.length > 0 && sites.every((s: any) => <NoEntriesCheck siteId={s.id} />)}
    </div>
  );
}

function SiteLogbook({ site }: { site: any }) {
  const { data } = useQuery({
    queryKey: ["logbook", site.id],
    queryFn: () => api.getLogbook(site.id),
  });

  const entries = data?.entries || [];
  if (entries.length === 0) return null;

  const SHIFT_COLORS: Record<string, string> = {
    morning: "bg-amber-100 text-amber-700",
    afternoon: "bg-sky-100 text-sky-700",
    night: "bg-indigo-100 text-indigo-700",
  };

  return (
    <div>
      <div className="mb-2">
        <Link to={`/sites/${site.id}`} className="font-semibold text-water-700 hover:underline text-sm">
          {site.name}
        </Link>
        <span className="text-xs text-gray-400 ml-2">{site.society_name}</span>
      </div>
      <div className="space-y-2">
        {entries.map((entry: any) => (
          <div key={entry.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
            <div className="flex-shrink-0 text-center">
              <p className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleDateString()}</p>
              <p className="text-xs text-gray-500 font-mono">{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">{entry.author_name}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${SHIFT_COLORS[entry.shift_type] || "bg-gray-100"}`}>
                  {entry.shift_type}
                </span>
              </div>
              <p className="text-sm text-gray-600">{entry.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoEntriesCheck({ siteId }: { siteId: string }) {
  // This is just a placeholder — actual empty state is handled per-site
  return null;
}
