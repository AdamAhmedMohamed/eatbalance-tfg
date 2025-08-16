// src/components/Footer/Footer.jsx
import React from "react";
import useAnimation from "../../hooks/useAnimation";
import "./Footer.css";

const Footer = React.forwardRef(({ className = "" }, ref) => {
  useAnimation(".footer.animated");
  const year = new Date().getFullYear();

  return (
    <footer className={`footer animated ${className}`} ref={ref} aria-label="Pie de página">
      <div className="footer-content">
        <div className="footer-brand">
          <img
            src="/logo-eatbalance.svg"
            alt="EatBalance"
            className="footer-logo"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <p className="footer-text">© {year} EatBalance. Todos los derechos reservados.</p>
        </div>

        <nav className="footer-links" aria-label="Enlaces legales">
          <a href="/contacto" className="footer-link">Contacto</a>
          <a href="/legal/privacidad" className="footer-link">Privacidad</a>
          <a href="/legal/terminos" className="footer-link">Términos</a>
        </nav>

        <div className="footer-contact" aria-label="Información de contacto">
          <a className="footer-link" href="mailto:contacto@eatbalance.app">contacto@eatbalance.app</a>
          <span className="sep">·</span>
          <a className="footer-link" href="tel:+34600000000">+34 600 000 000</a>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
