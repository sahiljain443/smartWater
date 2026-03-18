export type AssetStatus = "operational" | "maintenance" | "faulty" | "decommissioned";
export type AssetCategory = "pump" | "blower" | "membrane" | "filter" | "motor" | "valve" | "sensor" | "panel" | "other";

export interface Asset {
  id: string;
  siteId: string;
  name: string;
  category: AssetCategory;
  make: string;
  model: string;
  serialNumber: string;
  processStage: string;
  status: AssetStatus;
  installDate: string;
  warrantyExpiry: string | null;
  parentAssetId: string | null;
  qrCode: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: "preventive" | "corrective" | "emergency";
  description: string;
  performedBy: string;
  performedAt: string;
  nextDueAt: string | null;
  cost: number | null;
  notes: string;
}
