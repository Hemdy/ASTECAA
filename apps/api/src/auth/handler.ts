import { and, eq, sql } from "drizzle-orm";
import type { AuthConfiguration } from "./auth.ts";
import type { createDatabase } from "../db/database.ts";
import { ApiError, errorResponse } from "../core/errors.ts";
import { handleEventsRequest } from "../modules/events/events.handler.ts";
import {
  appUsers,
  authIdentities,
  roles,
  userRoles,
} from "../../../../infrastructure/database/schema.ts";

type Database = ReturnType<typeof createDatabase>;

export function createAuthHandler(
  configuration: AuthConfiguration,
  database?: Database,
) {
  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get("Origin");
    let response: Response;

    try {
      response = await dispatchRequest(
        request,
        origin,
        configuration,
        database,
      );
    } catch (error) {
      response = errorResponse(error, requestId);
    }

    return applyResponseHeaders(
      response,
      origin,
      requestId,
      configuration.allowedOrigins,
    );
  };
}

async function dispatchRequest(
  request: Request,
  origin: string | null,
  configuration: AuthConfiguration,
  database: Database | undefined,
): Promise<Response> {
  if (origin && !configuration.allowedOrigins.has(origin)) {
    throw new ApiError(403, "Origin is not allowed.", "ORIGIN_NOT_ALLOWED");
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Authorization, Content-Type, X-CSRF-Token, X-Requested-With",
        "Access-Control-Max-Age": "600",
      },
    });
  }

  const url = new URL(request.url);
  if (url.pathname === "/health" && request.method === "GET") {
    return Response.json({ status: "ok" });
  }

  if (url.pathname === "/ready" && request.method === "GET") {
    if (!database) {
      throw new ApiError(503, "The API is not ready.", "NOT_READY");
    }
    await database.execute(sql`select 1`);
    return Response.json({ status: "ready" });
  }

  if (
    database &&
    (url.pathname.startsWith("/api/v1/events") ||
      url.pathname.startsWith("/api/admin/v1/events"))
  ) {
    if (
      url.pathname.startsWith("/api/admin/v1/events") &&
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      !origin
    ) {
      throw new ApiError(
        403,
        "An allowed browser origin is required.",
        "ORIGIN_REQUIRED",
      );
    }
    return handleEventsRequest(request, database, configuration);
  }

  if (database && url.pathname === "/api/v1/me" && request.method === "GET") {
    return getCurrentIdentity(request, origin, configuration, database);
  }

  if (!url.pathname.startsWith("/api/auth/")) {
    throw new ApiError(
      404,
      "The requested endpoint was not found.",
      "NOT_FOUND",
    );
  }

  return configuration.auth.handler(request);
}

async function getCurrentIdentity(
  request: Request,
  origin: string | null,
  configuration: AuthConfiguration,
  database: Database,
): Promise<Response> {
  const session = await configuration.auth.api.getSession({
    headers: request.headers,
  });
  if (!session) {
    throw new ApiError(401, "Authentication is required.", "UNAUTHENTICATED");
  }

  const [identity] = await database
    .select({
      id: appUsers.id,
      email: appUsers.email,
      fullName: appUsers.fullName,
      phone: appUsers.phone,
    })
    .from(authIdentities)
    .innerJoin(appUsers, eq(appUsers.id, authIdentities.userId))
    .where(
      and(
        eq(authIdentities.issuer, new URL(configuration.baseUrl).origin),
        eq(authIdentities.subject, session.user.id),
        eq(appUsers.status, "active"),
      ),
    )
    .limit(1);

  if (!identity) {
    throw new ApiError(403, "This account is not active.", "ACCOUNT_INACTIVE");
  }

  const roleAssignments = await database
    .select({ role: roles.code })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, identity.id));
  const role =
    roleAssignments.some((assignment) => assignment.role === "super_admin")
      ? "super_admin"
      : roleAssignments.some((assignment) => assignment.role === "admin")
      ? "admin"
      : "alumni";

  return Response.json({
    id: identity.id,
    email: identity.email,
    full_name: identity.fullName ?? session.user.name,
    role,
    is_active: true,
    phone: identity.phone,
  });
}

function applyResponseHeaders(
  response: Response,
  origin: string | null,
  requestId: string,
  allowedOrigins: ReadonlySet<string>,
): Response {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Request-Id", requestId);
  response.headers.append("Vary", "Origin");

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return response;
}
