export type SiteHealthStatus = "green" | "amber" | "red" | "offline";

export interface Site {
  id: string;
  name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  capacityKLD: number;
  technologyType: string;
  societyName: string;
  healthStatus: SiteHealthStatus;
  isActive: boolean;
  createdAt: string;
}

export interface SiteKPIs {
  siteId: string;
  date: string;
  waterTreatedKL: number;
  waterRecycledKL: number;
  recyclingRate: number;
  energyConsumedKWh: number;
  energyPerKL: number;
  uptimePercent: number;
  complianceStatus: "compliant" | "warning" | "violation";
}
