def calcular_bmr(sexo: str, peso: float, altura: float, edad: int) -> float:
    if sexo.lower() == "hombre":
        return 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad)
    elif sexo.lower() == "mujer":
        return 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * edad)
    else:
        raise ValueError("Sexo no válido: usa 'hombre' o 'mujer'")
