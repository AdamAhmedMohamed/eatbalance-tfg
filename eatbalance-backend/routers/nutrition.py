from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from db import get_session
from models import User, NutritionPlan
from schemas import PlanOut
from security import get_current_user

# tus funciones existentes
from bmr import calcular_bmr
from tdee import calcular_tdee
from macros import calcular_macros

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

class PlanIn(BaseModel):
    sex: str
    age: int
    height_cm: float
    weight_kg: float
    activity_level: str   # sedentario | ligero | moderado | activo | muy activo
    goal: str             # deficit | mantenimiento | superavit

@router.post("/plan/generate", response_model=PlanOut)
def generate_plan(
    data: PlanIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    bmr = calcular_bmr(data.sex, data.weight_kg, data.height_cm, data.age)
    tdee = calcular_tdee(data.sex, data.weight_kg, data.height_cm, data.age, data.activity_level)
    m = calcular_macros(tdee, data.goal)

    plan = NutritionPlan(
        user_id=user.id,
        bmr=float(bmr),
        tdee=float(tdee),
        protein_g=float(m["proteinas_g"]),
        carbs_g=float(m["carbohidratos_g"]),
        fat_g=float(m["grasas_g"]),
    )
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return plan

@router.get("/plans", response_model=list[PlanOut])
def list_plans(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return session.exec(select(NutritionPlan).where(NutritionPlan.user_id == user.id).order_by(NutritionPlan.id.desc())).all()


@router.get("/plans/latest", response_model=PlanOut)
def latest_plan(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    q = select(NutritionPlan).where(NutritionPlan.user_id == user.id) \
                             .order_by(NutritionPlan.id.desc())
    plan = session.exec(q).first()
    if not plan:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No hay planes guardados")
    return plan
