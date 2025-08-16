import httpx

BASE_URL = "http://localhost:11434/v1/chat/completions"

HEADERS = {
    "Content-Type": "application/json"
}

def get_macros_from_openrouter(alimento: str) -> str:
    prompt = (
        f"Dime los macronutrientes por cada 100 g de {alimento}. "
        "Responde solo los gramos de proteínas, hidratos de carbono y grasas, en ese orden, separados por coma."
    )

    body = {
        "model": "llama3",  # nombre exacto del modelo que cargaste en Ollama
        "messages": [{"role": "user", "content": prompt}],
        "stream": False
    }

    resp = httpx.post(BASE_URL, json=body, headers=HEADERS, timeout=60)
    print("STATUS:", resp.status_code, "\nBODY:", resp.text)  # solo para debug
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]
