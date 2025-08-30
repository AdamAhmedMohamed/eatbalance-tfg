// Alimentos.jsx
import React, { useState, useMemo, useEffect } from "react";
import "./Alimentos.css";

const BASE_URL = "http://127.0.0.1:8000";

export default function Alimentos() {
  // --- Flujo ES (OFF): buscar → elegir → detalle
  const [step, setStep] = useState("askName");

  // --- Búsqueda ES (OpenFoodFacts) ---
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [sel, setSel] = useState(null);
  const [loadingES, setLoadingES] = useState(false);
  const [errorES, setErrorES] = useState("");

  // Recientes por usuario
  const [recent, setRecent] = useState([]);

  // cantidad en gramos para la calculadora
  const [grams, setGrams] = useState(100);

  // === SUMATORIO (aislado) ===
  const [seleccion, setSeleccion] = useState([]); // [{id,name,brand,grams,kcal,prot,carb,gras}]
  const addActual = () => {
    if (!sel || !scaled) return;
    const toNum = (v) => (Number.isFinite(+v) ? +v : 0);
    setSeleccion((s) => [
      ...s,
      {
        id: Date.now() + Math.random(),
        code: sel.code || "",
        name: sel.name || "Alimento",
        brand: sel.brand || "",
        grams: toNum(scaled.grams),
        kcal: toNum(scaled.cal),
        prot: toNum(scaled.prot),
        carb: toNum(scaled.carb),
        gras: toNum(scaled.gras),
      },
    ]);
  };
  const removeItem = (id) => setSeleccion((s) => s.filter((x) => x.id !== id));
  const clearAll = () => setSeleccion([]);

  const totals = useMemo(() => {
    return seleccion.reduce(
      (a, it) => ({
        grams: a.grams + (it.grams || 0),
        kcal: a.kcal + (it.kcal || 0),
        prot: a.prot + (it.prot || 0),
        carb: a.carb + (it.carb || 0),
        gras: a.gras + (it.gras || 0),
      }),
      { grams: 0, kcal: 0, prot: 0, carb: 0, gras: 0 }
    );
  }, [seleccion]);

  const d0 = (n) => Math.round(Number(n || 0));
  const d1 = (n) => (Number.isFinite(+n) ? (+n).toFixed(1) : "0.0");

  // Normaliza lista OFF → {code, name, brand, image}
  const normalizaLista = (raw) => {
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.products)
      ? raw.products
      : Array.isArray(raw?.resultados)
      ? raw.resultados
      : [];

    return arr
      .map((it) => {
        const obj = it?.product || it || {};
        const code =
          obj.code || it.code || obj._id || it._id || obj.id || it.id || null;

        const name =
          obj.product_name_es ||
          obj.product_name ||
          it.product_name_es ||
          it.product_name ||
          obj.nombre ||
          it.nombre ||
          obj.generic_name_es ||
          obj.generic_name ||
          "Sin nombre";

        const brand = obj.marca || it.marca || obj.brands || it.brands || "";
        const image =
          obj.image_front_small_url ||
          obj.image_url ||
          it.image_front_small_url ||
          it.image_url ||
          null;

        return { code, name, brand, image, _raw: it };
      })
      .filter((x) => !!x.name)
      .slice(0, 15);
  };

  // cargar recientes al entrar (si hay token)
  useEffect(() => {
    const token = localStorage.getItem("eb_token");
    if (!token) return;
    fetch(`${BASE_URL}/users/recent-searches?limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setRecent(data))
      .catch(() => {});
  }, []);

  // Buscar en OFF (ES)
  const buscarES = async () => {
    setErrorES("");
    setSel(null);
    setResultados([]);
    if (!query.trim()) return;

    try {
      setLoadingES(true);
      const r = await fetch(`${BASE_URL}/buscar-productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: query }),
      });
      const data = await r.json();
      const lista = normalizaLista(data);
      if (!lista.length) {
        setErrorES("No se encontraron resultados para ese término.");
        return;
      }
      setResultados(lista);
      setStep("choose");

      // registrar la búsqueda (si hay token)
      const token = localStorage.getItem("eb_token");
      if (token) {
        fetch(`${BASE_URL}/users/recent-searches`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ term: query, source: "openfoodfacts" }),
        })
          .then(() =>
            fetch(`${BASE_URL}/users/recent-searches?limit=10`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
          .then((r2) => (r2?.ok ? r2.json() : null))
          .then((data2) => data2 && setRecent(data2))
          .catch(() => {});
      }
    } catch (e) {
      console.error(e);
      setErrorES("No se pudo conectar al backend.");
    } finally {
      setLoadingES(false);
    }
  };

  // Normaliza detalle de OFF
  const normalizaDetalle = (detalle) => {
    const nutr =
      detalle?.nutrientes_por_100g ||
      detalle?.nutriments ||
      detalle?.nutrientes ||
      {};
    const kcal =
      nutr.calorias ??
      nutr["energy-kcal_100g"] ??
      (typeof nutr.energy_100g === "number"
        ? Math.round(nutr.energy_100g / 4.184)
        : null);

    return {
      cal: kcal ?? null,
      prot: nutr.proteinas ?? nutr.proteins_100g ?? null,
      gras: nutr.grasas ?? nutr.fat_100g ?? null,
      carb: nutr.carbohidratos ?? nutr.carbohydrates_100g ?? null,
      azu: nutr.azucares ?? nutr.sugars_100g ?? null,
      fibra: nutr.fibra ?? nutr.fiber_100g ?? null,
    };
  };

  const elegir = async (item) => {
    setErrorES("");
    if (!item.code) {
      setErrorES("Este resultado no trae código de producto. Prueba otro.");
      return;
    }
    try {
      setLoadingES(true);
      const r = await fetch(`${BASE_URL}/producto-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: item.code }),
      });
      const detalle = await r.json();
      const macros100g = normalizaDetalle(detalle);
      setSel({ ...item, macros100g });
      setGrams(100); // reset calculadora
      setStep("detail");
    } catch (e) {
      console.error(e);
      setErrorES("No se pudo obtener el detalle del producto.");
    } finally {
      setLoadingES(false);
    }
  };

  // cálculo escalado por gramos
  const scaled = useMemo(() => {
    if (!sel?.macros100g) return null;
    const g = Math.max(0, Number(grams) || 0);
    const s = (v) => (v == null ? null : (v * g) / 100);
    return {
      cal: s(sel.macros100g.cal),
      prot: s(sel.macros100g.prot),
      gras: s(sel.macros100g.gras),
      carb: s(sel.macros100g.carb),
      azu: s(sel.macros100g.azu),
      fibra: s(sel.macros100g.fibra),
      grams: g,
    };
  }, [grams, sel]);

  const fmt = (v, d = 1) => (v == null ? "—" : Number(v.toFixed(d)));
  const fmtKcal = (v) => (v == null ? "—" : Math.round(v));

  return (
    <div className="Partnership">
      {/* HERO */}
      <div className="hero-section">
        <img src="/logo-eatbalance.png" className="hero-image" alt="" />
        <div className="hero-glass">
          <h1 className="hero-title">
            <span className="lead">Consulta</span>{" "}
            <span className="accent">Alimentos</span>
          </h1>
          <p className="hero-subtitle">
            Busca calorías y macros de productos de supermercado en España.
          </p>
        </div>
      </div>

      {/* Tarjeta única: Productos / marcas (OFF) */}
      <div className="search-grid">
        <div className="card">
          <h2 className="card-title">Productos / Marcas (ESPAÑOLAS)</h2>
          <p className="card-subtitle">
            Usa búsquedas específicas (marca + producto) para encontrar el tuyo.
            Después, podrás ver los valores por 100 g y calcular por tu
            cantidad.
          </p>

          {step === "askName" && (
            <>
              <div className="input-row">
                <input
                  className="input"
                  value={query}
                  placeholder="Ej.: Corn Flakes Lidl"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarES()}
                />
                <button className="btn" onClick={buscarES} disabled={loadingES}>
                  {loadingES ? "Buscando..." : "Buscar"}
                </button>
              </div>
              {errorES && <p className="error">{errorES}</p>}

              {/* Búsquedas recientes */}
              {recent.length > 0 && (
                <div className="recent-chips">
                  <div className="recent-title">Búsquedas recientes:</div>
                  <div className="recent-list">
                    {recent.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        className="recent-chip"
                        onClick={() => setQuery(r.term)}
                        title={new Date(r.created_at).toLocaleString("es-ES")}
                      >
                        {r.term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === "choose" && (
            <div className="lista">
              {resultados.map((a, i) => (
                <button
                  className={`list-item ${!a.code ? "disabled" : ""}`}
                  key={a.code || `${a.name}-${i}`}
                  onClick={() => a.code && elegir(a)}
                  title={!a.code ? "Sin código, no se puede abrir detalle" : ""}
                >
                  <div className="list-item-main">
                    <span className="badge">{i + 1}</span>
                    <span className="name">
                      {a.name} {a.brand ? `— ${a.brand}` : ""}
                    </span>
                  </div>
                  {a.image && <img src={a.image} alt="" className="thumb" />}
                </button>
              ))}

              <div className="footer-actions">
                <button className="btn ghost" onClick={() => setStep("askName")}>
                  ↩︎ Nueva búsqueda
                </button>
              </div>

              {errorES && <p className="error center">{errorES}</p>}
            </div>
          )}

          {step === "detail" && sel && (
            <div className="detalle">
              <div className="detalle-head">
                <div>
                  <h3 className="detalle-title">
                    {sel.name} {sel.brand ? `— ${sel.brand}` : ""}
                  </h3>
                  <p className="detalle-sub">Valores por 100 g</p>
                </div>
                {sel.image && (
                  <img src={sel.image} alt={sel.name} className="foto" />
                )}
              </div>

              {/* KPIs por 100 g */}
              <div className="kpi-grid">
                <div className="kpi">
                  <span>Calorías</span>
                  <b>{sel.macros100g.cal ?? "—"} kcal</b>
                </div>
                <div className="kpi">
                  <span>Proteínas</span>
                  <b>{sel.macros100g.prot ?? "—"} g</b>
                </div>
                <div className="kpi">
                  <span>Grasas</span>
                  <b>{sel.macros100g.gras ?? "—"} g</b>
                </div>
                <div className="kpi">
                  <span>Carbohidratos</span>
                  <b>{sel.macros100g.carb ?? "—"} g</b>
                </div>
                {sel.macros100g.azu != null && (
                  <div className="kpi">
                    <span>Azúcares</span>
                    <b>{sel.macros100g.azu} g</b>
                  </div>
                )}
                {sel.macros100g.fibra != null && (
                  <div className="kpi">
                    <span>Fibra</span>
                    <b>{sel.macros100g.fibra} g</b>
                  </div>
                )}
              </div>

              {/* Calculadora por cantidad */}
              <div className="calc">
                <h4 className="calc-title">Calcula por tu cantidad</h4>
                <div className="calc-row">
                  <label htmlFor="grams">Cantidad</label>
                  <div className="calc-inputs">
                    <input
                      id="grams"
                      type="number"
                      min="0"
                      step="1"
                      className="gram-input"
                      value={grams}
                      onChange={(e) => setGrams(e.target.value)}
                    />
                    <span className="unit">g</span>
                  </div>
                  <div className="presets">
                    {[30, 50, 60, 75, 100, 150, 200].map((g) => (
                      <button
                        key={g}
                        type="button"
                        className="chip"
                        onClick={() => setGrams(g)}
                      >
                        {g} g
                      </button>
                    ))}
                  </div>
                </div>

                <div className="kpi-grid">
                  <div className="kpi">
                    <span>Calorías ({scaled?.grams} g)</span>
                    <b>{fmtKcal(scaled?.cal)} kcal</b>
                  </div>
                  <div className="kpi">
                    <span>Proteínas ({scaled?.grams} g)</span>
                    <b>{fmt(scaled?.prot)} g</b>
                  </div>
                  <div className="kpi">
                    <span>Grasas ({scaled?.grams} g)</span>
                    <b>{fmt(scaled?.gras)} g</b>
                  </div>
                  <div className="kpi">
                    <span>Carbohidratos ({scaled?.grams} g)</span>
                    <b>{fmt(scaled?.carb)} g</b>
                  </div>
                  {sel.macros100g.azu != null && (
                    <div className="kpi">
                      <span>Azúcares ({scaled?.grams} g)</span>
                      <b>{fmt(scaled?.azu)} g</b>
                    </div>
                  )}
                  {sel.macros100g.fibra != null && (
                    <div className="kpi">
                      <span>Fibra ({scaled?.grams} g)</span>
                      <b>{fmt(scaled?.fibra)} g</b>
                    </div>
                  )}
                </div>
                <p className="calc-note">
                  * Cálculo basado en los valores por 100 g del producto.
                </p>

                {/* SUMATORIO: botón para añadir la selección actual */}
                <div className="sum-actions">
                  <button
                    type="button"
                    className="btn add-food-btn"
                    onClick={addActual}
                  >
                    ➕ Añadir alimento
                  </button>
                </div>
              </div>

              <div className="footer-actions">
                <button className="btn ghost" onClick={() => setStep("askName")}>
                  ↩︎ Nueva búsqueda
                </button>
              </div>
            </div>
          )}
        </div>

        {/* === SUMATORIO: panel acumulado === */}
        {seleccion.length > 0 && (
          <div className="sum-card">
            <div className="sum-head">
              <div className="sum-title">
                Tu selección <span className="sum-count">{seleccion.length}</span>
              </div>
              <div className="sum-tools">
                <button type="button" className="sum-clear" onClick={clearAll}>
                  Vaciar
                </button>
              </div>
            </div>

            <div className="sum-table-wrap">
              <table className="sum-table">
                {/* Control de anchos y estabilidad */}
                <colgroup>
                  <col style={{ width: "auto" }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 44 }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Alimento</th>
                    <th className="tr">Gramos</th>
                    <th className="tr">kcal</th>
                    <th className="tr">P</th>
                    <th className="tr">C</th>
                    <th className="tr">G</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {seleccion.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <div className="sum-food one-line">
                          <div className="sum-name">{it.name}</div>
                          {it.brand && <div className="sum-brand">— {it.brand}</div>}
                        </div>
                      </td>

                      {/* grams: número + “g” en línea debajo */}
                      <td className="tr grams-cell">
                        <div className="stack">
                          <span className="v">{d0(it.grams)}</span>
                          <span className="u">g</span>
                        </div>
                      </td>

                      {/* kcal en dos líneas */}
                      <td className="tr">
                        <div className="stack">
                          <span className="v">{d0(it.kcal)}</span>
                          <span className="u">kcal</span>
                        </div>
                      </td>

                      {/* proteínas en dos líneas */}
                      <td className="tr">
                        <div className="stack">
                          <span className="v">{d1(it.prot)}</span>
                          <span className="u">g</span>
                        </div>
                      </td>

                      {/* carbohidratos en dos líneas */}
                      <td className="tr">
                        <div className="stack">
                          <span className="v">{d1(it.carb)}</span>
                          <span className="u">g</span>
                        </div>
                      </td>

                      {/* grasas en dos líneas */}
                      <td className="tr">
                        <div className="stack">
                          <span className="v">{d1(it.gras)}</span>
                          <span className="u">g</span>
                        </div>
                      </td>

                      <td className="tr">
                        <button
                          type="button"
                          className="sum-del"
                          onClick={() => removeItem(it.id)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="sum-total">
                    <td>Totales</td>

                    {/* grams totales: igual en dos líneas */}
                    <td className="tr grams-cell">
                      <div className="stack">
                        <span className="v">{d0(totals.grams)}</span>
                        <span className="u">g</span>
                      </div>
                    </td>

                    {/* kcal totales en dos líneas */}
                    <td className="tr">
                      <div className="stack">
                        <span className="v">{d0(totals.kcal)}</span>
                        <span className="u">kcal</span>
                      </div>
                    </td>

                    {/* proteínas totales */}
                    <td className="tr">
                      <div className="stack">
                        <span className="v">{d1(totals.prot)}</span>
                        <span className="u">g</span>
                      </div>
                    </td>

                    {/* carbohidratos totales */}
                    <td className="tr">
                      <div className="stack">
                        <span className="v">{d1(totals.carb)}</span>
                        <span className="u">g</span>
                      </div>
                    </td>

                    {/* grasas totales */}
                    <td className="tr">
                      <div className="stack">
                        <span className="v">{d1(totals.gras)}</span>
                        <span className="u">g</span>
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
