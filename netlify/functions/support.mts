import type { Context } from "@netlify/functions";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/support");

router.post("/", async () => {
  return json({
    message: "Support request received (demo mode)",
    reference: `DEMO-${Date.now()}`,
  });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Support")(req);
