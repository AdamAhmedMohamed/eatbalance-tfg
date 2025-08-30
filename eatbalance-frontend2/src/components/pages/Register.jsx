// src/components/pages/Register.jsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await register(form);
    } catch (error) {
      console.error("Register error", error);
      const msg = error?.response?.data?.detail;
      if (msg) setErr(Array.isArray(msg) ? msg.map((m) => m.msg).join(" • ") : String(msg));
      else if (error?.response?.status === 409) setErr("Ya existe una cuenta con ese email.");
      else if (error?.response?.status === 422) setErr("Datos inválidos (revisa email y contraseña).");
      else setErr("No se pudo crear la cuenta.");
    }
  };

  return (
    <div className="auth-card">
      <h2>Crear cuenta</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Nombre (opcional)" value={form.username}
               onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input placeholder="Email" type="email" value={form.email}
               onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Contraseña" type="password" value={form.password}
               onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit">Registrarme</button>
      </form>
      {err && <p className="error">{err}</p>}
      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  );
}
