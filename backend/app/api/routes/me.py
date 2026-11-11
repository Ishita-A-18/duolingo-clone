from fastapi import APIRouter
from pydantic import BaseModel

from app.api import serializers as ser
from app.api.deps import DB, CurrentClock, CurrentUser
from app.schemas.user import LeaderboardOut, MeOut, ProfileOut, SettingsIn
from app.services import hearts, leaderboard, rewards, users

router = APIRouter(tags=["learner"])


@router.get("/me", response_model=MeOut, summary="Top-bar stats for the current learner")
def get_me(db: DB, user: CurrentUser, clock: CurrentClock):
    return ser.me_out(users.summary(db, user, clock))


@router.patch("/me", response_model=MeOut, summary="Update settings (name, daily goal, sound)")
def patch_me(body: SettingsIn, db: DB, user: CurrentUser, clock: CurrentClock):
    users.update_settings(
        db, user,
        display_name=body.display_name,
        daily_goal_xp=body.daily_goal_xp,
        sound_enabled=body.sound_enabled,
        timezone=body.timezone,
        animations_enabled=body.animations_enabled,
        motivational_messages=body.motivational_messages,
        listening_enabled=body.listening_enabled,
    )
    return ser.me_out(users.summary(db, user, clock))


class RefillIn(BaseModel):
    free: bool = False  # use the one-time free refill instead of gems


@router.post("/me/hearts/refill", response_model=MeOut, summary="Refill hearts (gems, or the one-time free refill)")
def refill_hearts(db: DB, user: CurrentUser, clock: CurrentClock, body: RefillIn | None = None):
    if body is not None and body.free:
        rewards.refill_hearts_free(db, user, clock.now())
    else:
        hearts.refill_with_gems(user, clock.now())
    db.commit()
    return ser.me_out(users.summary(db, user, clock))


@router.get("/me/profile", response_model=ProfileOut, summary="Profile stats and achievements")
def get_profile(db: DB, user: CurrentUser, clock: CurrentClock):
    return ser.profile_out(users.profile(db, user, clock))


@router.get("/leaderboard", response_model=LeaderboardOut, summary="This week's league standings")
def get_leaderboard(db: DB, user: CurrentUser, clock: CurrentClock):
    league = leaderboard.weekly_league(db, user, clock.today(user.timezone))
    return ser.leaderboard_out(league, user)
