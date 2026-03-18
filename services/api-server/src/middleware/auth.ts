import type { FastifyRequest, FastifyReply } from "fastify";
import type { UserRole } from "@smartwater/shared-types";

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  siteIds: string[];
}

declare module "fastify" {
  interface FastifyRequest {
    currentUser: JWTPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const payload = await request.jwtVerify<JWTPayload>();
    request.currentUser = payload;
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    if (!allowedRoles.includes(request.currentUser.role)) {
      reply.code(403).send({ error: "Forbidden" });
    }
  };
}

export function authorizeSiteAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  siteId: string
) {
  const { role, siteIds } = request.currentUser;
  if (role === "super_admin") return true;
  if (!siteIds.includes(siteId)) {
    reply.code(403).send({ error: "No access to this site" });
    return false;
  }
  return true;
}
