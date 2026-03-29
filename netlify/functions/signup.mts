import type { Context } from "@netlify/functions";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/signup");

router.post("/", async () => {
  return json({
    school: { name: "Demo School" },
    emailSent: false,
  });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Signup")(req);
