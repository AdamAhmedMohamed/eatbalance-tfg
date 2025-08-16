from bmr import calcular_bmr

def calcular_tdee(sexo: str, peso: float, altura: float, edad: int, actividad: str) -> float:
    actividad = actividad.lower().strip()
    factores = {
        "sedentario": 1.2,
        "ligero": 1.375,
        "moderado": 1.55,
        "activo": 1.725,
        "muy activo": 1.9
    }
    if actividad not in factores:
        raise ValueError("Nivel de actividad no válido. Usa: sedentario, ligero, moderado, activo o muy activo")

    bmr = calcular_bmr(sexo, peso, altura, edad)
    return round(bmr * factores[actividad], 2)
