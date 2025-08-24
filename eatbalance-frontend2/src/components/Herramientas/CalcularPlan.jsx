import React, { useState } from "react";
import "./CalcularPlan.css";

// === RUTA REAL DE TU PÁGINA DE MENÚS ===
const MENUS_PATH = "/bdd-automatizacion"; // <-- aquí tu ruta correcta

const initialBotMessage = () => ({
  from: "bot",
  text: (
    <>
      👋 <em>¡Hola! Soy tu asistente nutricional.</em>
      <br />
      Para calcular tu plan personalizado necesito que me digas todo esto en un único mensaje:
      <br />
      👉 <strong>Edad</strong> (en años)
      <br />
      👉 <strong>Peso</strong> (en kg)
      <br />
      👉 <strong>Altura</strong> (en cm)
      <br />
      👉 <strong>Sexo:</strong> hombre o mujer
      <br />
      👉 <strong>Nivel de actividad física:</strong> sedentario, ligero, moderado, activo o muy activo
      <br />
      👉 <strong>Objetivo:</strong> mantenimiento, superavit o deficit
      <br />
      Por ejemplo: <br />
      <em>
        "Tengo 20 años, peso 75 kg, mido 173 cm, soy hombre, tengo actividad moderada y quiero
        mantenimiento"
      </em>
      <br />
      ¡Escríbelo y te calculo tu plan!
    </>
  ),
});

export default function CalcularPlan() {
  const [messages, setMessages] = useState([initialBotMessage()]);
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetChat = () => {
    setPlan(null);
    setMessages([initialBotMessage()]);
    setInput("");
    setLoading(false);
  };

  // Construye el objeto de pre-relleno (kcal y macros) a partir del plan recibido (SIN redondear)
const buildPrefillFromPlan = (p) => {
  if (!p) return null;

  // kcal: prioriza calorías objetivo si existe; si no, usa TDEE (sin Math.round)
  const kcal = Number(p.calorias_objetivo ?? p.tdee);
  const protein_g = Number(p.proteinas ?? 0);
  const carb_g    = Number(p.carbohidratos ?? 0);
  const fat_g     = Number(p.grasas ?? 0);

  return { kcal, protein_g, carb_g, fat_g };
};


  // Navega a /bdd-automatizacion pasando los macros por querystring
  const handleGoGenerateMenus = () => {
    if (!plan) return;

    const prefill = buildPrefillFromPlan(plan);
    if (!prefill) return;

    // Backup por si el usuario llega sin query params
    try {
      sessionStorage.setItem("prefillTotals", JSON.stringify(prefill));
    } catch {
      /* nada */
    }

    // Construimos la query
    const qs = new URLSearchParams({
      kcal: String(prefill.kcal),
      protein_g: String(prefill.protein_g),
      carb_g: String(prefill.carb_g),
      fat_g: String(prefill.fat_g),
      // Puedes añadir valores por defecto si quieres:
      // scheme: "4",
      // top_n: "5",
    }).toString();

    const target = `${MENUS_PATH}?${qs}`;

    // Si tu app usa HashRouter (URLs del estilo /#/ruta), navegamos con hash
    const isHashRouter = window.location.hash.startsWith("#/");
    if (isHashRouter) {
      const base = window.location.href.split("#")[0];
      window.location.replace(`${base}#${target}`);
    } else {
      // Navegación normal (BrowserRouter o páginas estáticas)
      window.location.href = target;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);

    try {
      // Mostramos el mensaje del usuario
      const userMsg = { from: "user", text: input };

      const res = await fetch("http://127.0.0.1:8000/plan/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();

      if (data && data.bmr && data.tdee) {
        setPlan(data);

        const planBubble = {
          from: "bot",
          text: (
            <>
              ¡Gracias! Aquí está tu plan personalizado:
              <br />
              <strong>BMR:</strong> {data.bmr} kcal <br />
              <strong>TDEE (mantenimiento):</strong> {data.tdee} kcal <br />
              {typeof data.calorias_objetivo === "number" && (
                <>
                  <strong>Calorías objetivo:</strong> {data.calorias_objetivo} kcal <br />
                </>
              )}
              <strong>Proteínas:</strong> {data.proteinas} g <br />
              <strong>Grasas:</strong> {data.grasas} g <br />
              <strong>Carbohidratos:</strong> {data.carbohidratos} g <br />
              {data.porcentajes && (
                <>
                  <strong>Reparto:</strong>{" "}
                  {Math.round(data.porcentajes.carbohidratos * 100)}% C /{" "}
                  {Math.round(data.porcentajes.proteinas * 100)}% P /{" "}
                  {Math.round(data.porcentajes.grasas * 100)}% G
                </>
              )}
            </>
          ),
        };

        // 🔒 Solo 1 conversación: inicial → user → plan
        setMessages([initialBotMessage(), userMsg, planBubble]);
      } else {
        setPlan(null);
        setMessages([
          initialBotMessage(),
          { from: "user", text: input },
          { from: "bot", text: <em>No he podido entender tus datos. Intenta escribirlos con claridad.</em> },
        ]);
      }
    } catch (err) {
      console.error(err);
      setPlan(null);
      setMessages([
        initialBotMessage(),
        { from: "user", text: input },
        { from: "bot", text: <em>Ha ocurrido un error al procesar tu plan.</em> },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="curso-calidad-software">
      {/* HERO limpio (nítido, sin blur) */}
<section className="cp-hero">
  <div className="cp-hero-inner">
    <h1 className="cp-title">
  <span className="lead">Calcula tu</span> <span className="accent">Plan</span><br/>
  <span className="accent">Nutricional</span>
    </h1>

    <p className="cp-subtitle">
      Introduce tus datos personales y obtén tu plan personalizado.
    </p>
  </div>
</section>

      {/* Chat */}
      <div className="chat-container">
        <div className="chat-box">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.from}`}>
              {msg.text}
            </div>
          ))}

          {plan && (
            <div className="chat-actions">
              {/* Ahora: usar handler que pasa kcal y macros por querystring hacia /bdd-automatizacion */}
              <button className="boton-generar" onClick={handleGoGenerateMenus}>
                Generar menús personalizados →
              </button>
              <button className="boton-calcular" onClick={resetChat}>
                ↻ Calcular tu plan
              </button>
            </div>
          )}
        </div>

        <div className="input-box">
          <input
            type="text"
            placeholder={plan ? "Pulsa «Calcular tu plan» para empezar otra" : "Escribe tu respuesta..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => !plan && e.key === "Enter" && handleSend()}
            disabled={!!plan || loading}
          />
          {!plan && (
            <button onClick={handleSend} disabled={loading}>
              {loading ? "Calculando..." : "Enviar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
