import type { Context } from "@netlify/functions";
import { SCHOOL, STATS, ACTIVITY, TAGS } from "./lib/demo-data.mts";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/school");

router.get("/", async () => {
  return json({
    school: {
      name: SCHOOL.name,
      created_at: SCHOOL.created_at,
      plan: SCHOOL.plan,
      plan_status: SCHOOL.plan_status,
      trial_ends_at: SCHOOL.trial_ends_at,
      video_limit: SCHOOL.video_limit,
      storage_limit_bytes: SCHOOL.storage_limit_bytes,
    },
  });
});

router.patch("/", async (req) => {
  const body = await req.json().catch(() => ({}));
  return json({
    school: {
      name: body.name || SCHOOL.name,
      created_at: SCHOOL.created_at,
    },
  });
});

router.get("/stats", async () => {
  return json({ stats: STATS });
});

router.get("/activity", async () => {
  return json({ activity: ACTIVITY });
});

router.get("/tags", async () => {
  return json({ tags: TAGS });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "School")(req);
