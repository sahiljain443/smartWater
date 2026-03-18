export type NotificationChannel = "telegram" | "email" | "push";
export type NotificationPriority = "critical" | "high" | "normal" | "low";

export interface NotificationPayload {
  channels: NotificationChannel[];
  priority: NotificationPriority;
  recipientIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipientId: string;
  title: string;
  body: string;
  status: "sent" | "failed" | "pending";
  sentAt: string | null;
  error: string | null;
  createdAt: string;
}
