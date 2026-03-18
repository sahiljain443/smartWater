import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/auth.js";
import { UserRole } from "@smartwater/shared-types";
import { createSiteSchema } from "@smartwater/validators";

export async function adminRoutes(app: FastifyInstance) {
  // All admin routes require super_admin or site_manager
  app.addHook("preHandler", authorize(UserRole.SUPER_ADMIN, UserRole.SITE_MANAGER));

  // GET /api/admin/users — list all users
  app.get("/users", async () => {
    const result = await app.db.query(
      `SELECT u.id, u.email, u.name, u.role, u.is_active, u.created_at,
              array_agg(us.site_id) FILTER (WHERE us.site_id IS NOT NULL) AS site_ids
       FROM users u
       LEFT JOIN user_sites us ON u.id = us.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    return { users: result.rows };
  });

  // POST /api/admin/sites — create a new STP site
  app.post("/sites", async (request, reply) => {
    const parsed = createSiteSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { name, location, capacityKLD, technologyType, societyName } = parsed.data;

    const result = await app.db.query(
      `INSERT INTO sites (name, address, latitude, longitude, capacity_kld, technology_type, society_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, location.address, location.latitude, location.longitude, capacityKLD, technologyType, societyName]
    );

    return reply.code(201).send({ site: result.rows[0] });
  });

  // GET /api/admin/compliance/parameters — list compliance parameters
  app.get("/compliance/parameters", async () => {
    const result = await app.db.query(
      "SELECT * FROM compliance_parameters WHERE is_active = true ORDER BY regulation, name"
    );
    return { parameters: result.rows };
  });

  // POST /api/admin/compliance/parameters — add a compliance parameter
  app.post("/compliance/parameters", async (request, reply) => {
    const body = request.body as {
      name: string;
      sensorType: string;
      minValue?: number;
      maxValue?: number;
      unit: string;
      regulation: string;
    };

    const result = await app.db.query(
      `INSERT INTO compliance_parameters (name, sensor_type, min_value, max_value, unit, regulation)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [body.name, body.sensorType, body.minValue, body.maxValue, body.unit, body.regulation]
    );

    return reply.code(201).send({ parameter: result.rows[0] });
  });
}
