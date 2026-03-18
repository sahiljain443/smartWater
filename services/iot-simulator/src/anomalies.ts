import type { SensorProfile } from "./profiles.js";

// 2% chance of injecting an anomaly into any reading
const ANOMALY_PROBABILITY = 0.02;

type Reading = {
  siteId: string;
  sensorId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
  quality: "good" | "suspect" | "bad";
};

export function maybeInjectAnomaly(reading: Reading, sensor: SensorProfile): Reading {
  if (Math.random() > ANOMALY_PROBABILITY) return reading;

  const anomalyType = Math.random();

  if (anomalyType < 0.3) {
    // Spike: value shoots above max threshold
    return {
      ...reading,
      value: sensor.maxThreshold * (1.1 + Math.random() * 0.3),
      quality: "suspect",
    };
  } else if (anomalyType < 0.6) {
    // Drop: value falls below min threshold
    return {
      ...reading,
      value: Math.max(0, sensor.minThreshold * (0.3 + Math.random() * 0.4)),
      quality: "suspect",
    };
  } else if (anomalyType < 0.8) {
    // Flatline: value stuck at exactly the base (simulates sensor freeze)
    return {
      ...reading,
      value: sensor.baseValue,
      quality: "suspect",
    };
  } else {
    // Dry run scenario: flow is 0 but power is non-zero
    if (sensor.type === "flow_rate") {
      return { ...reading, value: 0, quality: "bad" };
    }
    if (sensor.type === "motor_power") {
      return { ...reading, value: sensor.baseValue * 1.2, quality: "suspect" };
    }
    return reading;
  }
}
