# services/menu_generator.py
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
import pandas as pd

@dataclass
class Macro:
    kcal: float
    protein_g: float
    carb_g: float
    fat_g: float

def macros_of(food_row, grams: float) -> Macro:
    factor = grams / 100.0
    return Macro(
        kcal=float(food_row["kcal"]) * factor,
        protein_g=float(food_row["protein_g"]) * factor,
        carb_g=float(food_row["carb_g"]) * factor,
        fat_g=float(food_row["fat_g"]) * factor,
    )

def sum_macros(macros_list: List[Macro]) -> Macro:
    tot = Macro(0, 0, 0, 0)
    for m in macros_list:
        tot.kcal += m.kcal
        tot.protein_g += m.protein_g
        tot.carb_g += m.carb_g
        tot.fat_g += m.fat_g
    return tot

def round_grams(cat: str, grams: float) -> float:
    # redondeos prácticos
    if cat in ("FAT", "FAT_FLEX"):
        step = 1   # aceites/grasas finas
    else:
        step = 5   # sólidos
    return max(0.0, step * round(float(grams) / step))

# ===== Reglas de reparto por número de comidas =====
DISTS: Dict[str, Dict[str, Dict[str, float]]] = {
    "3": {
        "desayuno": {"protein_g": 0.25, "carb_g": 0.30, "fat_g": 0.30},
        "comida":   {"protein_g": 0.40, "carb_g": 0.45, "fat_g": 0.35},
        "cena":     {"protein_g": 0.35, "carb_g": 0.25, "fat_g": 0.35},
    },
    "4": {
        "desayuno": {"protein_g": 0.20, "carb_g": 0.25, "fat_g": 0.20},
        "comida":   {"protein_g": 0.35, "carb_g": 0.35, "fat_g": 0.30},
        "merienda": {"protein_g": 0.15, "carb_g": 0.15, "fat_g": 0.15},
        "cena":     {"protein_g": 0.30, "carb_g": 0.25, "fat_g": 0.35},
    },
    "5": {
        "desayuno": {"protein_g": 0.22, "carb_g": 0.25, "fat_g": 0.18},
        "comida":   {"protein_g": 0.30, "carb_g": 0.30, "fat_g": 0.28},
        "merienda": {"protein_g": 0.10, "carb_g": 0.10, "fat_g": 0.10},
        "cena":     {"protein_g": 0.25, "carb_g": 0.20, "fat_g": 0.30},
        "snack":    {"protein_g": 0.13, "carb_g": 0.15, "fat_g": 0.14},
    },
    "5_plus_snack": {
        "desayuno": {"protein_g": 0.21, "carb_g": 0.24, "fat_g": 0.18},
        "comida":   {"protein_g": 0.29, "carb_g": 0.29, "fat_g": 0.27},
        "merienda": {"protein_g": 0.11, "carb_g": 0.11, "fat_g": 0.11},
        "cena":     {"protein_g": 0.24, "carb_g": 0.19, "fat_g": 0.29},
        "snack":    {"protein_g": 0.10, "carb_g": 0.12, "fat_g": 0.12},
        "snack2":   {"protein_g": 0.05, "carb_g": 0.05, "fat_g": 0.03},
    },
}

def per_meal_targets(total_kcal: float, p_g: float, c_g: float, f_g: float, scheme: str) -> Dict[str, Macro]:
    """
    Reparte SOLO por macros; las kcal por comida se derivan de P/C/G
    para que no haya inconsistencias (kcal = 4*(P+C)+9*F).
    """
    dist = DISTS[scheme]
    t: Dict[str, Macro] = {}
    for meal, w in dist.items():
        P = p_g * w["protein_g"]
        C = c_g * w["carb_g"]
        F = f_g * w["fat_g"]
        kcal = 4 * (P + C) + 9 * F
        t[meal] = Macro(kcal=kcal, protein_g=P, carb_g=C, fat_g=F)
    return t

def scale_menu_to_targets(menu: Dict, foods_df: pd.DataFrame, targets: Macro) -> Tuple[List[Dict], Dict]:
    # Index rápido por food_id
    fdf = foods_df.set_index("food_id")

    # gramos iniciales = base del menú
    grams_map: Dict[str, float] = {it["food_id"]: float(it["base_g"]) for it in menu["items"]}

    def current_macros() -> Macro:
        return sum_macros([macros_of(fdf.loc[fid], g) for fid, g in grams_map.items()])

    # grupos por categoría
    protein_ids = [it["food_id"] for it in menu["items"] if fdf.loc[it["food_id"], "category"] == "PROTEIN"]
    carb_ids    = [it["food_id"] for it in menu["items"] if fdf.loc[it["food_id"], "category"] == "CARB"]
    fatflex_ids = [it["food_id"] for it in menu["items"] if fdf.loc[it["food_id"], "category"] == "FAT_FLEX"]
    fat_ids     = [it["food_id"] for it in menu["items"] if fdf.loc[it["food_id"], "category"] == "FAT"]

    # ===== 1) Ajuste proteína =====
    cur = current_macros()
    base_p = sum(macros_of(fdf.loc[fid], grams_map[fid]).protein_g for fid in protein_ids)
    if base_p > 0:
        need_from_prot = max(0.0, targets.protein_g - (cur.protein_g - base_p))
        factor_p = need_from_prot / base_p
        factor_p = max(0.6, min(3.5, factor_p))  # tope ampliado para llegar mejor
        for fid in protein_ids:
            grams_map[fid] *= factor_p

    # ===== 2) Ajuste carbohidratos =====
    cur = current_macros()
    base_c = sum(macros_of(fdf.loc[fid], grams_map[fid]).carb_g for fid in carb_ids)
    other_c = cur.carb_g - base_c
    if base_c > 0:
        need_from_carb = max(0.0, targets.carb_g - other_c)
        factor_c = need_from_carb / base_c
        factor_c = max(0.6, min(3.5, factor_c))  # tope ampliado
        for fid in carb_ids:
            grams_map[fid] *= factor_c

    # ===== 3) Ajuste grasas ===== (usa aceite como FAT_FLEX si existe)
    cur = current_macros()
    base_flex = sum(macros_of(fdf.loc[fid], grams_map[fid]).fat_g for fid in fatflex_ids)
    base_fats = sum(macros_of(fdf.loc[fid], grams_map[fid]).fat_g for fid in fat_ids)
    other_f = cur.fat_g - base_flex - base_fats
    need_f = max(0.0, targets.fat_g - other_f)
    if len(fatflex_ids) > 0:
        fid = fatflex_ids[0]
        fat_per_g = fdf.loc[fid, "fat_g"] / 100.0
        grams_map[fid] = (need_f / fat_per_g) if fat_per_g > 0 else 0.0
    elif base_fats > 0:
        factor_f = need_f / base_fats if base_fats > 0 else 1.0
        factor_f = max(0.6, min(3.0, factor_f))
        for fid in fat_ids:
            grams_map[fid] *= factor_f

    # ===== 4) Redondeo práctico =====
    grams_map = {fid: round_grams(fdf.loc[fid, "category"], g) for fid, g in grams_map.items()}

    # ===== 5) Resultado =====
    final = current_macros()
    result_items = []
    for fid, g in grams_map.items():
        row = fdf.loc[fid]
        m = macros_of(row, g)
        result_items.append({
            "food_id": fid,
            "name": row["name"],
            "grams": g,
            "kcal": round(m.kcal, 2),
            "protein_g": round(m.protein_g, 2),
            "carb_g": round(m.carb_g, 2),
            "fat_g": round(m.fat_g, 2),
        })
    debug = {
        "target": {"kcal": targets.kcal, "protein_g": targets.protein_g, "carb_g": targets.carb_g, "fat_g": targets.fat_g},
        "achieved": {"kcal": final.kcal, "protein_g": final.protein_g, "carb_g": final.carb_g, "fat_g": final.fat_g},
        "errors": {
            "kcal": round(final.kcal - targets.kcal, 2),
            "protein_g": round(final.protein_g - targets.protein_g, 2),
            "carb_g": round(final.carb_g - targets.carb_g, 2),
            "fat_g": round(final.fat_g - targets.fat_g, 2),
        }
    }
    return result_items, debug

def generate_day_plan(foods_df: pd.DataFrame, menus: list, totals: Dict, scheme: str, selection: Dict[str, str]) -> Dict:
    targets = per_meal_targets(totals["kcal"], totals["protein_g"], totals["carb_g"], totals["fat_g"], scheme)
    out: Dict[str, Dict] = {}
    for meal, menu_id in selection.items():
        menu = next(m for m in menus if m["menu_id"] == menu_id)
        items, dbg = scale_menu_to_targets(menu, foods_df, targets[meal])
        out[meal] = {
            "menu_name": menu["menu_name"],
            "items": items,
            "target": vars(targets[meal]),
            "achieved": dbg["achieved"],
            "errors": dbg["errors"],
        }
    return out

# ====== TODAS LAS OPCIONES POR COMIDA (para que elija el usuario) ======
def _error_score(err: Dict[str, float]) -> float:
    # suma de errores absolutos de macros; kcal pesa poco
    return abs(err.get("protein_g", 0.0)) + abs(err.get("carb_g", 0.0)) + abs(err.get("fat_g", 0.0)) + abs(err.get("kcal", 0.0)) / 100.0

def generate_all_options(foods_df: pd.DataFrame, menus: list, totals: Dict, scheme: str, top_n: Optional[int] = 5) -> Dict[str, Dict]:
    targets = per_meal_targets(totals["kcal"], totals["protein_g"], totals["carb_g"], totals["fat_g"], scheme)
    out: Dict[str, Dict] = {}
    for meal in DISTS[scheme].keys():
        options = []
        for m in menus:
            if m.get("meal_type") != meal:
                continue
            items, dbg = scale_menu_to_targets(m, foods_df, targets[meal])
            options.append({
                "menu_id": m["menu_id"],
                "menu_name": m["menu_name"],
                "items": items,
                "achieved": dbg["achieved"],
                "errors": dbg["errors"],
                "score": _error_score(dbg["errors"]),
            })
        options.sort(key=lambda x: x["score"])
        if top_n is not None:
            options = options[:top_n]
        out[meal] = {"target": vars(targets[meal]), "options": options}
    return out
