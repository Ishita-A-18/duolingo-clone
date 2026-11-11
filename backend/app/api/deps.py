"""FastAPI dependencies shared by every router."""
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import Clock, load_clock
from app.core.config import settings
from app.core.errors import NotFoundError
from app.db import get_db
from app.models import User

DB = Annotated[Session, Depends(get_db)]


def get_clock(db: DB) -> Clock:
    return load_clock(db)


def get_current_user(db: DB, x_user_id: Annotated[int | None, Header()] = None) -> User:
    """Auth is simplified: the default learner is always "logged in".

    An `X-User-Id` header can switch learners (handy for tests); real auth would
    replace only this function, since every route depends on it.
    """
    if x_user_id is not None:
        user = db.get(User, x_user_id)
    else:
        user = db.scalar(select(User).where(User.username == settings.default_username))
    if user is None:
        raise NotFoundError("Learner not found. Has the database been seeded?")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentClock = Annotated[Clock, Depends(get_clock)]
