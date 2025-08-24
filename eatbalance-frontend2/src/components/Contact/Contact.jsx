import React, { useState } from "react";
import "./Contact.css";
import Swal from "sweetalert2";

const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL;
const API_KEY     = import.meta.env.VITE_MAKE_APIKEY;

const Contact = () => {
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();

    const honeypot = event.target.elements.company?.value;
    if (honeypot) return;

    if (!WEBHOOK_URL || !API_KEY) {
      Swal.fire({ title: "Configuración incompleta", text: "Faltan VITE_MAKE_WEBHOOK_URL o VITE_MAKE_APIKEY.", icon: "error" });
      return;
    }

    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData);
    payload.formType = payload.formType || "contact";
    payload.site = payload.site || "EatBalance";
    payload.meta = { userAgent: navigator.userAgent, url: window.location.href, ts: new Date().toISOString() };

    try {
      setLoading(true);
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "x-make-apikey": API_KEY },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Swal.fire({ title: "¡Mensaje enviado con éxito!", text: "Te responderemos lo antes posible.", icon: "success", confirmButtonColor: "#22c55e" });
        event.target.reset();
      } else {
        let detail = "";
        try { detail = (await res.json())?.message || ""; } catch {}
        Swal.fire({ title: "Error al enviar", text: detail || "Inténtalo de nuevo en unos minutos.", icon: "error" });
      }
    } catch {
      Swal.fire({ title: "Error de conexión", text: "Verifica tu conexión a Internet.", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact">
      <div className="contact__overlay" aria-hidden="true" />

      <form onSubmit={onSubmit} noValidate className="contact__card" aria-label="Formulario de contacto">
        <p className="contact__kicker">Para cualquier pregunta</p>
        <h1 className="contact__title">Contáctanos</h1>
        <p className="contact__subtitle">
          Completa el formulario y te contestaremos pronto. También puedes escribir a{" "}
          <a href="mailto:contacto@eatbalance.app">contacto@eatbalance.app</a>.
        </p>

        <div className="input-row">
          <div className="input-box">
            <label htmlFor="name">Nombre completo</label>
            <input id="name" name="name" type="text" className="field" placeholder="Tu nombre" required autoComplete="name" />
          </div>

          <div className="input-box">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" className="field" placeholder="nombre@correo.com" required autoComplete="email" />
          </div>
        </div>

        <div className="input-box">
          <label htmlFor="message">Tu mensaje</label>
          <textarea id="message" name="message" className="field mess" placeholder="Cuéntanos en qué podemos ayudarte" required rows={6} />
        </div>

        {/* Ocultos */}
        <input type="hidden" name="formType" value="contact" />
        <input type="hidden" name="site" value="EatBalance" />
        <input type="text" name="company" className="hp" tabIndex="-1" autoComplete="off" />

        {/* 👇 clase propia para NO afectar otros botones */}
        <button type="submit" className={`contact__btn${loading ? " is-loading" : ""}`} disabled={loading}>
          {loading ? "Enviando…" : "Enviar mensaje"}
        </button>
      </form>
    </section>
  );
};

export default Contact;
