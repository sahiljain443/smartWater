export type SensorType =
  | "flow_rate"
  | "ph"
  | "turbidity"
  | "tds"
  | "bod"
  | "cod"
  | "tss"
  | "dissolved_oxygen"
  | "pressure"
  | "motor_current"
  | "motor_voltage"
  | "motor_power"
  | "temperature"
  | "level";

export interface SensorReading {
  siteId: string;
  sensorId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: string;
  quality: "good" | "suspect" | "bad";
}

export interface SensorConfig {
  id: string;
  siteId: string;
  type: SensorType;
  name: string;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  processStage: string;
  isActive: boolean;
}

export interface SensorAlert {
  id: string;
  siteId: string;
  sensorId: string;
  sensorType: SensorType;
  alertType: "threshold_high" | "threshold_low" | "anomaly" | "offline";
  value: number;
  threshold: number;
  message: string;
  severity: "critical" | "warning" | "info";
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
}
