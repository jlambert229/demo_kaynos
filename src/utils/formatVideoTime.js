/** Human-readable m:ss for video time and note timestamps. */
export function formatVideoClock(secs) {
  if (secs == null || Number.isNaN(secs)) return "0:00";
  const s = Math.floor(Number(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
