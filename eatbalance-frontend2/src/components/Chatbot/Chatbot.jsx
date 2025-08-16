// src/components/Chatbot/ChatbotWidget.jsx
import React, { useState, useEffect } from "react";
import ChatBot from "react-simple-chatbot";
import { ThemeProvider } from "styled-components";
import "./Chatbot.css";

// Paso que navega a una ruta
const NavigateStep = ({ to, label = "Abriendo…" }) => {
  useEffect(() => {
    const t = setTimeout(() => (window.location.href = to), 500);
    return () => clearTimeout(t);
  }, [to]);
  return <span>{label}</span>;
};

// Tema del bot
const theme = {
  background: "#0b1220",
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
  headerBgColor: "#0b1220",
  headerFontColor: "#ffffff",
  headerFontSize: "16px",
  botBubbleColor: "#132036",
  botFontColor: "#e5e7eb",
  userBubbleColor: "#22d3ee",
  userFontColor: "#06121b",
};

const steps = [
  { 
    id: "hi", 
    message: "¡Hola! Soy tu asistente nutricional de EatBalance. Puedo ayudarte a calcular tu plan, buscar alimentos, generar menús o asesoría personalizada. ¿Qué quieres hacer hoy?", 
    trigger: "menu" 
  },

  // --- Menú principal ---
  {
    id: "menu",
    options: [
      { value: "plan", label: "Calcular mi plan (BMR, TDEE y macros)", trigger: "plan_intro" },
      { value: "menus", label: "Generar menús con mis macros", trigger: "menus_intro" },
      { value: "alimentos", label: "Buscar alimentos y ver sus macros", trigger: "alimentos_intro" },
      { value: "asesoria", label: "Asesoría personalizada", trigger: "asesoria_intro" },
      { value: "faqs", label: "Dudas frecuentes", trigger: "faqs" },
    ],
  },

  // --- Calcular plan ---
  { id: "plan_intro", message: "Aquí calculamos tu BMR (Harris-Benedict), TDEE y el reparto de macronutrientes: proteínas, carbohidratos y grasas.", trigger: "plan_options" },
  {
    id: "plan_options",
    options: [
      { value: "ir", label: "Ir a la calculadora de plan", trigger: "go_plan" },
      { value: "que_pide", label: "¿Qué datos me pedirá?", trigger: "plan_fields" },
      { value: "volver", label: "Volver al inicio", trigger: "menu" },
    ],
  },
  { id: "plan_fields", message: "Edad, peso, altura, sexo, nivel de actividad y objetivo (perder grasa, mantener o ganar músculo). A partir de eso te damos calorías objetivo y macros diarios.", trigger: "plan_options" },
  { id: "go_plan", component: <NavigateStep to="/Curso" label="Abriendo la calculadora de plan…" />, asMessage: true, end: true },

  // --- Menús ---
  { id: "menus_intro", message: "¿Ya tienes tus macros calculados o prefieres calcularlos primero?", trigger: "menus_options" },
  {
    id: "menus_options",
    options: [
      { value: "ya_tengo", label: "Ya tengo mis macros", trigger: "go_menus" },
      { value: "calcular", label: "Calcular macros primero", trigger: "go_plan" },
      { value: "volver", label: "Volver al inicio", trigger: "menu" },
    ],
  },
  { id: "go_menus", component: <NavigateStep to="/bdd-automatizacion" label="Abriendo el generador de menús…" />, asMessage: true, end: true },

  // --- Alimentos ---
  { id: "alimentos_intro", message: "En esta sección puedes buscar alimentos de todas las marcas españolas y consultar sus macronutrientes por cada 100g o porción.", trigger: "alimentos_options" },
  {
    id: "alimentos_options",
    options: [
      { value: "ir", label: "Ir al buscador de alimentos", trigger: "go_alimentos" },
      { value: "como_funciona", label: "¿Cómo funciona?", trigger: "alimentos_info" },
      { value: "volver", label: "Volver al inicio", trigger: "menu" },
    ],
  },
  { id: "alimentos_info", message: "Escribe el nombre del alimento (ej: arroz, yogur Danone). Podrás ver proteínas, carbohidratos, grasas y calorías. También puedes ajustar la cantidad en gramos.", trigger: "alimentos_options" },
  { id: "go_alimentos", component: <NavigateStep to="/Partnership" label="Abriendo el buscador de alimentos…" />, asMessage: true, end: true },

  // --- Asesoría ---
  { id: "asesoria_intro", message: "Aquí puedes encontrar asesoría nutricional y más información sobre nuestro proyecto.", trigger: "asesoria_options" },
  {
    id: "asesoria_options",
    options: [
      { value: "ir", label: "Ir a la sección de asesoría", trigger: "go_asesoria" },
      { value: "volver", label: "Volver al inicio", trigger: "menu" },
    ],
  },
  { id: "go_asesoria", component: <NavigateStep to="/about" label="Abriendo la sección de asesoría…" />, asMessage: true, end: true },

  // --- FAQs ---
  { id: "faqs", message: "Preguntas comunes:\n• Método: BMR → TDEE → macros según objetivo.\n• Menús: se generan por comida y por día.\n• Alimentos: buscador con macros de productos españoles.\n• Asesoría: información personalizada sobre nutrición.", trigger: "menu" },
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="chatbot-root">
      <button className="chatbot-fab" onClick={() => setIsOpen(v => !v)} aria-label="Abrir asistente">
        💬
      </button>

      {isOpen && (
        <div className="chatbot-box" role="dialog" aria-label="Asistente EatBalance">
          <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Cerrar asistente">✖</button>

          <ThemeProvider theme={theme}>
            <ChatBot
              steps={steps}
              headerTitle="Asistente EatBalance"
              placeholder="Escribe tu mensaje…"
              botAvatar="/eatbot.jpg"
              userAvatar="/user.png"
              recognitionEnable={false}
              enableSmoothScroll
              botDelay={250}
              userDelay={0}
            />
          </ThemeProvider>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
