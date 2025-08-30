# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re

# Tu router existente de menús CSV/JSON
from routers.plan import router as plan_router

# Cálculos que ya tenías
from bmr import calcular_bmr
from tdee import calcular_tdee
from macros import calcular_macros
from menu import generar_menu

# OpenFoodFacts / LLM
from openfoodfacts import buscar_productos, obtener_producto_por_id
from openrouter_client import get_macros_from_openrouter
from ollama_client import consultar_chat_ollama

# NUEVO: BD y routers con seguridad / persistencia
from db import create_db_and_tables
from routers import auth, users, nutrition, menus

app = FastAPI(title="EatBalance API")

# CORS (desarrollo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas al arrancar
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Routers con autenticación/persistencia
app.include_router(auth.router)        # /auth/register, /auth/login
app.include_router(users.router)       # /users/...
app.include_router(nutrition.router)   # /nutrition/...
app.include_router(menus.router)       # /menus/...

# Tu router antiguo (CSV/JSON)
app.include_router(plan_router)        # /plan/generate, /plan/generate_all, etc.

# ---- Raíz
@app.get("/")
def inicio():
    return {"mensaje": "¡EatBalance API funcionando!"}

# ---- Modelos simples (tus cálculos)
class DatosUsuario(BaseModel):
    sexo: str
    peso: float
    altura: float
    edad: int

class DatosTDEE(BaseModel):
    sexo: str
    peso: float
    altura: float
    edad: int
    actividad: str

class DatosMacros(BaseModel):
    tdee: float
    objetivo: str

class DatosMenu(BaseModel):
    proteinas_g: float
    grasas_g: float
    carbohidratos_g: float

class ProductoID(BaseModel):
    code: str

class AlimentoInput(BaseModel):
    nombre: str

class PreguntaOllama(BaseModel):
    nombre: str
    macros_por_100g: dict
    pregunta: str

# ---- Endpoints utilitarios que ya tenías
@app.post("/bmr")
def obtener_bmr(datos: DatosUsuario):
    bmr = calcular_bmr(datos.sexo, datos.peso, datos.altura, datos.edad)
    return {"BMR": round(bmr, 2)}

@app.post("/tdee")
def obtener_tdee(datos: DatosTDEE):
    tdee = calcular_tdee(datos.sexo, datos.peso, datos.altura, datos.edad, datos.actividad)
    return {"TDEE": tdee}

@app.post("/macros")
def obtener_macros(datos: DatosMacros):
    return calcular_macros(datos.tdee, datos.objetivo)

@app.post("/menu")
def obtener_menu(datos: DatosMenu):
    return generar_menu(
        proteinas_obj=datos.proteinas_g,
        grasas_obj=datos.grasas_g,
        carbos_obj=datos.carbohidratos_g,
    )

# --- Búsqueda OFF (dos rutas equivalentes, usa la que quieras en el frontend)
@app.post("/buscar-alimento")
def buscar_alimento_api(data: AlimentoInput):
    return buscar_productos(data.nombre)

class BusquedaInput(BaseModel):
    nombre: str

@app.post("/buscar-productos")
def buscar_varios(producto: BusquedaInput):
    return buscar_productos(producto.nombre)

@app.get("/macros-alimento")
def obtener_macros_alimento(alimento: str):
    return {"macros": get_macros_from_openrouter(alimento)}

@app.post("/producto-id")
def obtener_producto_id(data: ProductoID):
    return obtener_producto_por_id(data.code)

@app.post("/ollama-chat")
def usar_ollama_como_chat(data: PreguntaOllama):
    respuesta = consultar_chat_ollama(data.nombre, data.macros_por_100g, data.pregunta)
    return {"respuesta": respuesta}

# ---- Cálculo completo vía JSON
class DatosCompleto(BaseModel):
    edad: int
    peso: float
    altura: float
    sexo: str
    actividad: str
    objetivo: str

@app.post("/calcular-macros")
def calcular_plan(datos: DatosCompleto):
    bmr = calcular_bmr(datos.sexo, datos.peso, datos.altura, datos.edad)
    tdee = calcular_tdee(datos.sexo, datos.peso, datos.altura, datos.edad, datos.actividad)
    macros = calcular_macros(tdee, datos.objetivo)
    return {
        "bmr": round(bmr, 2),
        "tdee": round(tdee, 2),
        "calorias_objetivo": macros["calorias_objetivo"],
        "proteinas": round(macros["proteinas_g"], 2),
        "grasas": round(macros["grasas_g"], 2),
        "carbohidratos": round(macros["carbohidratos_g"], 2),
        "porcentajes": macros.get("porcentajes"),
    }

# ---- /plan desde texto libre (tu endpoint antiguo)
class PromptRequest(BaseModel):
    prompt: str

class PorcentajesModel(BaseModel):
    carbohidratos: float
    proteinas: float
    grasas: float

class PlanResponse(BaseModel):
    bmr: float | None
    tdee: float | None
    calorias_objetivo: float | None = None
    proteinas: float | None = None
    grasas: float | None = None
    carbohidratos: float | None = None
    porcentajes: PorcentajesModel | None = None

def _to_float(s: str) -> float:
    return float(s.replace(",", "."))

@app.post("/plan/", response_model=PlanResponse)
def generar_plan(request: PromptRequest):
    prompt = request.prompt.lower()
    try:
        edad = int(re.search(r"(\d+)\s*(años|año)", prompt).group(1))
        peso = _to_float(re.search(r"(\d+(?:[.,]\d+)?)\s*(kg|kilogramos?)", prompt).group(1))
        altura = _to_float(re.search(r"(\d+(?:[.,]\d+)?)\s*(cm|cent[ií]metros?)", prompt).group(1))
        sexo = "mujer" if "mujer" in prompt else "hombre"

        variantes = {
            "muy activo": "muy activo", "muy activa": "muy activo",
            "activo": "activo", "activa": "activo",
            "moderado": "moderado", "moderada": "moderado",
            "ligero": "ligero", "ligera": "ligero",
            "sedentario": "sedentario", "sedentaria": "sedentario",
        }
        actividad_nivel = "sedentario"
        for patron, canonico in variantes.items():
            if patron in prompt:
                actividad_nivel = canonico
                break

        objetivo = "mantenimiento"
        for o in ["superavit", "déficit", "deficit", "mantenimiento"]:
            if o in prompt:
                objetivo = o.replace("déficit", "deficit")
                break

        bmr = calcular_bmr(sexo, peso, altura, edad)
        tdee = calcular_tdee(sexo, peso, altura, edad, actividad_nivel)
        macros = calcular_macros(tdee, objetivo)

        return {
            "bmr": round(bmr, 2),
            "tdee": round(tdee, 2),
            "calorias_objetivo": macros["calorias_objetivo"],
            "proteinas": round(macros["proteinas_g"], 2),
            "grasas": round(macros["grasas_g"], 2),
            "carbohidratos": round(macros["carbohidratos_g"], 2),
            "porcentajes": macros.get("porcentajes"),
        }
    except Exception:
        return {
            "bmr": None, "tdee": None, "calorias_objetivo": None,
            "proteinas": None, "grasas": None, "carbohidratos": None,
            "porcentajes": None,
        }
