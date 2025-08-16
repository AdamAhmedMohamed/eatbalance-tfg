import requests

def consultar_chat_ollama(nombre, macros_100g, pregunta_usuario):
    prompt = f"""
Estoy trabajando con nutrición. Tengo estos datos por 100g del alimento "{nombre}":

- Calorías: {macros_100g.get("calorias", "desconocido")}
- Proteínas: {macros_100g.get("proteinas", "desconocido")}
- Grasas: {macros_100g.get("grasas", "desconocido")}
- Carbohidratos: {macros_100g.get("carbohidratos", "desconocido")}
- Azúcares: {macros_100g.get("azucares", "desconocido")}

El usuario te hará una pregunta basada en gramos (por ejemplo, 60g o 150g).

Haz los cálculos correctamente usando una **regla de tres clara**:

valores por 100g → multiplicas por (gramos / 100)

Luego responde de forma clara, sencilla y práctica. Si puedes, explica también cómo hiciste el cálculo.

Pregunta del usuario:
{pregunta_usuario}
"""

    body = {
        "model": "mistral",  # o el modelo que tengas instalado en Ollama
        "prompt": prompt,
        "stream": False
    }

    response = requests.post("http://localhost:11434/api/generate", json=body)
    response.raise_for_status()

    return response.json()["response"]
