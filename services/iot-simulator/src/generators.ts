import type { SiteProfile, SensorProfile } from "./profiles.js";

// Generate a reading with realistic patterns (diurnal cycle, random noise)
export function generateReading(site: SiteProfile, sensor: SensorProfile) {
  const now = new Date();
  const hour = now.getHours();

  // Simulate diurnal pattern: higher usage 6-10am and 6-10pm
  let diurnalFactor = 1.0;
  if (sensor.type === "flow_rate" || sensor.type === "level") {
    if ((hour >= 6 && hour <= 10) || (hour >= 18 && hour <= 22)) {
      diurnalFactor = 1.3; // Peak hours
    } else if (hour >= 0 && hour <= 5) {
      diurnalFactor = 0.5; // Night low
    }
  }

  // Gaussian-ish random noise using Box-Muller
  const u1 = Math.random();
  const u2 = Math.random();
  const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  const value = sensor.baseValue * diurnalFactor + noise * sensor.variance * 0.3;

  // Clamp to reasonable bounds
  const clampedValue = Math.max(0, Math.round(value * 100) / 100);

  return {
    siteId: site.id,
    sensorId: sensor.id,
    sensorType: sensor.type,
    value: clampedValue,
    unit: sensor.unit,
    timestamp: now.toISOString(),
    quality: "good" as const,
  };
}
