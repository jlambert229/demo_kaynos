import type { Context } from "@netlify/functions";
import { VIDEO_USAGE } from "./lib/demo-data.mts";
import { json } from "./lib/middleware.mts";
import { createRouter, withErrorHandling } from "./lib/router.mts";

const router = createRouter("/api/video");

router.post("/upload-url", async () => {
  return json({
    multipart: false,
    uploadUrl: "https://demo.example.com/upload",
    key: `demo/video-${Date.now()}.mp4`,
  });
});

router.post("/complete-multipart", async () => {
  return json({ ok: true });
});

router.post("/abort-multipart", async () => {
  return json({ ok: true });
});

router.post("/confirm-upload", async () => {
  return json({ ok: true });
});

router.get("/playback-url", async () => {
  return json({ url: null });
});

router.get("/usage", async () => {
  return json({ usage: VIDEO_USAGE });
});

export default async (req: Request, context: Context) =>
  withErrorHandling(router, "Video")(req);
