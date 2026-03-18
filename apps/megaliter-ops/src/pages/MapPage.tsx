import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { api } from "../services/api";
import "leaflet/dist/leaflet.css";

const HEALTH_COLORS: Record<string, string> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  offline: "#9ca3af",
};

// --- helpers ---

function deriveCity(address: string): string {
  if (address.includes("Hyderabad")) return "Hyderabad";
  if (address.includes("Bengaluru") || address.includes("Bangalore")) return "Bengaluru";
  if (address.includes("Mumbai")) return "Mumbai";
  return "Other";
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort();
}

type SortDir = "asc" | "desc";
type SortKey = "health_status" | "name" | "society_name" | "city" | "capacity_kld" | "technology_type";

const SORT_FNS: Record<SortKey, (a: any, b: any) => number> = {
  health_status: (a, b) => {
    const order: Record<string, number> = { red: 0, amber: 1, offline: 2, green: 3 };
    return (order[a.health_status] ?? 9) - (order[b.health_status] ?? 9);
  },
  name: (a, b) => a.name.localeCompare(b.name),
  society_name: (a, b) => a.society_name.localeCompare(b.society_name),
  city: (a, b) => deriveCity(a.address).localeCompare(deriveCity(b.address)),
  capacity_kld: (a, b) => Number(a.capacity_kld) - Number(b.capacity_kld),
  technology_type: (a, b) => a.technology_type.localeCompare(b.technology_type),
};

// --- component ---

export function MapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
    refetchInterval: 15000,
  });

  const allSites = data?.sites || [];

  // filter state
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterTech, setFilterTech] = useState<string>("");
  const [filterCapacity, setFilterCapacity] = useState<string>("");
  const [filterSite, setFilterSite] = useState<string>("");
  const [filterSociety, setFilterSociety] = useState<string>("");

  // sort state
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // derive unique values for dropdowns
  const options = useMemo(() => {
    const sites = allSites as any[];
    return {
      statuses: unique(sites.map((s) => s.health_status)),
      cities: unique(sites.map((s) => deriveCity(s.address))),
      techs: unique(sites.map((s) => s.technology_type)),
      capacities: unique(sites.map((s) => String(s.capacity_kld))),
      names: unique(sites.map((s) => s.name)),
      societies: unique(sites.map((s) => s.society_name)),
    };
  }, [allSites]);

  // filtered sites
  const filteredSites = useMemo(() => {
    let result = allSites as any[];
    if (filterStatus) result = result.filter((s) => s.health_status === filterStatus);
    if (filterCity) result = result.filter((s) => deriveCity(s.address) === filterCity);
    if (filterTech) result = result.filter((s) => s.technology_type === filterTech);
    if (filterCapacity) result = result.filter((s) => String(s.capacity_kld) === filterCapacity);
    if (filterSite) result = result.filter((s) => s.name === filterSite);
    if (filterSociety) result = result.filter((s) => s.society_name === filterSociety);

    const fn = SORT_FNS[sortKey];
    result = [...result].sort((a, b) => (sortDir === "asc" ? fn(a, b) : fn(b, a)));
    return result;
  }, [allSites, filterStatus, filterCity, filterTech, filterCapacity, filterSite, filterSociety, sortKey, sortDir]);

  const hasFilters = filterStatus || filterCity || filterTech || filterCapacity || filterSite || filterSociety;

  // city summary from *filtered* sites
  const byCityCount: Record<string, { total: number; green: number; amber: number; red: number }> = {};
  filteredSites.forEach((s: any) => {
    const city = deriveCity(s.address);
    if (!byCityCount[city]) byCityCount[city] = { total: 0, green: 0, amber: 0, red: 0 };
    byCityCount[city].total++;
    if (s.health_status === "green") byCityCount[city].green++;
    else if (s.health_status === "amber") byCityCount[city].amber++;
    else byCityCount[city].red++;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setFilterStatus("");
    setFilterCity("");
    setFilterTech("");
    setFilterCapacity("");
    setFilterSite("");
    setFilterSociety("");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Map Overview</h2>
        <span className="text-sm text-gray-500">
          Showing {filteredSites.length} of {allSites.length} sites
        </span>
      </div>

      {/* City Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(byCityCount).map(([city, counts]) => (
          <button
            key={city}
            onClick={() => setFilterCity(filterCity === city ? "" : city)}
            className={`bg-white rounded-lg shadow p-4 text-left transition-all ${
              filterCity === city ? "ring-2 ring-water-500" : "hover:shadow-md"
            }`}
          >
            <h3 className="font-semibold text-gray-800">{city}</h3>
            <p className="text-sm text-gray-500 mt-1">{counts.total} STP sites</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500" /> {counts.green}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> {counts.amber}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500" /> {counts.red}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Map */}
      {isLoading ? (
        <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: 500 }}>
          <MapContainer
            center={[16.5, 77.0]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredSites.map((site: any) => (
              <CircleMarker
                key={site.id}
                center={[site.latitude, site.longitude]}
                radius={10}
                pathOptions={{
                  fillColor: HEALTH_COLORS[site.health_status] || HEALTH_COLORS.offline,
                  color: "#fff",
                  weight: 2,
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[180px]">
                    <p className="font-semibold">{site.name}</p>
                    <p className="text-gray-500 text-xs">{site.society_name}</p>
                    <p className="text-gray-500 text-xs mt-1">{site.address}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span>{site.capacity_kld} KLD</span>
                      <span>&middot;</span>
                      <span>{site.technology_type}</span>
                      <span>&middot;</span>
                      <span className="font-medium" style={{ color: HEALTH_COLORS[site.health_status] }}>
                        {site.health_status.toUpperCase()}
                      </span>
                    </div>
                    <Link
                      to={`/sites/${site.id}`}
                      className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Filter Bar + Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Column Filters */}
        <div className="px-4 py-3 bg-gray-50 border-b flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Filters</span>

          <ColumnFilter
            label="Status"
            value={filterStatus}
            options={options.statuses}
            onChange={setFilterStatus}
            renderOption={(v) => (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: HEALTH_COLORS[v] }} />
                {v}
              </span>
            )}
          />
          <ColumnFilter label="Site" value={filterSite} options={options.names} onChange={setFilterSite} />
          <ColumnFilter label="Society" value={filterSociety} options={options.societies} onChange={setFilterSociety} />
          <ColumnFilter label="City" value={filterCity} options={options.cities} onChange={setFilterCity} />
          <ColumnFilter label="Capacity" value={filterCapacity} options={options.capacities} onChange={setFilterCapacity} renderOption={(v) => <>{v} KLD</>} />
          <ColumnFilter label="Technology" value={filterTech} options={options.techs} onChange={setFilterTech} />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <SortableHeader label="Status" sortKey="health_status" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Site" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Society" sortKey="society_name" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="City" sortKey="city" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Capacity" sortKey="capacity_kld" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Technology" sortKey="technology_type" current={sortKey} dir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {filteredSites.map((site: any) => (
              <tr key={site.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: HEALTH_COLORS[site.health_status] }}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link to={`/sites/${site.id}`} className="font-medium text-water-700 hover:underline">
                    {site.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{site.society_name}</td>
                <td className="px-4 py-3 text-gray-500">{deriveCity(site.address)}</td>
                <td className="px-4 py-3 text-gray-600">{site.capacity_kld} KLD</td>
                <td className="px-4 py-3 text-gray-600">{site.technology_type}</td>
              </tr>
            ))}
            {filteredSites.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No sites match the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- sub-components ---

function ColumnFilter({
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  renderOption?: (v: string) => React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none text-xs rounded-md border pl-2.5 pr-7 py-1.5 cursor-pointer transition-colors ${
          value
            ? "border-water-400 bg-water-50 text-water-700 font-medium"
            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
        }`}
      >
        <option value="">{label}: All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {renderOption ? opt : opt}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <th
      className="px-4 py-3 text-left text-gray-600 text-xs font-semibold cursor-pointer select-none hover:text-gray-900 group"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}>
          {dir === "asc" ? "↑" : "↓"}
        </span>
      </span>
    </th>
  );
}
