from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, delete
from db import get_session
from security import get_current_user
from models import User, Menu
from schemas import MenuIn, MenuOut

router = APIRouter(prefix="/menus", tags=["menus"])

@router.post("", response_model=MenuOut)
def save_menu(
    data: MenuIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    m = Menu(user_id=user.id, plan_id=data.plan_id, json_payload=data.json_payload)
    session.add(m)
    session.commit()
    session.refresh(m)
    return m

@router.get("", response_model=list[MenuOut])
def list_menus(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    q = select(Menu).where(Menu.user_id == user.id).order_by(Menu.id.desc())
    return session.exec(q).all()

@router.delete("/{menu_id}", status_code=204)
def delete_menu(
    menu_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    q = select(Menu).where(Menu.id == menu_id, Menu.user_id == user.id)
    m = session.exec(q).first()
    if not m:
        raise HTTPException(status_code=404, detail="No encontrado")
    session.delete(m)
    session.commit()
    return
