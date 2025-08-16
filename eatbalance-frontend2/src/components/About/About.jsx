import React from 'react';
import './About.css';
import useAnimation from "../hooks/useAnimation";

const About = () => {
  useAnimation(".animated");

  return (
    <div>
      {/* olas del fondo */}
      <div className="wave-background">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      {/* bloque principal */}
      <div className="about-container animated">
        <div className="about-content animated">
          <div className="consultoria animated">
            <span className="badge-premium animated">Suscripción Premium</span>
            <h1 className="about-title animated">Asesoría Nutricional Privada</h1>

            <p className="about-text animated">
              En <b>EatBalance</b> ofrecemos un servicio de alto nivel con
              <b> médicos</b>, <b>dietistas-nutricionistas</b> y <b>entrenadores personales</b> con más de
              <b> 10 años de experiencia</b>. Diseñamos tu estrategia integral:
              evaluación clínica inicial, cálculo <i>BMR/TDEE</i>, reparto de <i>macros</i>,
              menús a medida y periodización del entrenamiento.
            </p>

            <ul className="about-list animated">
              <li>Evaluación inicial y revisión de historia clínica.</li>
              <li>Seguimiento semanal con ajustes de macros y menús.</li>
              <li>Entrenamiento personalizado y corrección de técnica.</li>
              <li>Soporte prioritario por chat/email.</li>
            </ul>

            <p className="about-text animated" style={{ marginTop: '0.8rem' }}>
              Disponible mediante <b>suscripción mensual</b>. ¿Quieres más información o una
              <b> asesoría privada</b> con nuestro equipo? Contáctanos.
            </p>

            <div className="cta-row animated">
              <a href="/contact" className="about-button">Solicitar asesoría privada</a>
              {/* botón de suscripción eliminado a petición */}
            </div>
          </div>
        </div>
      </div>

      {/* bloque secundario */}
      <section className="why-quark-techie animated">
        <div className="container animated">
          <h2 className="animated">¿Por qué elegir <span className="brand">EatBalance</span>?</h2>
          <div className="why-quark-techie-img-p animated">
            <p className="why-quark-techie-p animated">
              <b>
                Rigor clínico, resultados sostenibles y una experiencia realmente personalizada.
                Unimos ciencia, nutrición y entrenamiento para que avances con seguridad y estilo.
              </b>
            </p>
          </div>

          {/* imagen inferior: usa si.png */}
          <img
            src="/public/eatbalance_esquina.png"
            alt="EatBalance"
            className="about-below-image animated"
          />
        </div>
      </section>
    </div>
  );
};

export default About;
