import React, { useEffect } from "react";
import "./ResumenHerramientas.css";

const ResumenHerramientas = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.2 }
    );
    document.querySelectorAll(".slide-in-zoom").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="resumen">
      {/* HERO full-bleed */}
      <section className="hero-section hero-bleed slide-in-zoom">
        <img
          src="/logo-eatbalance.png"
          alt="EatBalance: salud y nutrición inteligente"
          className="hero-image"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <div className="hero-glass">
          <h1 className="hero-title">
            <span className="lead">Tus herramientas de</span>{" "}
            <span className="accent">nutrición</span>
          </h1>
          <p className="hero-subtitle">
            Primero calcula tu plan de dieta con <strong>BMR</strong>, <strong>TDEE</strong> y{" "}
            <strong>macros</strong>. Después conviértelo en menús reales, ricos y equilibrados.
          </p>
        </div>
      </section>

      {/* Bloque listado */}
      <div className="courses-section slide-in-zoom">
        <h2>¿Por dónde empezamos?</h2>
        <ul>
          <li>
            <strong>Calcula tu plan de dieta</strong>
            <p>
              Introduce tus datos (edad, peso, altura, sexo, actividad y objetivo) y obtén tu
              BMR (Harris-Benedict), tu TDEE y un reparto de macronutrientes a medida:
              proteínas, carbohidratos y grasas. Incluimos rango calórico recomendado, macros por
              comida y consejos prácticos según tu objetivo (perder grasa, mantener o ganar músculo).
            </p>
            <button
              className="sky-blue-button"
              onClick={() => (window.location.href = "/Curso")}
              aria-label="Calcular mi plan"
            >
              Calcular mi plan
            </button>
          </li>

          <li>
            <strong>Genera tus menús con tus macros</strong>
            <p>
              Con tus macros como guía, creamos menús diarios equilibrados (desayuno, comida, cena y
              snacks) respetando tus preferencias (vegetariano, sin lactosa, sin gluten…) y evitando lo
              que no quieras. Verás los totales por comida y por día, tendrás sustituciones inteligentes
              y una lista de la compra para hacerlo muy fácil.
            </p>
            <button
              className="sky-blue-button"
              onClick={() => (window.location.href = "/bdd-automatizacion")}
              aria-label="Generar mis menús"
            >
              Generar mis menús
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ResumenHerramientas;
