export default function KaynosLogo({ size = "md" }) {
  const h = size === "lg" ? 6 : 4;
  const w = size === "lg" ? 48 : 30;
  const redW = size === "lg" ? 6 : 4;
  const tailW = size === "lg" ? 10 : 6;
  const redX = w - tailW - redW;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      className={`kaynos-logo kaynos-logo--${size}`}
      style={{ display: "inline-block", verticalAlign: "middle" }}
      aria-hidden
    >
      <rect x={0} y={0} width={w} height={h} fill="#1a1a1a" />
      <rect x={redX} y={0} width={redW} height={h} fill="#c62828" />
      <rect x={0} y={0} width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
    </svg>
  );
}
