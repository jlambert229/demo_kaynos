import type { Context } from "@netlify/functions";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/tenant");

router.post("/login", async () => {
  return json({ error: "Tenant login disabled in demo" }, 403);
});

router.get("/me", async () => {
  return json({ error: "Tenant access disabled in demo" }, 403);
});

router.get("/schools", async () => {
  return json({ schools: [] });
});

router.get("/stats", async () => {
  return json({ total_schools: 0, total_users: 0, total_students: 0, total_sessions: 0, total_classes: 0 });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Tenant")(req);
