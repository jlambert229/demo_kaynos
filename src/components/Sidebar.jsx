import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../auth";
import KaynosLogo from "./KaynosLogo";
import AppIcon from "./AppIcon";

export default function Sidebar() {
  const { user, logout, isInstructor, isAdmin } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <KaynosLogo />
          <h2>Kaynos</h2>
        </div>
        <span>{user.schoolName}</span>
      </div>
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        {isInstructor ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="Dashboard home">
              <span className="nav-icon" aria-hidden><AppIcon name="house" size={20} /></span> Dashboard
            </NavLink>
            <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="Students">
              <span className="nav-icon" aria-hidden><AppIcon name="busts-in-silhouette" size={20} /></span> Students
            </NavLink>
            <NavLink to="/sessions" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="All sessions">
              <span className="nav-icon" aria-hidden><AppIcon name="clapper-board" size={20} /></span> Sessions
            </NavLink>
            <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="Classes">
              <span className="nav-icon" aria-hidden><AppIcon name="clipboard" size={20} /></span> Classes
            </NavLink>
            <NavLink to="/activity" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="Student activity">
              <span className="nav-icon" aria-hidden><AppIcon name="chart-increasing" size={20} /></span> Activity
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="Administration">
                <span className="nav-icon" aria-hidden><AppIcon name="gear" size={20} /></span> Admin
              </NavLink>
            )}
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="Dashboard home">
              <span className="nav-icon" aria-hidden><AppIcon name="house" size={20} /></span> Dashboard
            </NavLink>
            <NavLink to="/sessions" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="My sessions">
              <span className="nav-icon" aria-hidden><AppIcon name="clapper-board" size={20} /></span> My Sessions
            </NavLink>
            <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} aria-label="Classes">
              <span className="nav-icon" aria-hidden><AppIcon name="clipboard" size={20} /></span> Classes
            </NavLink>
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/support" className={({ isActive }) => `nav-item nav-item-support ${isActive ? "active" : ""}`} aria-label="Get support">
          <span className="nav-icon" aria-hidden><AppIcon name="speech-balloon" size={18} /></span> Support
        </NavLink>
        <Link to="/profile" className="user-badge" style={{ textDecoration: "none", color: "inherit" }} aria-label="Open your profile">
          <div className="user-avatar">{user.name[0]}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role === "admin" ? "School Admin" : user.role}</div>
          </div>
          <span className="session-card-arrow" style={{ opacity: 0.4 }}>›</span>
        </Link>
      </div>
    </div>
  );
}
