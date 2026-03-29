import type { Context } from "@netlify/functions";
import { CLASSES, CLASS_NOTES, USERS, SCHOOL } from "./lib/demo-data.mts";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/classes");

router.get("/", async () => {
  const allTags = [...new Set(CLASSES.flatMap((c) => c.tags || []))];
  return json({ classes: CLASSES, tags: allTags });
});

router.get("/:id", async (_req, ctx) => {
  const cls = CLASSES.find((c) => c.id === ctx.params.id);
  if (!cls) return json({ error: "Not found" }, 404);
  const notes = CLASS_NOTES[cls.id] || [];
  return json({ class: { ...cls, notes } });
});

router.post("/", async (req) => {
  const body = await req.json().catch(() => ({}));
  const newClass = {
    id: crypto.randomUUID(),
    school_id: SCHOOL.id,
    instructor_id: USERS[0].id,
    title: body.title || "New Class",
    date: body.date || new Date().toISOString().split("T")[0],
    duration: null,
    description: body.description || null,
    video_key: body.videoKey || null,
    video_status: body.videoKey ? "ready" : null,
    vimeo_id: null,
    tags: body.tags || [],
    created_at: new Date().toISOString(),
    instructor_name: USERS[0].name,
    note_count: "0",
    viewed: false,
  };
  return json({ class: newClass });
});

router.patch("/:id", async (req, ctx) => {
  const cls = CLASSES.find((c) => c.id === ctx.params.id);
  if (!cls) return json({ error: "Not found" }, 404);
  const body = await req.json().catch(() => ({}));
  return json({ class: { ...cls, ...body } });
});

router.delete("/:id", async () => {
  return json({ ok: true });
});

router.post("/view", async () => {
  return json({ ok: true });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Classes")(req);
