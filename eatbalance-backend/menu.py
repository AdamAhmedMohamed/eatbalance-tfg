import random

# Tabla simple con alimentos y sus macros por 100g
ALIMENTOS = [
    {"nombre": "Pechuga de pollo", "proteina": 31, "grasa": 3.6, "carbohidrato": 0},
    {"nombre": "Arroz blanco cocido", "proteina": 2.7, "grasa": 0.3, "carbohidrato": 28},
    {"nombre": "Avena", "proteina": 13, "grasa": 7, "carbohidrato": 68},
    {"nombre": "Huevo", "proteina": 13, "grasa": 11, "carbohidrato": 1},
    {"nombre": "Plátano", "proteina": 1.1, "grasa": 0.3, "carbohidrato": 23},
    {"nombre": "Pan integral", "proteina": 9, "grasa": 4, "carbohidrato": 45},
    {"nombre": "Aceite de oliva", "proteina": 0, "grasa": 100, "carbohidrato": 0},
    {"nombre": "Atún en lata", "proteina": 25, "grasa": 10, "carbohidrato": 0},
]

def generar_menu(proteinas_obj, grasas_obj, carbos_obj):
    comidas = {"desayuno": [], "comida": [], "cena": [], "snacks": []}
    macros_totales = {"proteina": 0, "grasa": 0, "carbohidrato": 0}

    for comida in comidas:
        for _ in range(2):  # 2 alimentos por comida
            alimento = random.choice(ALIMENTOS)
            cantidad = random.randint(50, 200)  # gramos

            macros = {
                "nombre": alimento["nombre"],
                "cantidad_g": cantidad,
                "proteina": round(alimento["proteina"] * cantidad / 100, 1),
                "grasa": round(alimento["grasa"] * cantidad / 100, 1),
                "carbohidrato": round(alimento["carbohidrato"] * cantidad / 100, 1),
            }

            for m in ["proteina", "grasa", "carbohidrato"]:
                macros_totales[m] += macros[m]

            comidas[comida].append(macros)

    return {
        "menu": comidas,
        "totales_aproximados": {k: round(v, 1) for k, v in macros_totales.items()},
        "objetivos": {
            "proteina": proteinas_obj,
            "grasa": grasas_obj,
            "carbohidrato": carbos_obj
        }
    }
