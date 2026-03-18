import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["site_manager", "technician", "society_admin", "resident"]),
  siteId: z.string().uuid(),
});

export const sensorReadingSchema = z.object({
  siteId: z.string().uuid(),
  sensorId: z.string(),
  sensorType: z.enum([
    "flow_rate", "ph", "turbidity", "tds", "bod", "cod", "tss",
    "dissolved_oxygen", "pressure", "motor_current", "motor_voltage",
    "motor_power", "temperature", "level",
  ]),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime(),
  quality: z.enum(["good", "suspect", "bad"]).default("good"),
});

export const createSiteSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.object({
    address: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  capacityKLD: z.number().positive(),
  technologyType: z.string().min(1),
  societyName: z.string().min(1),
});

export const createAssetSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: z.enum(["pump", "blower", "membrane", "filter", "motor", "valve", "sensor", "panel", "other"]),
  make: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  processStage: z.string(),
  installDate: z.string().datetime(),
  warrantyExpiry: z.string().datetime().nullable().optional(),
  parentAssetId: z.string().uuid().nullable().optional(),
});

export const createWorkOrderSchema = z.object({
  siteId: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  assetId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

export const createLogbookEntrySchema = z.object({
  siteId: z.string().uuid(),
  content: z.string().min(1),
  shiftType: z.enum(["morning", "afternoon", "night"]),
  attachments: z.array(z.string().url()).optional(),
});
