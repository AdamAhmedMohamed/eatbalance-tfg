// src/components/pages/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(form);   // envía email y password
    } catch (error) {
      console.error("Login error", error);
      const msg = error?.response?.data?.detail;
      if (msg) setErr(String(msg));
      else setErr("No se pudo iniciar sesión.");
    }
  };

  return (
    <div className="auth-card">
      <h2>Iniciar sesión</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" type="email" value={form.email}
               onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Contraseña" type="password" value={form.password}
               onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit">Entrar</button>
      </form>
      {err && <p className="error">{err}</p>}
      <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
    </div>
  );
}
