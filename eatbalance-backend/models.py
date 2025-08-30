from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON

# Usuario
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True

# Perfil del usuario
class UserProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)

    sex: str
    age: int
    height_cm: float
    weight_kg: float
    activity_level: str
    goal: str
    dietary_prefs: Optional[str] = None

# Plan nutricional guardado
class NutritionPlan(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    bmr: float
    tdee: float
    protein_g: float
    carbs_g: float
    fat_g: float

# Menú del día guardado (JSON)
class Menu(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    plan_id: Optional[int] = Field(default=None, foreign_key="nutritionplan.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    json_payload: Dict[str, Any] = Field(sa_column=Column(JSON))


# --- Búsquedas recientes por usuario ---
class RecentSearch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    term: str = Field(index=True)
    source: str  # "openfoodfacts" | "usda" | "local"
    created_at: datetime = Field(default_factory=datetime.utcnow)
