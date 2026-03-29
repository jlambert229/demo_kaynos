import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async () => {
    const data = await api.auth.login({});
    setUser(data.user);
    return data.user;
  };

  const tenantLogin = async () => {
    return user;
  };

  const logout = async () => {
    // In demo mode, just re-fetch the demo user
    const data = await api.auth.me();
    setUser(data.user);
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
