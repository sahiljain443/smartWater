import type { FastifyInstance } from "fastify";
import { authenticate, authorizeSiteAccess } from "../../middleware/auth.js";
import { UserRole } from "@smartwater/shared-types";
import { createAssetSchema, createWorkOrderSchema, createLogbookEntrySchema } from "@smartwater/validators";

export async function opsRoutes(app: FastifyInstance) {
  // All ops routes require authentication
  app.addHook("preHandler", authenticate);

  // ============================
  // Dashboard / KPIs
  // ============================

  // GET /api/ops/sites — list sites accessible to the user
  app.get("/sites", async (request) => {
    const { role, siteIds, userId } = request.currentUser;
    let result;
    if (role === UserRole.SUPER_ADMIN) {
      result = await app.db.query("SELECT * FROM sites WHERE is_active = true ORDER BY name");
    } else {
      result = await app.db.query(
        "SELECT s.* FROM sites s JOIN user_sites us ON s.id = us.site_id WHERE us.user_id = $1 AND s.is_active = true ORDER BY s.name",
        [userId]
      );
    }
    return { sites: result.rows };
  });

  // GET /api/ops/sites/:siteId — single site detail
  app.get<{ Params: { siteId: string } }>("/sites/:siteId", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    const result = await app.db.query("SELECT * FROM sites WHERE id = $1", [siteId]);
    if (result.rows.length === 0) return reply.code(404).send({ error: "Site not found" });
    return { site: result.rows[0] };
  });

  // GET /api/ops/sites/:siteId/kpis — latest KPIs for a site
  app.get<{ Params: { siteId: string } }>("/sites/:siteId/kpis", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    // Aggregate today's readings
    const result = await app.db.query(
      `SELECT
        sensor_type,
        AVG(value) AS avg_value,
        MIN(value) AS min_value,
        MAX(value) AS max_value,
        COUNT(*) AS reading_count
      FROM sensor_readings
      WHERE site_id = $1 AND time > NOW() - INTERVAL '24 hours'
      GROUP BY sensor_type`,
      [siteId]
    );

    return { siteId, period: "24h", metrics: result.rows };
  });

  // GET /api/ops/sites/:siteId/sensors/latest — latest reading per sensor
  app.get<{ Params: { siteId: string } }>("/sites/:siteId/sensors/latest", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    const result = await app.db.query(
      `SELECT DISTINCT ON (sensor_id)
        sensor_id, sensor_type, value, unit, quality, time
      FROM sensor_readings
      WHERE site_id = $1
      ORDER BY sensor_id, time DESC`,
      [siteId]
    );

    return { siteId, sensors: result.rows };
  });

  // GET /api/ops/sites/:siteId/sensors/live — latest readings with config & thresholds
  app.get<{ Params: { siteId: string } }>("/sites/:siteId/sensors/live", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    const result = await app.db.query(
      `SELECT
        sc.sensor_id, sc.type AS sensor_type, sc.name, sc.unit,
        sc.min_threshold, sc.max_threshold, sc.process_stage,
        lr.value, lr.quality, lr.time
      FROM sensor_configs sc
      LEFT JOIN LATERAL (
        SELECT value, quality, time
        FROM sensor_readings sr
        WHERE sr.site_id = sc.site_id AND sr.sensor_id = sc.sensor_id
        ORDER BY time DESC LIMIT 1
      ) lr ON true
      WHERE sc.site_id = $1 AND sc.is_active = true
      ORDER BY sc.process_stage, sc.name`,
      [siteId]
    );

    return { siteId, sensors: result.rows };
  });

  // GET /api/ops/sites/:siteId/sensors/:sensorId/history — time-series data
  app.get<{ Params: { siteId: string; sensorId: string }; Querystring: { from?: string; to?: string; bucket?: string } }>(
    "/sites/:siteId/sensors/:sensorId/history",
    async (request, reply) => {
      const { siteId, sensorId } = request.params;
      if (!authorizeSiteAccess(request, reply, siteId)) return;

      const from = request.query.from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = request.query.to || new Date().toISOString();
      const bucket = request.query.bucket || "5 minutes";

      const result = await app.db.query(
        `SELECT
          time_bucket($1::interval, time) AS bucket,
          AVG(value) AS avg_value,
          MIN(value) AS min_value,
          MAX(value) AS max_value
        FROM sensor_readings
        WHERE site_id = $2 AND sensor_id = $3 AND time BETWEEN $4 AND $5
        GROUP BY bucket
        ORDER BY bucket`,
        [bucket, siteId, sensorId, from, to]
      );

      return { siteId, sensorId, from, to, data: result.rows };
    }
  );

  // ============================
  // Alerts
  // ============================

  // GET /api/ops/sites/:siteId/alerts
  app.get<{ Params: { siteId: string }; Querystring: { status?: string } }>(
    "/sites/:siteId/alerts",
    async (request, reply) => {
      const { siteId } = request.params;
      if (!authorizeSiteAccess(request, reply, siteId)) return;

      const result = await app.db.query(
        `SELECT * FROM alerts WHERE site_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [siteId]
      );

      return { alerts: result.rows };
    }
  );

  // ============================
  // Assets
  // ============================

  // GET /api/ops/sites/:siteId/assets
  app.get<{ Params: { siteId: string } }>("/sites/:siteId/assets", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    const result = await app.db.query(
      "SELECT * FROM assets WHERE site_id = $1 ORDER BY process_stage, name",
      [siteId]
    );
    return { assets: result.rows };
  });

  // POST /api/ops/sites/:siteId/assets
  app.post<{ Params: { siteId: string } }>("/sites/:siteId/assets", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    const parsed = createAssetSchema.safeParse({ ...request.body as object, siteId });
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { name, category, make, model, serialNumber, processStage, installDate, warrantyExpiry, parentAssetId } = parsed.data;
    const qrCode = `SW-${siteId.slice(0, 8)}-${Date.now()}`;

    const result = await app.db.query(
      `INSERT INTO assets (site_id, name, category, make, model, serial_number, process_stage, install_date, warranty_expiry, parent_asset_id, qr_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [siteId, name, category, make, model, serialNumber, processStage, installDate, warrantyExpiry, parentAssetId]
    );

    return reply.code(201).send({ asset: result.rows[0] });
  });

  // ============================
  // Work Orders
  // ============================

  // GET /api/ops/sites/:siteId/work-orders
  app.get<{ Params: { siteId: string } }>("/sites/:siteId/work-orders", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    const result = await app.db.query(
      `SELECT wo.*, u.name AS assigned_to_name
       FROM work_orders wo
       LEFT JOIN users u ON wo.assigned_to = u.id
       WHERE wo.site_id = $1
       ORDER BY wo.created_at DESC`,
      [siteId]
    );
    return { workOrders: result.rows };
  });

  // POST /api/ops/sites/:siteId/work-orders
  app.post<{ Params: { siteId: string } }>("/sites/:siteId/work-orders", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    const parsed = createWorkOrderSchema.safeParse({ ...request.body as object, siteId });
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { title, description, priority, assetId, assignedTo, dueAt } = parsed.data;
    const status = assignedTo ? "assigned" : "open";

    const result = await app.db.query(
      `INSERT INTO work_orders (site_id, title, description, priority, status, asset_id, assigned_to, created_by, due_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [siteId, title, description, priority, status, assetId, assignedTo, request.currentUser.userId, dueAt]
    );

    return reply.code(201).send({ workOrder: result.rows[0] });
  });

  // ============================
  // Digital Logbook
  // ============================

  // GET /api/ops/sites/:siteId/logbook
  app.get<{ Params: { siteId: string }; Querystring: { limit?: string } }>(
    "/sites/:siteId/logbook",
    async (request, reply) => {
      const { siteId } = request.params;
      if (!authorizeSiteAccess(request, reply, siteId)) return;

      const limit = parseInt(request.query.limit || "50", 10);
      const result = await app.db.query(
        `SELECT le.*, u.name AS author_name
         FROM logbook_entries le
         JOIN users u ON le.author_id = u.id
         WHERE le.site_id = $1
         ORDER BY le.created_at DESC
         LIMIT $2`,
        [siteId, limit]
      );
      return { entries: result.rows };
    }
  );

  // POST /api/ops/sites/:siteId/logbook
  app.post<{ Params: { siteId: string } }>("/sites/:siteId/logbook", async (request, reply) => {
    const { siteId } = request.params;
    if (!authorizeSiteAccess(request, reply, siteId)) return;

    const parsed = createLogbookEntrySchema.safeParse({ ...request.body as object, siteId });
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { content, shiftType, attachments } = parsed.data;
    const result = await app.db.query(
      `INSERT INTO logbook_entries (site_id, author_id, content, shift_type, attachments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [siteId, request.currentUser.userId, content, shiftType, attachments || []]
    );

    return reply.code(201).send({ entry: result.rows[0] });
  });
}
