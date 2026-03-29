export function PageLoadingSkeleton({ titleWidth = "40%" }) {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Loading">
      <div className="page-header">
        <div className="sk-line sk-line-sm" style={{ width: 120 }} />
        <div className="sk-line sk-title" style={{ width: titleWidth }} />
        <div className="sk-line sk-line-sm" style={{ width: "55%" }} />
      </div>
      <div className="page-body">
        <div className="sk-card" />
        <div className="sk-line" style={{ width: "100%", marginTop: 20 }} />
        <div className="sk-line" style={{ width: "92%" }} />
        <div className="sk-line" style={{ width: "70%" }} />
      </div>
    </div>
  );
}
