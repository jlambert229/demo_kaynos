import { NavLink } from "react-router-dom";
import { useAuth } from "../auth";
import AppIcon from "./AppIcon";

export default function MobileNav() {
  const { isInstructor, isAdmin } = useAuth();

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Primary navigation">
      {isInstructor ? (
        <>
          <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Home dashboard">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="house" size={24} /></span>
            <span>Home</span>
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Students">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="busts-in-silhouette" size={24} /></span>
            <span>Students</span>
          </NavLink>
          <NavLink to="/sessions" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="All sessions">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="clapper-board" size={24} /></span>
            <span>Sessions</span>
          </NavLink>
          <NavLink to="/classes" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Classes">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="clipboard" size={24} /></span>
            <span>Classes</span>
          </NavLink>
          <NavLink to="/activity" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Activity">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="chart-increasing" size={24} /></span>
            <span>Activity</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Admin">
              <span className="mobile-nav-icon" aria-hidden><AppIcon name="gear" size={24} /></span>
              <span>Admin</span>
            </NavLink>
          )}
          <NavLink to="/support" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Support">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="speech-balloon" size={24} /></span>
            <span>Support</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Profile">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="bust-in-silhouette" size={24} /></span>
            <span>Profile</span>
          </NavLink>
        </>
      ) : (
        <>
          <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Home dashboard">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="house" size={24} /></span>
            <span>Home</span>
          </NavLink>
          <NavLink to="/sessions" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="My sessions">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="clapper-board" size={24} /></span>
            <span>Sessions</span>
          </NavLink>
          <NavLink to="/classes" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Classes">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="clipboard" size={24} /></span>
            <span>Classes</span>
          </NavLink>
          <NavLink to="/support" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Support">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="speech-balloon" size={24} /></span>
            <span>Support</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`} aria-label="Profile">
            <span className="mobile-nav-icon" aria-hidden><AppIcon name="bust-in-silhouette" size={24} /></span>
            <span>Profile</span>
          </NavLink>
        </>
      )}
    </nav>
  );
}
