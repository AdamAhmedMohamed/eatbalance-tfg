def calcular_macros(tdee: float, objetivo: str):
    objetivo = objetivo.lower().strip()

    # Ajuste calórico por objetivo
    ajustes = {
        "deficit": 0.85,        # -15%
        "mantenimiento": 1.0,   # igual
        "superavit": 1.1        # +10%
    }
    if objetivo not in ajustes:
        raise ValueError("Objetivo no válido. Usa: deficit, mantenimiento o superavit")

    kcal_obj = tdee * ajustes[objetivo]

    # Repartos por objetivo (C, P, G)
    splits = {
        "deficit": (0.40, 0.30, 0.30),
        "mantenimiento": (0.50, 0.25, 0.25),
        "superavit": (0.50, 0.25, 0.25),
    }
    c, p, f = splits[objetivo]

    return {
        "calorias_objetivo": round(kcal_obj, 2),
        "carbohidratos_g": round((kcal_obj * c) / 4, 1),
        "proteinas_g": round((kcal_obj * p) / 4, 1),
        "grasas_g": round((kcal_obj * f) / 9, 1),
        "porcentajes": {
            "carbohidratos": c,
            "proteinas": p,
            "grasas": f
        }
    }
