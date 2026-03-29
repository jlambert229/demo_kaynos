import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

const DEMO_USER = {
  id: "b1b2c3d4-0001-4000-8000-000000000001",
  name: "Coach Marcus Rivera",
  email: "coach.marcus@shjj.com",
  role: "admin",
  schoolId: "a1b2c3d4-0001-4000-8000-000000000001",
  schoolName: "South Houston Jiu-Jitsu",
  emailNotifications: true,
  createdAt: "2025-06-15T10:00:00Z",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.auth.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(DEMO_USER));
  }, []);

  const login = async () => {
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const tenantLogin = async () => {
    return DEMO_USER;
  };

  const logout = async () => {
    setUser(DEMO_USER);
  };

  const isTenantAdmin = false;
  const isInstructor = user?.role === "instructor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const updateUser = (updates) => setUser((prev) => prev ? { ...prev, ...updates } : prev);

  return (
    <AuthContext.Provider value={{ user, loading, login, tenantLogin, logout, updateUser, isInstructor, isAdmin, isTenantAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
