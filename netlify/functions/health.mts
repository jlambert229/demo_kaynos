import { json } from "./lib/middleware.mts";

export default async () => {
  return json({
    status: "ok",
    mode: "demo",
    timestamp: new Date().toISOString(),
  });
};
