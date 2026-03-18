import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { db } from "./db/connection.js";
import { authRoutes } from "./routes/auth/index.js";
import { opsRoutes } from "./routes/ops/index.js";
import { adminRoutes } from "./routes/admin/index.js";
import { wsRoutes } from "./routes/ws/index.js";

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty" }
        : undefined,
  },
});

async function start() {
  // Plugins
  await app.register(cors, {
    origin: [
      process.env.OPS_DASHBOARD_URL || "http://localhost:5173",
      process.env.RWA_PORTAL_URL || "http://localhost:5174",
    ],
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev_jwt_secret_change_in_production",
  });

  await app.register(websocket);

  // Decorate with DB pool
  app.decorate("db", db);

  // Health check
  app.get("/api/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "api-server",
  }));

  // Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(opsRoutes, { prefix: "/api/ops" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(wsRoutes, { prefix: "/ws" });

  // Start
  const port = parseInt(process.env.API_PORT || "3001", 10);
  const host = process.env.API_HOST || "0.0.0.0";

  await app.listen({ port, host });
  app.log.info(`API Server running on ${host}:${port}`);
}

start().catch((err) => {
  console.error("Failed to start API server:", err);
  process.exit(1);
});
