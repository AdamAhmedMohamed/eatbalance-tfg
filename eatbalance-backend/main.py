# main.py
from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import asyncio
from routers.plan import router as plan_router
from bmr import calcular_bmr
from tdee import calcular_tdee
from macros import calcular_macros
from menu import generar_menu

from openfoodfacts import buscar_productos, obtener_producto_por_id
from openrouter_client import get_macros_from_openrouter
from ollama_client import consultar_chat_ollama

app = FastAPI()

# ⚠️ Solo para desarrollo. Abre todo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # en producción limita a tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plan_router)

# ---------------- Raíz ----------------
@app.get("/")
def inicio():
    return {"mensaje": "¡EatBalance API funcionando!"}

# ---------------- Modelos básicos ----------------
class DatosUsuario(BaseModel):
    sexo: str
    peso: float  # kg
    altura: float  # cm
    edad: int

class DatosTDEE(BaseModel):
    sexo: str
    peso: float
    altura: float
    edad: int
    actividad: str

class DatosMacros(BaseModel):
    tdee: float
    objetivo: str  # "deficit" | "mantenimiento" | "superavit"

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

# --------- Endpoints utilitarios ---------
@app.post("/bmr")
def obtener_bmr(datos: DatosUsuario):
    try:
        bmr = calcular_bmr(datos.sexo, datos.peso, datos.altura, datos.edad)
        return {"BMR": round(bmr, 2)}
    except ValueError as e:
        return {"error": str(e)}

@app.post("/tdee")
def obtener_tdee(datos: DatosTDEE):
    try:
        tdee = calcular_tdee(datos.sexo, datos.peso, datos.altura, datos.edad, datos.actividad)
        return {"TDEE": tdee}
    except ValueError as e:
        return {"error": str(e)}

@app.post("/macros")
def obtener_macros(datos: DatosMacros):
    try:
        resultado = calcular_macros(datos.tdee, datos.objetivo)
        return resultado
    except ValueError as e:
        return {"error": str(e)}

@app.post("/menu")
def obtener_menu(datos: DatosMenu):
    resultado = generar_menu(
        proteinas_obj=datos.proteinas_g,
        grasas_obj=datos.grasas_g,
        carbos_obj=datos.carbohidratos_g
    )
    return resultado

@app.post("/buscar-alimento")
async def obtener_info_alimento(data: AlimentoInput):
    resultado = await buscar_alimento(data.nombre)
    return resultado

class BusquedaInput(BaseModel):
    nombre: str

@app.post("/buscar-productos")
def buscar_varios(producto: BusquedaInput):
    return buscar_productos(producto.nombre)

@app.get("/macros-alimento")
def obtener_macros_alimento(alimento: str):
    resultado = get_macros_from_openrouter(alimento)
    return {"macros": resultado}

@app.post("/producto-id")
def obtener_producto_id(data: ProductoID):
    return obtener_producto_por_id(data.code)

@app.post("/ollama-chat")
def usar_ollama_como_chat(data: PreguntaOllama):
    respuesta = consultar_chat_ollama(data.nombre, data.macros_por_100g, data.pregunta)
    return {"respuesta": respuesta}





# -------- Cálculo completo vía JSON --------
class DatosCompleto(BaseModel):
    edad: int
    peso: float
    altura: float
    sexo: str         # "hombre" | "mujer"
    actividad: str    # sedentario | ligero | moderado | activo | muy activo
    objetivo: str     # deficit | mantenimiento | superavit

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

# -------- Cálculo desde texto libre (/plan) --------
class PromptRequest(BaseModel):
    prompt: str

class PorcentajesModel(BaseModel):
    carbohidratos: float
    proteinas: float
    grasas: float

class PlanResponse(BaseModel):
    bmr: float
    tdee: float
    calorias_objetivo: float | None = None
    proteinas: float
    grasas: float
    carbohidratos: float
    porcentajes: PorcentajesModel | None = None

def _to_float(s: str) -> float:
    # Acepta "70,5" o "70.5"
    return float(s.replace(",", "."))

@app.post("/plan/", response_model=PlanResponse)
def generar_plan(request: PromptRequest):
    prompt = request.prompt.lower()

    try:
        # 1) Extracción robusta con decimales/comas
        edad = int(re.search(r"(\d+)\s*(años|año)", prompt).group(1))
        peso = _to_float(re.search(r"(\d+(?:[.,]\d+)?)\s*(kg|kilogramos?)", prompt).group(1))
        altura = _to_float(re.search(r"(\d+(?:[.,]\d+)?)\s*(cm|cent[ií]metros?)", prompt).group(1))
        sexo = "mujer" if "mujer" in prompt else "hombre"

        # 2) Normalización de actividad (masc/fem)
        variantes = {
            "muy activo":  "muy activo",   "muy activa":  "muy activo",
            "activo":      "activo",       "activa":      "activo",
            "moderado":    "moderado",     "moderada":    "moderado",
            "ligero":      "ligero",       "ligera":      "ligero",
            "sedentario":  "sedentario",   "sedentaria":  "sedentario",
        }
        actividad_nivel = "sedentario"
        for patron, canonico in variantes.items():
            if patron in prompt:
                actividad_nivel = canonico
                break

        # 3) Objetivo
        objetivo = "mantenimiento"
        for o in ["superavit", "déficit", "deficit", "mantenimiento"]:
            if o in prompt:
                objetivo = o.replace("déficit", "deficit")
                break

        # 4) Cálculos
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

    except Exception as e:
        print("❌ Error al procesar el prompt:", e)
        return {
            "bmr": None,
            "tdee": None,
            "calorias_objetivo": None,
            "proteinas": None,
            "grasas": None,
            "carbohidratos": None,
            "porcentajes": None,
        }
