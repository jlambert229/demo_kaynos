import type { Context } from "@netlify/functions";
import { DEFAULT_USER, SCHOOL } from "./lib/demo-data.mts";
import { json, authCookie, clearAuthCookie } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/auth");

router.post("/login", async () => {
  return json(
    {
      user: {
        id: DEFAULT_USER.id,
        name: DEFAULT_USER.name,
        email: DEFAULT_USER.email,
        role: DEFAULT_USER.role,
        schoolId: SCHOOL.id,
        schoolName: SCHOOL.name,
      },
    },
    200,
    { "Set-Cookie": authCookie("demo-token") }
  );
});

router.post("/logout", () => {
  return json({ ok: true }, 200, { "Set-Cookie": clearAuthCookie() });
});

router.get("/me", async () => {
  return json({
    user: {
      id: DEFAULT_USER.id,
      name: DEFAULT_USER.name,
      email: DEFAULT_USER.email,
      role: DEFAULT_USER.role,
      schoolId: SCHOOL.id,
      schoolName: SCHOOL.name,
      createdAt: DEFAULT_USER.created_at,
      emailNotifications: DEFAULT_USER.email_notifications,
    },
  });
});

router.patch("/profile", async () => {
  return json({
    user: {
      id: DEFAULT_USER.id,
      name: DEFAULT_USER.name,
      email: DEFAULT_USER.email,
      role: DEFAULT_USER.role,
      schoolId: SCHOOL.id,
      schoolName: SCHOOL.name,
      emailNotifications: DEFAULT_USER.email_notifications,
    },
  });
});

router.post("/change-password", async () => {
  return json({ ok: true });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Auth")(req);
