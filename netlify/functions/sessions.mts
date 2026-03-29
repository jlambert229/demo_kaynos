import type { Context } from "@netlify/functions";
import { SESSIONS, SESSION_NOTES, USERS, SCHOOL, DEFAULT_USER, IS_STUDENT_DEMO } from "./lib/demo-data.mts";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/sessions");

router.get("/", async (req) => {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  let sessions = [...SESSIONS];
  if (IS_STUDENT_DEMO) {
    sessions = sessions.filter((s) => s.student_id === DEFAULT_USER.id);
  } else if (studentId) {
    sessions = sessions.filter((s) => s.student_id === studentId);
  }
  const allTags = [...new Set(sessions.flatMap((s) => s.tags || []))];
  return json({ sessions, tags: allTags });
});

router.get("/:id", async (_req, ctx) => {
  const session = SESSIONS.find((s) => s.id === ctx.params.id);
  if (!session) return json({ error: "Not found" }, 404);
  const notes = SESSION_NOTES[session.id] || [];
  return json({ session: { ...session, notes } });
});

router.post("/", async (req) => {
  const body = await req.json().catch(() => ({}));
  const student = USERS.find((u) => u.id === body.studentId);
  const newSession = {
    id: crypto.randomUUID(),
    school_id: SCHOOL.id,
    instructor_id: USERS[0].id,
    student_id: body.studentId,
    title: body.title || "New Session",
    date: body.date || new Date().toISOString().split("T")[0],
    duration: null,
    video_key: body.videoKey || null,
    video_status: body.videoKey ? "ready" : null,
    vimeo_id: null,
    tags: body.tags || [],
    created_at: new Date().toISOString(),
    student_name: student?.name || "Student",
    instructor_name: USERS[0].name,
    note_count: "0",
    viewed: false,
  };
  return json({ session: newSession });
});

router.patch("/:id", async (req, ctx) => {
  const session = SESSIONS.find((s) => s.id === ctx.params.id);
  if (!session) return json({ error: "Not found" }, 404);
  const body = await req.json().catch(() => ({}));
  return json({ session: { ...session, ...body } });
});

router.delete("/:id", async () => {
  return json({ ok: true });
});

router.post("/view", async () => {
  return json({ ok: true });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Sessions")(req);
