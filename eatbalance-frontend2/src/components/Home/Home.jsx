import React from "react";
import useAnimation from "../hooks/useAnimation";
import "./Home.css";
import "../../App.css"; // Estilos globales

const Home = () => {
  useAnimation(".animated");

  return (
    <div className="home">
      {/* Logo principal */}
      <div className="text-container animated">
        <img
          src="/sip.png"
          alt="Logo EatBalance"
          className="title-logo"
        />

        {/* Subtítulo */}
        <p className="subtitle">
          <strong>
            ¡Bienvenido a EatBalance!<br />
            Introduce tus datos y obtén tu plan nutricional personalizado basado en tus objetivos.
          </strong>
        </p>

        {/* Botón principal */}
        <div className="button-container animated">
          <a href="/contact" className="button">
            ¡Hablemos de tu salud!
          </a>
        </div>

        {/* Tarjetas de funcionalidades */}
        <div className="home-sections">
          {/* 1. Calcular Plan Nutricional */}
          <div className="home-section animated">
            <img src="/macros.png" alt="Plan Nutricional" />
            <h3>Calcular tu Plan</h3>
            <p>Introduce tus datos y obtén tu BMR, TDEE y macros.</p>
            <a href="/Curso" className="button">CALCULAR</a>
          </div>

          {/* 2. Generar Menú */}
          <div className="home-section animated">
            <img src="/menus.jpg" alt="Menú Diario" />
            <h3>Generar Menú</h3>
            <p>Crea un menú equilibrado adaptado a ti.</p>
            <a href="/bdd-automatizacion" className="button">VER MENÚ</a>
          </div>

          {/* 3. Consultar Alimento */}
          <div className="home-section animated">
            <img src="/calculadora-calorias.webp" alt="Consulta Alimento" />
            <h3>Consulta Alimentos</h3>
            <p>Busca calorías y macros de cualquier alimento.</p>
            <a href="/Partnership" className="button">CONSULTAR</a>
          </div>

          {/* 4. Asesoría Personalizada */}
          <div className="home-section animated">
            <img src="/Partnership.webp" alt="Asesoría" />
            <h3>Asesoría Nutricional</h3>
            <p>Contacta con nosotros para una planificación guiada.</p>
            <a href="/about" className="button">CONTACTAR</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
