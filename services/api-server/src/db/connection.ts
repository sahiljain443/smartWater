import pg from "pg";

const { Pool } = pg;

export const db = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  database: process.env.POSTGRES_DB || "smartwater",
  user: process.env.POSTGRES_USER || "smartwater",
  password: process.env.POSTGRES_PASSWORD || "changeme_dev_only",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

db.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});
