import React, { useEffect } from "react";
import "./ResumenHerramientas.css";

const ResumenHerramientas = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.2 }
    );

    const elements = document.querySelectorAll(".slide-in-zoom");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="resumen">
      {/* Hero Section */}
      <div className="hero-section slide-in-zoom">
        <img
          src="/logo-eatbalance.png"   // si está en /public
          alt="EatBalance: salud y nutrición inteligente"
          className="hero-image"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <h1 className="hero-title">Tus herramientas de nutrición</h1>
        <p className="hero-subtitle">
          Primero calcula tu plan de dieta con <strong>BMR</strong>, <strong>TDEE</strong> y{" "}
          <strong>macros</strong>. Después conviértelo en menús reales, ricos y equilibrados.
        </p>
      </div>

      {/* Tools Section */}
      <div className="courses-section slide-in-zoom">
        <h2>¿Por dónde empezamos?</h2>
        <ul>
          <li>
            <strong>Calcula tu plan de dieta</strong>
            <p>
              Introduce tus datos (edad, peso, altura, sexo, actividad y objetivo) y obtén tu{" "}
              BMR (Harris-Benedict), tu TDEE y un reparto de{" "}
              macronutrientesa medida: proteínas,{" "}
              carbohidratos y grasas. Incluimos rango calórico
              recomendado, macros por comida y consejos prácticos según tu objetivo
              (perder grasa, mantener o ganar músculo).
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
            <strong> Genera tus menús con tus macros</strong>
            <p>
              Con tus macros como guía, creamos menús diarios equilibrados (desayuno,
              comida, cena y snacks) respetando tus preferencias (vegetariano, sin
              lactosa, sin gluten…) y evitando lo que no quieras. Verás los totales por
              comida y por día, tendrás sustituciones
              inteligentes y una lista de la compra para hacerlo muy fácil.
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
