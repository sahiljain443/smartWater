import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { api } from "../services/api";

const TIME_RANGES = [
  { label: "1H", hours: 1, bucket: "1 minute" },
  { label: "6H", hours: 6, bucket: "5 minutes" },
  { label: "24H", hours: 24, bucket: "15 minutes" },
  { label: "7D", hours: 168, bucket: "1 hour" },
];

interface Props {
  siteId: string;
  sensorId: string;
  sensorName?: string;
  unit?: string;
  minThreshold?: number;
  maxThreshold?: number;
}

export function SensorChart({ siteId, sensorId, sensorName, unit, minThreshold, maxThreshold }: Props) {
  const [rangeIdx, setRangeIdx] = useState(1); // default 6H
  const range = TIME_RANGES[rangeIdx];

  const { data, isLoading } = useQuery({
    queryKey: ["sensorHistory", siteId, sensorId, range.label],
    queryFn: () => {
      const from = new Date(Date.now() - range.hours * 60 * 60 * 1000).toISOString();
      return api.getSensorHistory(siteId, sensorId, { from, bucket: range.bucket });
    },
    refetchInterval: 30000,
  });

  const chartData = data?.data.map((d: any) => ({
    time: range.hours <= 24
      ? new Date(d.bucket).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date(d.bucket).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit" }),
    avg: Number(Number(d.avg_value).toFixed(2)),
    min: Number(Number(d.min_value).toFixed(2)),
    max: Number(Number(d.max_value).toFixed(2)),
  })) || [];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          {sensorName && <h4 className="text-sm font-semibold text-gray-700">{sensorName}</h4>}
          {unit && <p className="text-xs text-gray-400">{unit}</p>}
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`px-2.5 py-1 text-xs rounded font-medium ${
                i === rangeIdx
                  ? "bg-water-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-52 animate-pulse bg-gray-100 rounded" />
      ) : chartData.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
          No data for this time range
        </div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number) => [`${value} ${unit || ""}`, ""]}
              />
              {maxThreshold != null && (
                <ReferenceLine y={Number(maxThreshold)} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Max", fontSize: 9, fill: "#EF4444" }} />
              )}
              {minThreshold != null && Number(minThreshold) > 0 && (
                <ReferenceLine y={Number(minThreshold)} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "Min", fontSize: 9, fill: "#F59E0B" }} />
              )}
              <Line type="monotone" dataKey="avg" stroke="#2577eb" strokeWidth={2} dot={false} name="Avg" />
              <Line type="monotone" dataKey="min" stroke="#93d1fd" strokeWidth={1} dot={false} name="Min" />
              <Line type="monotone" dataKey="max" stroke="#1e50af" strokeWidth={1} dot={false} name="Max" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
