import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import cron from "node-cron";
import { sendTelegramNotification } from "./notifications/telegram.js";
import { sendEmailNotification } from "./notifications/email.js";

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
});

// ========================
// Notification Worker
// ========================
const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    const { siteId, message, severity, channels } = job.data;

    console.log(`[Notification] ${severity}: ${message} (site: ${siteId})`);

    // Telegram (default for all alerts)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      await sendTelegramNotification(message, severity);
    }

    // Email (for critical alerts only)
    if (severity === "critical" && process.env.AWS_SES_FROM_EMAIL) {
      await sendEmailNotification(message, severity);
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

notificationWorker.on("completed", (job) => {
  console.log(`[Notification] Job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[Notification] Job ${job?.id} failed:`, err.message);
});

// ========================
// Scheduled Jobs
// ========================

// Daily site health recalculation (every day at 00:05)
cron.schedule("5 0 * * *", async () => {
  console.log("[Scheduler] Running daily site health recalculation...");
  // TODO: Implement site health rollup from daily aggregates
});

// Weekly compliance report generation (every Monday at 06:00)
cron.schedule("0 6 * * 1", async () => {
  console.log("[Scheduler] Generating weekly compliance reports...");
  // TODO: Implement compliance report generation
});

console.log("Worker service started");
console.log("  - Notification queue: listening");
console.log("  - Cron: daily health @ 00:05, weekly compliance @ Mon 06:00");
