import httpx, os
from dotenv import load_dotenv
load_dotenv()

r = httpx.get(
    "https://openrouter.ai/api/v1/models",
    headers={"Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}"}
)
print(r.json())
