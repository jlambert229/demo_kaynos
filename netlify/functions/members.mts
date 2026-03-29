import type { Context } from "@netlify/functions";
import { USERS } from "./lib/demo-data.mts";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/members");

router.get("/", async () => {
  return json({
    members: USERS.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
    })),
  });
});

router.post("/", async (req) => {
  const body = await req.json().catch(() => ({}));
  const newMember = {
    id: crypto.randomUUID(),
    name: body.name || "New Student",
    email: body.email || "new@demo.com",
    role: body.role || "student",
    created_at: new Date().toISOString(),
  };
  return json({ member: newMember, emailSent: false });
});

router.patch("/:id", async (req, ctx) => {
  const user = USERS.find((u) => u.id === ctx.params.id);
  if (!user) return json({ error: "Not found" }, 404);
  const body = await req.json().catch(() => ({}));
  return json({
    member: { ...user, ...body },
  });
});

router.delete("/:id", async (_req, ctx) => {
  return json({ ok: true });
});

router.post("/:id/reset-password", async (_req, ctx) => {
  return json({ ok: true, emailSent: false });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Members")(req);
