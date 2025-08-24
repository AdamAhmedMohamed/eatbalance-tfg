# routers/plan.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Optional
import pandas as pd
import json
from pathlib import Path
from services.menu_generator import generate_day_plan, generate_all_options

router = APIRouter(prefix="/plan", tags=["plan"])

# Rutas absolutas desde la raíz del backend
BASE_DIR = Path(__file__).resolve().parents[1]
FOODS_PATH = BASE_DIR / "data" / "foods.csv"
MENUS_PATH = BASE_DIR / "data" / "menus.json"

# ====== utilidades de carga/validación ======
def _load_foods(path: Path) -> pd.DataFrame:
    try:
        df = pd.read_csv(path, dtype={"food_id": "string"}, sep=",", engine="python")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo leer {path}: {e}")
    df.columns = [c.replace("\ufeff", "").strip() for c in df.columns]
    if "food_id" not in df.columns:
        raise HTTPException(status_code=500, detail=f"El CSV {path} no tiene columna 'food_id'")
    df["food_id"] = df["food_id"].astype("string").str.replace("\ufeff", "", regex=False).str.strip()
    return df

def _validate_selection(selection, menus, foods_df):
    menu_map = {m["menu_id"]: m for m in menus}
    food_ids = set(foods_df["food_id"].astype(str))
    missing = []
    for meal, menu_id in selection.items():
        if menu_id not in menu_map:
            missing.append(f"menu_id '{menu_id}' (no existe en menus.json)")
            continue
        for it in menu_map[menu_id]["items"]:
            fid = it["food_id"]
            if fid not in food_ids:
                missing.append(f"food_id '{fid}' en {meal}/{menu_id}")
    if missing:
        raise HTTPException(status_code=400, detail=f"Faltan en foods.csv: {missing}")

def _validate_menus_foods(menus, foods_df):
    food_ids = set(foods_df["food_id"].astype(str))
    missing = []
    for m in menus:
        for it in m["items"]:
            if it["food_id"] not in food_ids:
                missing.append(f"{m['menu_id']}/{it['food_id']}")
    if missing:
        raise HTTPException(status_code=400, detail=f"Faltan en foods.csv: {missing}")

# ====== modelos ======
class Totals(BaseModel):
    kcal: float = Field(..., gt=0)
    protein_g: float = Field(..., ge=0)
    carb_g: float = Field(..., ge=0)
    fat_g: float = Field(..., ge=0)

class GenerateRequest(BaseModel):
    totals: Totals
    scheme: str = Field(..., description="3 | 4 | 5 | 5_plus_snack")
    selection: Dict[str, str] = Field(..., description="{'desayuno':'...', 'comida':'...', ...}")

class GenerateAllRequest(BaseModel):
    totals: Totals
    scheme: str = Field(..., description="3 | 4 | 5 | 5_plus_snack")
    top_n: Optional[int] = Field(default=5, ge=1, description="Top N opciones por comida (None para todas)")

# ====== endpoints ======
@router.post("/generate")
def generate(req: GenerateRequest):
    try:
        foods = _load_foods(FOODS_PATH)
        with open(MENUS_PATH, "r", encoding="utf-8") as f:
            menus = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cargando bases: {e}")

    _validate_selection(req.selection, menus, foods)

    totals = {
        "kcal": req.totals.kcal,
        "protein_g": req.totals.protein_g,
        "carb_g": req.totals.carb_g,
        "fat_g": req.totals.fat_g
    }

    try:
        plan = generate_day_plan(foods_df=foods, menus=menus, totals=totals, scheme=req.scheme, selection=req.selection)
        return {"ok": True, "plan": plan}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate_all")
def generate_all(req: GenerateAllRequest):
    try:
        foods = _load_foods(FOODS_PATH)
        with open(MENUS_PATH, "r", encoding="utf-8") as f:
            menus = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cargando bases: {e}")

    _validate_menus_foods(menus, foods)

    totals = {
        "kcal": req.totals.kcal,
        "protein_g": req.totals.protein_g,
        "carb_g": req.totals.carb_g,
        "fat_g": req.totals.fat_g
    }

    try:
        plan = generate_all_options(foods_df=foods, menus=menus, totals=totals, scheme=req.scheme, top_n=req.top_n)
        return {"ok": True, "plan": plan}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/audit/foods")
def audit_foods(threshold_pct: float = 5.0):
    df = _load_foods(FOODS_PATH)
    issues = []
    for _, r in df.iterrows():
        try:
            p = float(r.get("protein_g", 0) or 0)
            c = float(r.get("carb_g", 0) or 0)
            f = float(r.get("fat_g", 0) or 0)
            kcal = float(r.get("kcal", 0) or 0)
        except Exception:
            continue
        kcal_calc = 4*(p + c) + 9*f
        if kcal_calc > 0:
            pct = 100.0 * (kcal - kcal_calc) / kcal_calc
            if abs(pct) >= threshold_pct:
                issues.append({
                    "food_id": str(r["food_id"]),
                    "name": str(r.get("name", "")),
                    "kcal_declared": round(kcal, 1),
                    "kcal_from_macros": round(kcal_calc, 1),
                    "delta_kcal": round(kcal - kcal_calc, 1),
                    "delta_pct": round(pct, 1)
                })
    return {"count": int(df.shape[0]), "issues": issues, "threshold_pct": threshold_pct}

@router.get("/debug")
def debug():
    foods = _load_foods(FOODS_PATH)
    with open(MENUS_PATH, "r", encoding="utf-8") as f:
        menus = json.load(f)
    return {
        "foods_path": str(FOODS_PATH),
        "foods_count": int(foods.shape[0]),
        "foods_first_ids": foods["food_id"].head(10).tolist(),
        "menus_path": str(MENUS_PATH),
        "menus_count": len(menus),
        "menus_first_ids": [m["menu_id"] for m in menus[:10]]
    }
