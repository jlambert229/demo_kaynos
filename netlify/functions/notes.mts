import type { Context } from "@netlify/functions";
import { USERS } from "./lib/demo-data.mts";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/notes");

router.post("/session/:sessionId", async (req) => {
  const body = await req.json().catch(() => ({}));
  const note = {
    id: crypto.randomUUID(),
    session_id: null,
    timestamp_seconds: body.timestampSeconds || 0,
    type: "note",
    text: body.text || "",
    author_id: USERS[0].id,
    author_name: USERS[0].name,
    author_role: USERS[0].role,
    created_at: new Date().toISOString(),
  };
  return json({ note });
});

router.post("/class/:classId", async (req) => {
  const body = await req.json().catch(() => ({}));
  const note = {
    id: crypto.randomUUID(),
    class_id: null,
    timestamp_seconds: body.timestampSeconds || 0,
    type: "note",
    text: body.text || "",
    author_id: USERS[0].id,
    author_name: USERS[0].name,
    author_role: USERS[0].role,
    created_at: new Date().toISOString(),
  };
  return json({ note });
});

router.patch("/:noteId", async (req) => {
  const body = await req.json().catch(() => ({}));
  return json({
    note: {
      id: crypto.randomUUID(),
      text: body.text || "",
      timestamp_seconds: body.timestampSeconds || 0,
    },
  });
});

router.delete("/:noteId", async () => {
  return json({ ok: true });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Notes")(req);
