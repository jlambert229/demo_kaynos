export default function DemoBanner() {
  return (
    <div className="demo-banner">
      <span className="demo-banner-badge">DEMO</span>
      <span className="demo-banner-text">
        You're viewing a demo of Kaynos with sample data for South Houston Jiu-Jitsu.
      </span>
      <a
        href="https://kaynos.net"
        className="demo-banner-cta"
        target="_blank"
        rel="noopener noreferrer"
      >
        Get Started &rarr;
      </a>
    </div>
  );
}
