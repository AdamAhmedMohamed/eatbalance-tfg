// src/components/hooks/useAuth.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../../api/http";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("eb_token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  // token → Auth header
  api.interceptors.request.use((cfg) => {
    const t = localStorage.getItem("eb_token");
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });

  useEffect(() => {
    const boot = async () => {
      if (!token) return;
      try {
        const { data } = await api.get("/users/me");
        setUser(data);
      } catch (e) {
        console.error("me error", e);
        localStorage.removeItem("eb_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [token]);

  // -------- CAMBIO IMPORTANTE --------
  // Registro: enviar full_name y luego auto-login
  const register = async ({ username, email, password }) => {
    // 1) Registrar con nombres que espera el backend
    await api.post("/auth/register", {
      email,
      password,
      full_name: username || email, // por si el user no pone nombre
    });

    // 2) Auto-login (form-urlencoded)
    const params = new URLSearchParams();
    params.append("username", email);    // el backend espera "username" (usa OAuth2 form)
    params.append("password", password);
    const { data } = await api.post("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("eb_token", data.access_token);
    setToken(data.access_token);

    const me = await api.get("/users/me");
    setUser(me.data);
  };

  // -------- CAMBIO IMPORTANTE --------
  // Login directo (form-urlencoded)
  const login = async ({ email, password }) => {
    const params = new URLSearchParams();
    params.append("username", email);  // el backend llama "username" al email
    params.append("password", password);

    const { data } = await api.post("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("eb_token", data.access_token);
    setToken(data.access_token);

    const me = await api.get("/users/me");
    setUser(me.data);
  };

  const logout = () => {
    localStorage.removeItem("eb_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, register, login, logout }), [user, token, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
