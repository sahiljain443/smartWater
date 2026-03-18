export interface SensorProfile {
  id: string;
  type: string;
  name: string;
  unit: string;
  baseValue: number;
  variance: number;
  minThreshold: number;
  maxThreshold: number;
  processStage: string;
}

export interface SiteProfile {
  id: string;
  name: string;
  capacityKLD: number;
  sensors: SensorProfile[];
}

export function createSensorProfiles(siteId: string): SensorProfile[] {
  return [
    { id: `${siteId}-flow-inlet`, type: "flow_rate", name: "Inlet Flow Rate", unit: "m3/h", baseValue: 12, variance: 3, minThreshold: 2, maxThreshold: 25, processStage: "inlet" },
    { id: `${siteId}-flow-outlet`, type: "flow_rate", name: "Outlet Flow Rate", unit: "m3/h", baseValue: 10, variance: 2.5, minThreshold: 1, maxThreshold: 22, processStage: "outlet" },
    { id: `${siteId}-ph-inlet`, type: "ph", name: "Inlet pH", unit: "pH", baseValue: 7.2, variance: 0.8, minThreshold: 6.5, maxThreshold: 8.5, processStage: "inlet" },
    { id: `${siteId}-ph-outlet`, type: "ph", name: "Outlet pH", unit: "pH", baseValue: 7.0, variance: 0.3, minThreshold: 6.5, maxThreshold: 8.5, processStage: "outlet" },
    { id: `${siteId}-turbidity`, type: "turbidity", name: "Outlet Turbidity", unit: "NTU", baseValue: 3, variance: 1.5, minThreshold: 0, maxThreshold: 10, processStage: "outlet" },
    { id: `${siteId}-tds-inlet`, type: "tds", name: "Inlet TDS", unit: "mg/L", baseValue: 800, variance: 200, minThreshold: 0, maxThreshold: 2100, processStage: "inlet" },
    { id: `${siteId}-tds-outlet`, type: "tds", name: "Outlet TDS", unit: "mg/L", baseValue: 500, variance: 100, minThreshold: 0, maxThreshold: 1000, processStage: "outlet" },
    { id: `${siteId}-do`, type: "dissolved_oxygen", name: "Aeration Tank DO", unit: "mg/L", baseValue: 3.5, variance: 1.0, minThreshold: 1.0, maxThreshold: 8.0, processStage: "aeration" },
    { id: `${siteId}-pressure`, type: "pressure", name: "Filter Pressure", unit: "bar", baseValue: 1.5, variance: 0.3, minThreshold: 0.5, maxThreshold: 3.0, processStage: "filtration" },
    { id: `${siteId}-motor-current`, type: "motor_current", name: "Main Pump Current", unit: "A", baseValue: 15, variance: 2, minThreshold: 5, maxThreshold: 25, processStage: "pumping" },
    { id: `${siteId}-motor-power`, type: "motor_power", name: "Main Pump Power", unit: "kW", baseValue: 5.5, variance: 0.8, minThreshold: 1, maxThreshold: 10, processStage: "pumping" },
    { id: `${siteId}-level`, type: "level", name: "Collection Tank Level", unit: "%", baseValue: 60, variance: 20, minThreshold: 10, maxThreshold: 95, processStage: "collection" },
  ];
}

// Fetch real site IDs from the database so simulator data matches seeded sites
export async function fetchSiteProfilesFromDB(): Promise<SiteProfile[]> {
  const dbUrl = process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || "smartwater"}:${process.env.POSTGRES_PASSWORD || "changeme_dev_only"}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DB || "smartwater"}`;

  // Dynamic import to keep pg optional (simulator can also run standalone)
  const pg = await import("pg");
  const pool = new pg.default.Pool({ connectionString: dbUrl });

  try {
    const result = await pool.query(
      "SELECT id, name, capacity_kld FROM sites WHERE is_active = true ORDER BY name"
    );

    if (result.rows.length === 0) {
      console.warn("No sites found in DB. Using generated UUIDs instead.");
      return [];
    }

    return result.rows.map((row: { id: string; name: string; capacity_kld: number }) => ({
      id: row.id,
      name: row.name,
      capacityKLD: Number(row.capacity_kld),
      sensors: createSensorProfiles(row.id),
    }));
  } finally {
    await pool.end();
  }
}
