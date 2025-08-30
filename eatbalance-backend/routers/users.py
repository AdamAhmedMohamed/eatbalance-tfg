from fastapi import APIRouter, Depends
from sqlmodel import Session, select, delete

from db import get_session
from models import User, UserProfile, RecentSearch
from schemas import UserOut, ProfileIn, ProfileOut, RecentSearchOut, RecentSearchIn
from security import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

@router.get("/preferences", response_model=ProfileOut | None)
def get_prefs(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return session.exec(select(UserProfile).where(UserProfile.user_id == user.id)).first()

@router.put("/preferences", response_model=ProfileOut)
def set_prefs(data: ProfileIn, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    prof = session.exec(select(UserProfile).where(UserProfile.user_id == user.id)).first()
    if prof:
        for k, v in data.model_dump().items():
            setattr(prof, k, v)
    else:
        prof = UserProfile(user_id=user.id, **data.model_dump())
        session.add(prof)
    session.commit()
    session.refresh(prof)
    return prof

# ---- BÚSQUEDAS RECIENTES ----
@router.post("/recent-searches", status_code=204)
def add_recent_search(
    data: RecentSearchIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    rs = RecentSearch(user_id=user.id, term=data.term.strip()[:255], source=data.source)
    session.add(rs)
    session.commit()

    # Mantener solo 25 últimas
    ids = session.exec(
        select(RecentSearch.id)
        .where(RecentSearch.user_id == user.id)
        .order_by(RecentSearch.id.desc())
        .offset(25)
    ).all()
    if ids:
        session.exec(delete(RecentSearch).where(RecentSearch.id.in_(ids)))
        session.commit()
    return

@router.get("/recent-searches", response_model=list[RecentSearchOut])
def list_recent_searches(
    limit: int = 15,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    q = select(RecentSearch).where(RecentSearch.user_id == user.id) \
                            .order_by(RecentSearch.id.desc()) \
                            .limit(limit)
    return session.exec(q).all()

