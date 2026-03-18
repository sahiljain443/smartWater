import mqtt from "mqtt";
import pg from "pg";
import Redis from "ioredis";
import { sensorReadingSchema } from "@smartwater/validators";

const { Pool } = pg;

const db = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  database: process.env.POSTGRES_DB || "smartwater",
  user: process.env.POSTGRES_USER || "smartwater",
  password: process.env.POSTGRES_PASSWORD || "changeme_dev_only",
  max: 10,
});

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
});

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";

// Batch insert buffer for performance
let readingBuffer: Array<{
  time: string;
  siteId: string;
  sensorId: string;
  sensorType: string;
  value: number;
  unit: string;
  quality: string;
}> = [];

const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 2000;

async function flushReadings() {
  if (readingBuffer.length === 0) return;

  const batch = readingBuffer.splice(0, BATCH_SIZE);
  const values: unknown[] = [];
  const placeholders: string[] = [];

  batch.forEach((r, i) => {
    const offset = i * 7;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
    );
    values.push(r.time, r.siteId, r.sensorId, r.sensorType, r.value, r.unit, r.quality);
  });

  try {
    await db.query(
      `INSERT INTO sensor_readings (time, site_id, sensor_id, sensor_type, value, unit, quality)
       VALUES ${placeholders.join(", ")}`,
      values
    );
  } catch (err) {
    console.error("Failed to flush readings to DB:", err);
    // Re-add failed readings to the buffer
    readingBuffer.unshift(...batch);
  }
}

async function checkThresholds(reading: typeof readingBuffer[0]) {
  const config = await db.query(
    "SELECT min_threshold, max_threshold FROM sensor_configs WHERE site_id = $1 AND sensor_id = $2 AND is_active = true",
    [reading.siteId, reading.sensorId]
  );

  if (config.rows.length === 0) return;

  const { min_threshold, max_threshold } = config.rows[0];
  let alertType: string | null = null;
  let threshold: number | null = null;

  if (max_threshold !== null && reading.value > max_threshold) {
    alertType = "threshold_high";
    threshold = max_threshold;
  } else if (min_threshold !== null && reading.value < min_threshold) {
    alertType = "threshold_low";
    threshold = min_threshold;
  }

  if (alertType && threshold !== null) {
    const message = `${reading.sensorType} ${alertType === "threshold_high" ? "exceeded" : "below"} threshold: ${reading.value} ${reading.unit} (limit: ${threshold})`;

    await db.query(
      `INSERT INTO alerts (site_id, sensor_id, sensor_type, alert_type, value, threshold, message, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [reading.siteId, reading.sensorId, reading.sensorType, alertType, reading.value, threshold, message, "warning"]
    );

    // Publish alert to Redis for real-time WebSocket delivery
    await redis.publish(
      `alerts:${reading.siteId}`,
      JSON.stringify({ alertType, sensorId: reading.sensorId, sensorType: reading.sensorType, value: reading.value, threshold, message, timestamp: reading.time })
    );

    // Enqueue notification job
    await redis.lpush(
      "bull:notifications:wait",
      JSON.stringify({
        name: "send-alert",
        data: { siteId: reading.siteId, message, severity: "warning" },
      })
    );
  }
}

async function start() {
  console.log(`Connecting to MQTT broker: ${brokerUrl}`);
  const client = mqtt.connect(brokerUrl);

  client.on("connect", () => {
    console.log("Connected to MQTT broker");
    // Subscribe to all site sensor topics
    client.subscribe("smartwater/+/sensors/#", (err) => {
      if (err) console.error("MQTT subscribe error:", err);
      else console.log("Subscribed to smartwater/+/sensors/#");
    });
  });

  // Topic format: smartwater/{siteId}/sensors/{sensorId}
  client.on("message", async (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      const parsed = sensorReadingSchema.safeParse(data);

      if (!parsed.success) {
        console.warn("Invalid sensor reading:", parsed.error.flatten());
        return;
      }

      const reading = {
        time: parsed.data.timestamp,
        siteId: parsed.data.siteId,
        sensorId: parsed.data.sensorId,
        sensorType: parsed.data.sensorType,
        value: parsed.data.value,
        unit: parsed.data.unit,
        quality: parsed.data.quality,
      };

      // Buffer for batch insert
      readingBuffer.push(reading);

      // Publish to Redis for real-time WebSocket streaming
      await redis.publish(
        `sensor:${reading.siteId}`,
        JSON.stringify(reading)
      );

      // Check thresholds (async, non-blocking)
      checkThresholds(reading).catch((err) =>
        console.error("Threshold check error:", err)
      );
    } catch (err) {
      console.error("Error processing MQTT message:", err);
    }
  });

  // Periodic flush
  setInterval(flushReadings, FLUSH_INTERVAL_MS);

  client.on("error", (err) => {
    console.error("MQTT error:", err);
  });

  console.log("IoT Ingestion service started");
}

start().catch((err) => {
  console.error("Failed to start IoT Ingestion:", err);
  process.exit(1);
});
