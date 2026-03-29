import { useAuth } from "../auth";

export default function DemoBanner() {
  const { isInstructor } = useAuth();

  return (
    <div className="demo-banner">
      <span className="demo-banner-badge">DEMO</span>
      <span className="demo-banner-text">
        {isInstructor
          ? "Instructor view - managing South Houston Jiu-Jitsu as Coach Marcus."
          : "Student view - training at South Houston Jiu-Jitsu as Jake Thompson."}
      </span>
      <a
        href={isInstructor ? "https://student.kaynos.net" : "https://demo.kaynos.net"}
        className="demo-banner-cta"
      >
        {isInstructor ? "Student View" : "Instructor View"} &rarr;
      </a>
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
