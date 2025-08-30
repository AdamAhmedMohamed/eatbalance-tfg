import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./welcome.css";

export default function Welcome() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const { token, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const goTo = location.state?.from || "/";

  // 👉 estilo "pantalla completa" y ocultar navbar + chatbot SOLO aquí
  useEffect(() => {
    document.body.classList.add("welcome-page");
    return () => document.body.classList.remove("welcome-page");
  }, []);

  // permitir /welcome?mode=login|register
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const m = q.get("mode");
    if (m === "login" || m === "register") setMode(m);
  }, [location.search]);

  // si vino rebotado de una ruta privada ya autenticado, entra
  useEffect(() => {
    if (token && location.state?.from) navigate("/", { replace: true });
  }, [token, location.state, navigate]);

  function resetMessages() {
    setMsg(""); setErr("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email, password: pass });
        setMsg("¡Sesión iniciada!");
      } else {
        await register({ username: fullName, email, password: pass });
        setMsg("¡Cuenta creada!");
      }
      navigate(goTo, { replace: true });
    } catch (error) {
      const apiMsg = error?.response?.data?.detail;
      setErr(
        apiMsg
          ? Array.isArray(apiMsg) ? apiMsg.map(m => m.msg).join(" • ") : String(apiMsg)
          : "No se pudo completar la operación."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wl-stage">
      {/* HERO estilo “Messi website” */}
      <header className="wl-hero">
        <div className="wl-logo-wrap">
          <img src="/sip.png" alt="EatBalance" className="wl-logo" />
          <span className="wl-glow" aria-hidden />
        </div>
        <h1 className="wl-title">EatBalance</h1>
        <p className="wl-tag">Plan nutricional inteligente</p>
      </header>

      {token && !location.state?.from && (
        <div className="wl-info">
          Ya has iniciado sesión.
          <button type="button" onClick={() => navigate("/", { replace: true })}>Ir a la portada</button>
          <button type="button" onClick={() => logout()}>Cerrar sesión</button>
        </div>
      )}

      {/* CARD */}
      <div className="welcome-card">
        <div className="welcome-tabs">
          <button
            className={`tab-btn ${mode === "login" ? "is-active" : ""}`}
            onClick={() => { setMode("login"); resetMessages(); }}
          >Iniciar sesión</button>
          <button
            className={`tab-btn ${mode === "register" ? "is-active" : ""}`}
            onClick={() => { setMode("register"); resetMessages(); }}
          >Registrarse</button>
        </div>

        <form className="welcome-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="fgroup">
              <label>Nombre completo</label>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div className="fgroup">
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
              required
            />
          </div>

          <div className="fgroup">
            <label>Contraseña</label>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="welcome-submit" type="submit" disabled={loading}>
            {loading ? "Procesando…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>

          {msg && <div className="welcome-msg ok">{msg}</div>}
          {err && <div className="welcome-msg err">{err}</div>}
        </form>

        <div className="welcome-footer">
          <small>© {new Date().getFullYear()} EatBalance</small>
        </div>
      </div>
    </div>
  );
}
