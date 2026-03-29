import { Component } from "react";
import AppIcon from "./AppIcon";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div className="empty-state" style={{ textAlign: "center", padding: 40 }}>
            <div className="icon"><AppIcon name="warning" size={48} /></div>
            <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
              An unexpected error occurred. Please reload the page.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.location.reload()}
              style={{ height: 40, fontSize: 14 }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
