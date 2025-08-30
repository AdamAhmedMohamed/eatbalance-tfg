import React, { useState, useEffect } from "react";
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

/* ================== NUEVO: helpers ================== */
// 1) Parsear el mensaje libre a payload del backend nuevo
function parseInputToPlanPayload(text) {
  const s = text.toLowerCase();

  const mEdad   = s.match(/(\d+)\s*(años|año)/);
  const mPeso   = s.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilogramos?)/);
  const mAltura = s.match(/(\d+(?:[.,]\d+)?)\s*(cm|cent[ií]metros?)/);

  const sex =
    s.includes("mujer") ? "mujer" :
    s.includes("hombre") ? "hombre" : null;

  const actividadMap = [
    ["muy activo", ["muy activo", "muy activa", "muyactivo", "muyactiva"]],
    ["activo",     ["activo", "activa"]],
    ["moderado",   ["moderado", "moderada"]],
    ["ligero",     ["ligero", "ligera"]],
    ["sedentario", ["sedentario", "sedentaria"]],
  ];
  let activity_level = null;
  for (const [canon, variantes] of actividadMap) {
    if (variantes.some(v => s.includes(v))) { activity_level = canon; break; }
  }

  let goal = null;
  if (s.includes("superavit")) goal = "superavit";
  else if (s.includes("déficit") || s.includes("deficit")) goal = "deficit";
  else if (s.includes("mantenimiento")) goal = "mantenimiento";

  if (!mEdad || !mPeso || !mAltura || !sex || !activity_level || !goal) return null;

  const age       = parseInt(mEdad[1], 10);
  const weight_kg = parseFloat(String(mPeso[1]).replace(",", "."));
  const height_cm = parseFloat(String(mAltura[1]).replace(",", "."));

  return { sex, age, height_cm, weight_kg, activity_level, goal };
}

// 2) Mapear PlanOut (backend nuevo) a tu forma de UI
function mapPlanOutToUI(planOut) {
  if (!planOut) return null;
  return {
    bmr: planOut.bmr,
    tdee: planOut.tdee,
    proteinas: planOut.protein_g,
    grasas: planOut.fat_g,
    carbohidratos: planOut.carbs_g,
    // calorias_objetivo / porcentajes no vienen en el nuevo → tu UI ya los trata como opcionales
  };
}
/* ===================================================== */

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
    const kcal      = Number(p.calorias_objetivo ?? p.tdee);
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

  // 🔄 Cargar el ÚLTIMO plan guardado del usuario al entrar (si hay token)
  useEffect(() => {
    const token = localStorage.getItem("eb_token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/nutrition/plans/latest", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return; // 404 ⇒ no hay plan guardado

        const data = await res.json();     // PlanOut
        const ui = mapPlanOutToUI(data);   // a tu forma
        setPlan(ui);

        // Mensaje del bot informando que se recuperó el último plan
        setMessages([
          initialBotMessage(),
          {
            from: "bot",
            text: (
              <>
                He recuperado tu <strong>último plan guardado</strong>:
                <br />
                <strong>BMR:</strong> {ui.bmr} kcal <br />
                <strong>TDEE (mantenimiento):</strong> {ui.tdee} kcal <br />
                <strong>Proteínas:</strong> {ui.proteinas} g <br />
                <strong>Grasas:</strong> {ui.grasas} g <br />
                <strong>Carbohidratos:</strong> {ui.carbohidratos} g
              </>
            ),
          },
        ]);
      } catch {
        // Silencio: si falla, no mostramos nada y el flujo sigue normal
      }
    })();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);

    try {
      // Mostramos el mensaje del usuario
      const userMsg = { from: "user", text: input };

      // ===== PRIMERO: intentamos backend nuevo (persistente) si se puede parsear y hay token
      const payload = parseInputToPlanPayload(input);
      const token = localStorage.getItem("eb_token");
      let planUI = null;

      if (payload && token) {
        const res = await fetch("http://127.0.0.1:8000/nutrition/plan/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();      // PlanOut
          planUI = mapPlanOutToUI(data);      // → tu forma de UI
        }
        // si 401 o no ok, caemos al fallback antiguo
      }

      // ===== Fallback: tu endpoint antiguo /plan/ (no requiere login ni parseo)
      if (!planUI) {
        const res2 = await fetch("http://127.0.0.1:8000/plan/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input }),
        });
        const data2 = await res2.json();

        if (data2 && data2.bmr && data2.tdee) {
          planUI = {
            bmr: data2.bmr,
            tdee: data2.tdee,
            proteinas: data2.proteinas,
            grasas: data2.grasas,
            carbohidratos: data2.carbohidratos,
            calorias_objetivo: data2.calorias_objetivo,
            porcentajes: data2.porcentajes,
          };
        }
      }

      if (planUI) {
        setPlan(planUI);

        const planBubble = {
          from: "bot",
          text: (
            <>
              ¡Gracias! Aquí está tu plan personalizado:
              <br />
              <strong>BMR:</strong> {planUI.bmr} kcal <br />
              <strong>TDEE (mantenimiento):</strong> {planUI.tdee} kcal <br />
              {typeof planUI.calorias_objetivo === "number" && (
                <>
                  <strong>Calorías objetivo:</strong> {planUI.calorias_objetivo} kcal <br />
                </>
              )}
              <strong>Proteínas:</strong> {planUI.proteinas} g <br />
              <strong>Grasas:</strong> {planUI.grasas} g <br />
              <strong>Carbohidratos:</strong> {planUI.carbohidratos} g <br />
              {planUI.porcentajes && (
                <>
                  <strong>Reparto:</strong>{" "}
                  {Math.round(planUI.porcentajes.carbohidratos * 100)}% C /{" "}
                  {Math.round(planUI.porcentajes.proteinas * 100)}% P /{" "}
                  {Math.round(planUI.porcentajes.grasas * 100)}% G
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
          userMsg,
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
