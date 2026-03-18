export type WorkOrderStatus = "open" | "assigned" | "in_progress" | "completed" | "verified";
export type WorkOrderPriority = "critical" | "high" | "medium" | "low";

export interface WorkOrder {
  id: string;
  siteId: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assetId: string | null;
  alertId: string | null;
  assignedTo: string | null;
  createdBy: string;
  dueAt: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
}
