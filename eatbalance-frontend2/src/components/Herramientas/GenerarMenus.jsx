import React, { useEffect, useMemo, useState } from "react";
import "./GenerarMenus.css";

const API_BASE = "http://127.0.0.1:8000";

const MEAL_LABELS = {
  desayuno: "Desayunos",
  comida: "Comidas",
  merienda: "Meriendas",
  cena: "Cenas",
  snack: "Snacks",
  snack2: "Snack extra",
};
const ORDER = ["desayuno", "comida", "merienda", "cena", "snack", "snack2"];

export default function GenerarMenus() {
  // Animación de entrada
  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".gm-anim").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Estado principal
  const [totals, setTotals] = useState({ kcal: 2500, protein_g: 170, carb_g: 390, fat_g: 70 });
  const [scheme, setScheme] = useState("4");
  const [topN, setTopN] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [allOptions, setAllOptions] = useState(null);   // /plan/generate_all
  const [selection, setSelection] = useState({});       // { desayuno: menu_id, ... }
  const [finalPlan, setFinalPlan] = useState(null);     // /plan/generate

  // Debug breve
  const [dbg, setDbg] = useState({ url: "", status: "", body: "" });

  // Flag para saber si precargamos desde URL/storage y hacer scroll al panel
  const [prefilled, setPrefilled] = useState(false);

  const meals = useMemo(() => (allOptions ? ORDER.filter((k) => allOptions[k]) : []), [allOptions]);

  // Helpers de formato (solo para pintar números en UI)
  const fmt0 = (n) => {
    const x = Number(n ?? 0);
    return Number.isFinite(x) ? x.toFixed(0) : "0";
  };
  const fmt1 = (n) => {
    const x = Number(n ?? 0);
    return Number.isFinite(x) ? x.toFixed(1) : "0.0";
  };
  const errText = (e = {}) =>
    `P ${fmt1(e.protein_g)} · C ${fmt1(e.carb_g)} · G ${fmt1(e.fat_g)} · ${fmt0(e.kcal)} kcal`;

  // ======= Precarga desde querystring / hash / sessionStorage =======
  useEffect(() => {
    const getSearchParams = () => {
      let s = window.location.search || "";
      if (!s) {
        const hash = window.location.hash || "";
        const qIdx = hash.indexOf("?");
        if (qIdx >= 0) s = hash.slice(qIdx); // incluye '?'
      }
      return new URLSearchParams(s);
    };

    const num = (v) => {
      // Permite decimales exactos si llegan por querystring
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const sp = getSearchParams();

    let pre = {
      kcal: num(sp.get("kcal")),
      protein_g: num(sp.get("protein_g")),
      carb_g: num(sp.get("carb_g")),
      fat_g: num(sp.get("fat_g")),
    };

    let ok = Object.values(pre).every((v) => v !== null);

    // Fallback: sessionStorage
    if (!ok) {
      try {
        const raw = sessionStorage.getItem("prefillTotals");
        if (raw) {
          const s = JSON.parse(raw);
          pre = {
            kcal: num(s?.kcal),
            protein_g: num(s?.protein_g),
            carb_g: num(s?.carb_g),
            fat_g: num(s?.fat_g),
          };
          ok = Object.values(pre).every((v) => v !== null);
        }
      } catch {}
    }

    if (ok) {
      setTotals({
        kcal: pre.kcal,
        protein_g: pre.protein_g,
        carb_g: pre.carb_g,
        fat_g: pre.fat_g,
      });
      setPrefilled(true);
    }

    // Opcionales: scheme / top_n
    const schemeQS = sp.get("scheme");
    if (schemeQS) setScheme(schemeQS);
    const topQS = num(sp.get("top_n"));
    if (topQS && topQS > 0) setTopN(topQS);
  }, []);

  useEffect(() => {
    if (prefilled) {
      setTimeout(() => {
        document.querySelector(".gm-panel")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [prefilled]);

  // HTTP helper
  async function postJson(path, body) {
    const url = `${API_BASE}${path}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      setDbg({ url, status: `${res.status} ${res.statusText}`, body: text.slice(0, 2000) });
      if (!res.ok) throw new Error(text || res.statusText);
      return JSON.parse(text);
    } catch (e) {
      setError(e?.message || "Fallo de red/API");
      console.error("API error:", e);
      return null;
    }
  }

  // Acciones
  async function handleGenerateAll() {
    setError(null);
    setLoading(true);
    setFinalPlan(null);

    const data = await postJson("/plan/generate_all", { totals, scheme, top_n: topN });
    setLoading(false);
    if (!data?.ok || !data?.plan) return;

    // Fallback por si viniera con formato de /generate
    const planObj = normalizeToOptions(data.plan);

    setAllOptions(planObj);

    // Autoselección por defecto: la 1ª de cada comida
    const auto = {};
    Object.keys(planObj).forEach((meal) => {
      auto[meal] = planObj[meal]?.options?.[0]?.menu_id || "";
    });
    setSelection(auto);

    setTimeout(() => {
      document.getElementById("gm-opciones")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  async function handleConfirm() {
    if (!allOptions) { setError("Primero pulsa «Ver opciones»."); return; }
    const faltan = Object.keys(allOptions).filter((m) => !selection[m]);
    if (faltan.length) { setError("Elige un menú en todas las comidas."); return; }

    setError(null);
    setLoading(true);
    const data = await postJson("/plan/generate", { totals, scheme, selection });
    setLoading(false);
    if (!data?.ok || !data?.plan) return;

    setFinalPlan(data.plan);
    setTimeout(() => {
      document.getElementById("gm-plan-final")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  // Convierte estructura tipo /plan/generate a {meal: {target, options:[...]}}
  function normalizeToOptions(planMaybe) {
    const looksLikeGenerateAll = Object.values(planMaybe || {})[0]?.options !== undefined;
    if (looksLikeGenerateAll) return planMaybe;

    const out = {};
    for (const meal of Object.keys(planMaybe || {})) {
      const blk = planMaybe[meal] || {};
      out[meal] = {
        target: blk.target || blk.achieved || { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 },
        options: [
          {
            menu_id: `m_${meal}`,
            menu_name: blk.menu_name || "Menú",
            items: blk.items || [],
            achieved: blk.achieved || blk.target || { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 },
            errors: blk.errors || { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 },
            score: 0,
          },
        ],
      };
    }
    return out;
  }

  // UI
  return (
    <div className="gm-wrap">
      {/* HERO */}
      <div className="gm-hero gm-anim">
        <div className="gm-hero-inner">
          <h1 className="gm-title">
            <span className="lead">Generar</span> <span className="accent">Menús</span>
          </h1>
          <p className="gm-subtitle">
            Introduce tus macros y nº de comidas. Elige tus menús con cantidades exactas.
          </p>
        </div>
      </div>

      {/* PARÁMETROS */}
      <section className="gm-panel gm-anim">
        <h2>Parámetros del plan</h2>
        <div className="gm-grid">
          <div className="gm-field">
            <label>Kcal</label>
            <input
              type="number"
              value={totals.kcal}
              onChange={(e) => setTotals({ ...totals, kcal: +e.target.value || 0 })}
            />
          </div>
          <div className="gm-field">
            <label>Proteína (g)</label>
            <input
              type="number"
              value={totals.protein_g}
              onChange={(e) => setTotals({ ...totals, protein_g: +e.target.value || 0 })}
            />
          </div>
          <div className="gm-field">
            <label>Carbohidratos (g)</label>
            <input
              type="number"
              value={totals.carb_g}
              onChange={(e) => setTotals({ ...totals, carb_g: +e.target.value || 0 })}
            />
          </div>
          <div className="gm-field">
            <label>Grasas (g)</label>
            <input
              type="number"
              value={totals.fat_g}
              onChange={(e) => setTotals({ ...totals, fat_g: +e.target.value || 0 })}
            />
          </div>
          <div className="gm-field">
            <label>Comidas</label>
            <select value={scheme} onChange={(e) => setScheme(e.target.value)}>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="5_plus_snack">5 + snack</option>
            </select>
          </div>
          <div className="gm-field">
            <label>Opciones por comida</label>
            <input
              type="number"
              min={1}
              value={topN}
              onChange={(e) => setTopN(+e.target.value || 1)}
            />
          </div>
        </div>

        <div className="gm-actions">
          <button className="gm-btn gm-primary" onClick={handleGenerateAll} disabled={loading}>
            {loading ? "Generando..." : "Ver opciones"}
          </button>
          <button className="gm-btn" onClick={handleConfirm} disabled={loading || !allOptions}>
            Confirmar selección
          </button>
          {error && <span className="gm-error">⚠️ {error}</span>}
        </div>

        <details className="gm-debug">
          <summary>Debug</summary>
          <pre>
            URL: {dbg.url || "-"}
            {"\n"}Status: {dbg.status || "-"}
            {"\n"}Body: {dbg.body || "-"}
          </pre>
        </details>
      </section>

      {/* OPCIONES POR COMIDA */}
      <section id="gm-opciones">
        {allOptions ? (
          ORDER.filter((m) => allOptions[m]).map((meal) => {
            const bucket = allOptions[meal];
            const opts = bucket?.options ?? [];
            return (
              <div key={meal} className="gm-bucket gm-anim">
                <div className="gm-bucket-head">
                  <h3>{MEAL_LABELS[meal] || meal}</h3>
                  <div className="gm-target">
                    Objetivo: {fmt0(bucket?.target?.kcal)} kcal · P {fmt0(bucket?.target?.protein_g)} · C{" "}
                    {fmt0(bucket?.target?.carb_g)} · G {fmt0(bucket?.target?.fat_g)}
                  </div>
                </div>

                {opts.length === 0 ? (
                  <div className="gm-empty">No hay opciones para {MEAL_LABELS[meal] || meal}.</div>
                ) : (
                  <div className="gm-cards">
                    {opts.map((opt) => {
                      const selected = selection[meal] === opt.menu_id;
                      return (
                        <article
                          key={opt.menu_id}
                          className={`gm-card ${selected ? "is-selected" : ""}`}
                          onClick={() => setSelection((s) => ({ ...s, [meal]: opt.menu_id }))}
                        >
                          <div className="gm-card-head">
                            <h4>{opt.menu_name}</h4>
                            <input type="radio" name={`sel-${meal}`} checked={selected} readOnly />
                          </div>

                          <div className="gm-items">
                            {(opt.items || []).map((it) => (
                              <div key={it.food_id} className="gm-row">
                                <span className="gm-food">{it.name}</span>
                                <span className="gm-grams">{fmt0(it.grams)} g</span>
                              </div>
                            ))}
                          </div>

                          <div className="gm-card-foot">
                            <span className="gm-badge">Error: {errText(opt.errors)}</span>
                            <span className="gm-score">Score {Number(opt.score ?? 0).toFixed(2)}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="gm-empty gm-anim">
            Pulsa <b>“Ver opciones”</b> para generar propuestas.
          </div>
        )}
      </section>

      {/* PLAN FINAL */}
      {finalPlan && (
        <section id="gm-plan-final" className="gm-plan gm-anim">
          <h3>Plan final</h3>
          {ORDER.filter((m) => finalPlan[m]).map((meal) => {
            const blk = finalPlan[meal];
            return (
              <div key={meal} className="gm-final-block">
                <div className="gm-final-head">
                  <strong>{MEAL_LABELS[meal] || meal}</strong>
                  <span className="gm-muted">
                    Objetivo: {fmt0(blk?.target?.kcal)} kcal · P {fmt0(blk?.target?.protein_g)} · C{" "}
                    {fmt0(blk?.target?.carb_g)} · G {fmt0(blk?.target?.fat_g)}
                  </span>
                </div>
                <div className="gm-final-name">{blk?.menu_name}</div>
                <table className="gm-table">
                  <thead>
                    <tr>
                      <th>Alimento</th>
                      <th className="t-right">Gramos</th>
                      <th className="t-right">kcal</th>
                      <th className="t-right">P</th>
                      <th className="t-right">C</th>
                      <th className="t-right">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(blk?.items || []).map((it) => (
                      <tr key={it.food_id}>
                        <td>{it.name}</td>
                        <td className="t-right">{fmt0(it.grams)}</td>
                        <td className="t-right">{fmt0(it.kcal)}</td>
                        <td className="t-right">{fmt0(it.protein_g)}</td>
                        <td className="t-right">{fmt0(it.carb_g)}</td>
                        <td className="t-right">{fmt0(it.fat_g)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="gm-achieved">
                  Logrado: {fmt0(blk?.achieved?.kcal)} kcal · P {fmt0(blk?.achieved?.protein_g)} · C{" "}
                  {fmt0(blk?.achieved?.carb_g)} · G {fmt0(blk?.achieved?.fat_g)}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
