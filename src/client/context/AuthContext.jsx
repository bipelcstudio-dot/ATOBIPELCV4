import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const d = await api("/auth/me");
      setUser(d.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    const d = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    setUser(d.user);
    return d.user;
  }

  async function setupAdmin(data) {
    const d = await api("/auth/setup", {
      method: "POST",
      body: JSON.stringify(data),
    });

    return d;
  }

  async function logout() {
    await api("/auth/logout", {
      method: "POST",
    }).catch(() => {});

    setUser(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refresh,
        setupAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);