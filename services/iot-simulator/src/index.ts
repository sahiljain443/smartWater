import mqtt from "mqtt";
import { fetchSiteProfilesFromDB, createSensorProfiles } from "./profiles.js";
import { generateReading } from "./generators.js";
import { maybeInjectAnomaly } from "./anomalies.js";
import { v4 as uuidv4 } from "uuid";

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const siteCount = parseInt(process.env.SIMULATOR_SITE_COUNT || "20", 10);
const intervalMs = parseInt(process.env.SIMULATOR_INTERVAL_MS || "5000", 10);

async function start() {
  console.log(`IoT Simulator starting — target ${siteCount} sites, ${intervalMs}ms interval`);

  // Try to load sites from the database first
  let sites = await fetchSiteProfilesFromDB().catch((err) => {
    console.warn("Could not fetch sites from DB:", err.message);
    return [];
  });

  // Fall back to generated profiles if DB is empty
  if (sites.length === 0) {
    console.log("Generating random site profiles (no DB connection)");
    for (let i = 0; i < siteCount; i++) {
      const id = uuidv4();
      sites.push({ id, name: `Site-${i + 1}`, capacityKLD: 100, sensors: createSensorProfiles(id) });
    }
  }

  console.log(`Simulating ${sites.length} sites:`);
  sites.forEach((s) => console.log(`  - ${s.name} (${s.id.slice(0, 8)}..., ${s.sensors.length} sensors)`));

  console.log(`Connecting to MQTT broker: ${brokerUrl}`);
  const client = mqtt.connect(brokerUrl);

  client.on("connect", () => {
    console.log("Connected to MQTT broker");

    let readingCount = 0;

    setInterval(() => {
      for (const site of sites) {
        for (const sensor of site.sensors) {
          let reading = generateReading(site, sensor);
          reading = maybeInjectAnomaly(reading, sensor);

          const topic = `smartwater/${site.id}/sensors/${sensor.id}`;
          client.publish(topic, JSON.stringify(reading));
          readingCount++;
        }
      }

      if (readingCount % 500 === 0) {
        console.log(`[Simulator] Published ${readingCount} total readings`);
      }
    }, intervalMs);
  });

  client.on("error", (err) => {
    console.error("MQTT connection error:", err);
  });
}

start().catch((err) => {
  console.error("Failed to start IoT Simulator:", err);
  process.exit(1);
});
