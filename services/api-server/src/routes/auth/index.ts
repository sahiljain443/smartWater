import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { loginSchema, inviteSchema } from "@smartwater/validators";
import { authenticate, authorize } from "../../middleware/auth.js";
import { UserRole } from "@smartwater/shared-types";

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const result = await app.db.query(
      "SELECT id, email, name, role, password_hash, is_active FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return reply.code(403).send({ error: "Account is deactivated" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    // Fetch user's site IDs
    const sitesResult = await app.db.query(
      "SELECT site_id FROM user_sites WHERE user_id = $1",
      [user.id]
    );
    const siteIds = sitesResult.rows.map((r: { site_id: string }) => r.site_id);

    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      siteIds,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        siteIds,
        isActive: user.is_active,
      },
    };
  });

  // POST /api/auth/invite — admin creates an invite
  app.post("/invite", {
    preHandler: authorize(UserRole.SUPER_ADMIN, UserRole.SITE_MANAGER, UserRole.SOCIETY_ADMIN),
    handler: async (request, reply) => {
      const parsed = inviteSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.flatten() });
      }

      const { email, name, role, siteId } = parsed.data;
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await app.db.query(
        `INSERT INTO invites (email, name, role, site_id, token, invited_by, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [email, name, role, siteId, token, request.currentUser.userId, expiresAt]
      );

      return { inviteToken: token, expiresAt: expiresAt.toISOString() };
    },
  });

  // POST /api/auth/accept-invite — resident accepts an invite and sets password
  app.post("/accept-invite", async (request, reply) => {
    const body = request.body as { token: string; password: string };
    if (!body.token || !body.password || body.password.length < 8) {
      return reply.code(400).send({ error: "Token and password (min 8 chars) required" });
    }

    const inviteResult = await app.db.query(
      "SELECT * FROM invites WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()",
      [body.token]
    );

    if (inviteResult.rows.length === 0) {
      return reply.code(400).send({ error: "Invalid or expired invite" });
    }

    const invite = inviteResult.rows[0];
    const passwordHash = await bcrypt.hash(body.password, 12);

    const userResult = await app.db.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      [invite.email, passwordHash, invite.name, invite.role]
    );

    const user = userResult.rows[0];

    // Link user to site
    await app.db.query(
      "INSERT INTO user_sites (user_id, site_id) VALUES ($1, $2)",
      [user.id, invite.site_id]
    );

    // Mark invite as accepted
    await app.db.query(
      "UPDATE invites SET accepted_at = NOW() WHERE id = $1",
      [invite.id]
    );

    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      siteIds: [invite.site_id],
    });

    return { token, user: { ...user, siteIds: [invite.site_id], isActive: true } };
  });

  // GET /api/auth/me — get current user
  app.get("/me", {
    preHandler: authenticate,
    handler: async (request) => {
      const result = await app.db.query(
        "SELECT id, email, name, role, is_active, created_at FROM users WHERE id = $1",
        [request.currentUser.userId]
      );
      const user = result.rows[0];
      return { ...user, siteIds: request.currentUser.siteIds };
    },
  });
}
