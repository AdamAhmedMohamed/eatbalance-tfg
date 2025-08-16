import requests

# 🔍 Buscar hasta 15 productos por nombre
def buscar_productos(nombre, max_resultados=15):
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    params = {
        "search_terms": nombre,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": max_resultados
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    resultados = response.json().get("products", [])

    alimentos = []
    for producto in resultados:
        alimentos.append({
            "id": producto.get("code", ""),
            "nombre": producto.get("product_name", "Desconocido"),
            "marca": producto.get("brands", "N/A"),
            "nutrientes_por_100g": {
                "calorias": producto.get("nutriments", {}).get("energy-kcal_100g"),
                "proteinas": producto.get("nutriments", {}).get("proteins_100g"),
                "grasas": producto.get("nutriments", {}).get("fat_100g"),
                "carbohidratos": producto.get("nutriments", {}).get("carbohydrates_100g"),
                "azucares": producto.get("nutriments", {}).get("sugars_100g")
            }
        })

    return alimentos

# 🎯 Obtener un producto específico por su code (id)
def obtener_producto_por_id(code):
    url = f"https://world.openfoodfacts.org/api/v0/product/{code}.json"

    response = requests.get(url)
    response.raise_for_status()

    data = response.json()
    producto = data.get("product", {})

    return {
        "nombre": producto.get("product_name", "Desconocido"),
        "marca": producto.get("brands", "N/A"),
        "nutrientes_por_100g": {
            "calorias": producto.get("nutriments", {}).get("energy-kcal_100g"),
            "proteinas": producto.get("nutriments", {}).get("proteins_100g"),
            "grasas": producto.get("nutriments", {}).get("fat_100g"),
            "carbohidratos": producto.get("nutriments", {}).get("carbohydrates_100g"),
            "azucares": producto.get("nutriments", {}).get("sugars_100g")
        }
    }
