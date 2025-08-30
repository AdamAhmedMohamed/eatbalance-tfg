from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ---- Auth / Users
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ---- Profile
class ProfileIn(BaseModel):
    sex: str
    age: int
    height_cm: float
    weight_kg: float
    activity_level: str
    goal: str
    dietary_prefs: Optional[str] = None

class ProfileOut(ProfileIn):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ---- Plan y Menú (respuestas)
# ---- Plan y Menú (respuestas)
class PlanOut(BaseModel):
    id: int
    created_at: datetime          # <- antes str
    bmr: float
    tdee: float
    protein_g: float
    carbs_g: float
    fat_g: float
    model_config = ConfigDict(from_attributes=True)

class MenuOut(BaseModel):
    id: int
    plan_id: Optional[int] = None
    created_at: datetime          # <- antes str
    json_payload: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)

# ---- Recent Searches ----
class RecentSearchIn(BaseModel):
    term: str
    source: str  # "openfoodfacts" | "usda" | "local"

class RecentSearchOut(BaseModel):
    term: str
    source: str
    created_at: datetime        # <-- antes era str
    model_config = ConfigDict(from_attributes=True)

# ---- MenuIn (para crear menús) ----
class MenuIn(BaseModel):
    plan_id: Optional[int] = None
    json_payload: Dict[str, Any]
