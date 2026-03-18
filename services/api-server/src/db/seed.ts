import pg from "pg";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;

const db = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  database: process.env.POSTGRES_DB || "smartwater",
  user: process.env.POSTGRES_USER || "smartwater",
  password: process.env.POSTGRES_PASSWORD || "changeme_dev_only",
});

async function seed() {
  console.log("Seeding database...");

  // Create super admin
  const adminPassword = await bcrypt.hash("admin123456", 12);
  const adminResult = await db.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ('admin@smartwaterverse.com', $1, 'System Admin', 'super_admin')
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [adminPassword]
  );
  const adminId = adminResult.rows[0]?.id || (await db.query("SELECT id FROM users WHERE email = 'admin@smartwaterverse.com'")).rows[0].id;
  console.log(`  Admin user: admin@smartwaterverse.com / admin123456`);

  // Create sample sites
  const sites = [
    { name: "Green Valley STP", address: "Green Valley Residency, Sector 45, Gurugram", lat: 28.4595, lng: 77.0266, capacity: 200, tech: "SBR", society: "Green Valley Residency" },
    { name: "Sunrise STP", address: "Sunrise Apartments, Whitefield, Bangalore", lat: 12.9698, lng: 77.7500, capacity: 150, tech: "MBR", society: "Sunrise Apartments" },
    { name: "Lake View STP", address: "Lake View Society, Powai, Mumbai", lat: 19.1176, lng: 72.9060, capacity: 300, tech: "MBBR", society: "Lake View Society" },
    { name: "Royal Gardens STP", address: "Royal Gardens, Noida Sector 137", lat: 28.5645, lng: 77.3650, capacity: 100, tech: "SBR", society: "Royal Gardens" },
    { name: "Palm Heights STP", address: "Palm Heights, Hinjewadi, Pune", lat: 18.5912, lng: 73.7389, capacity: 250, tech: "MBR", society: "Palm Heights" },
  ];

  for (const site of sites) {
    const siteResult = await db.query(
      `INSERT INTO sites (name, address, latitude, longitude, capacity_kld, technology_type, society_name, health_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'green')
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [site.name, site.address, site.lat, site.lng, site.capacity, site.tech, site.society]
    );

    if (siteResult.rows[0]) {
      const siteId = siteResult.rows[0].id;

      // Link admin to site
      await db.query(
        "INSERT INTO user_sites (user_id, site_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [adminId, siteId]
      );

      // Create sample assets for each site
      const assets = [
        { name: "Inlet Pump 1", category: "pump", make: "Grundfos", model: "CR-10", stage: "inlet" },
        { name: "Aeration Blower", category: "blower", make: "Atlas Copco", model: "ZB 37", stage: "aeration" },
        { name: "MBR Membrane Module", category: "membrane", make: "Kubota", model: "RM515", stage: "filtration" },
        { name: "UV Disinfection Unit", category: "filter", make: "Trojan", model: "UV3000Plus", stage: "disinfection" },
      ];

      for (const asset of assets) {
        await db.query(
          `INSERT INTO assets (site_id, name, category, make, model, serial_number, process_stage, install_date, qr_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '6 months', $8)`,
          [siteId, asset.name, asset.category, asset.make, asset.model, `SN-${uuidv4().slice(0, 8)}`, asset.stage, `SW-${siteId.slice(0, 8)}-${Date.now()}`]
        );
      }

      // Register sensor_configs for this site (matches simulator sensor IDs)
      const sensorConfigs = [
        { sensorId: `${siteId}-flow-inlet`, type: "flow_rate", name: "Inlet Flow Rate", unit: "m3/h", min: 2, max: 25, stage: "inlet" },
        { sensorId: `${siteId}-flow-outlet`, type: "flow_rate", name: "Outlet Flow Rate", unit: "m3/h", min: 1, max: 22, stage: "outlet" },
        { sensorId: `${siteId}-ph-inlet`, type: "ph", name: "Inlet pH", unit: "pH", min: 6.5, max: 8.5, stage: "inlet" },
        { sensorId: `${siteId}-ph-outlet`, type: "ph", name: "Outlet pH", unit: "pH", min: 6.5, max: 8.5, stage: "outlet" },
        { sensorId: `${siteId}-turbidity`, type: "turbidity", name: "Outlet Turbidity", unit: "NTU", min: 0, max: 10, stage: "outlet" },
        { sensorId: `${siteId}-tds-inlet`, type: "tds", name: "Inlet TDS", unit: "mg/L", min: 0, max: 2100, stage: "inlet" },
        { sensorId: `${siteId}-tds-outlet`, type: "tds", name: "Outlet TDS", unit: "mg/L", min: 0, max: 1000, stage: "outlet" },
        { sensorId: `${siteId}-do`, type: "dissolved_oxygen", name: "Aeration Tank DO", unit: "mg/L", min: 1.0, max: 8.0, stage: "aeration" },
        { sensorId: `${siteId}-pressure`, type: "pressure", name: "Filter Pressure", unit: "bar", min: 0.5, max: 3.0, stage: "filtration" },
        { sensorId: `${siteId}-motor-current`, type: "motor_current", name: "Main Pump Current", unit: "A", min: 5, max: 25, stage: "pumping" },
        { sensorId: `${siteId}-motor-power`, type: "motor_power", name: "Main Pump Power", unit: "kW", min: 1, max: 10, stage: "pumping" },
        { sensorId: `${siteId}-level`, type: "level", name: "Collection Tank Level", unit: "%", min: 10, max: 95, stage: "collection" },
      ];

      for (const sc of sensorConfigs) {
        await db.query(
          `INSERT INTO sensor_configs (site_id, sensor_id, type, name, unit, min_threshold, max_threshold, process_stage)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (site_id, sensor_id) DO NOTHING`,
          [siteId, sc.sensorId, sc.type, sc.name, sc.unit, sc.min, sc.max, sc.stage]
        );
      }

      console.log(`  Site: ${site.name} (${siteId}) with ${assets.length} assets, ${sensorConfigs.length} sensors`);
    }
  }

  // Seed CPCB compliance parameters
  const complianceParams = [
    { name: "BOD", type: "bod", max: 10, unit: "mg/L", reg: "CPCB_2017" },
    { name: "COD", type: "cod", max: 50, unit: "mg/L", reg: "CPCB_2017" },
    { name: "TSS", type: "tss", max: 10, unit: "mg/L", reg: "CPCB_2017" },
    { name: "pH (min)", type: "ph", min: 6.5, max: 9.0, unit: "pH", reg: "CPCB_2017" },
    { name: "TDS", type: "tds", max: 2100, unit: "mg/L", reg: "CPCB_2017" },
  ];

  for (const param of complianceParams) {
    await db.query(
      `INSERT INTO compliance_parameters (name, sensor_type, min_value, max_value, unit, regulation)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [param.name, param.type, (param as { min?: number }).min ?? null, param.max, param.unit, param.reg]
    );
  }
  console.log(`  Compliance parameters: ${complianceParams.length} CPCB norms`);

  console.log("Seeding complete!");
  await db.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
