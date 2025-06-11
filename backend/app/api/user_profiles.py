import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.utils import get_current_user
from app.connection import get_db
from app.models.user_profile import UserProfile as UserProfileModel
from app.schemas.user_profile import UserProfile, UserProfileUpdate

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me/profile", response_model=UserProfile)
async def get_current_user_profile(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        # ユーザーIDを使用してプロファイルを取得
        profile = (
            db.query(UserProfileModel)
            .filter(UserProfileModel.id == current_user.user.id)
            .first()
        )

        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        return profile
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/me/profile", response_model=UserProfile)
async def update_current_user_profile(
    profile_update: UserProfileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # ユーザーIDを使用してプロファイルを取得
        profile = (
            db.query(UserProfileModel)
            .filter(UserProfileModel.id == current_user.user.id)
            .first()
        )

        if not profile:
            # プロファイルが存在しない場合は新規作成
            profile = UserProfileModel(
                id=current_user.user.id,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
                **profile_update.dict(exclude_unset=True),
            )
            db.add(profile)
        else:
            # 既存のプロファイルを更新
            for key, value in profile_update.dict(exclude_unset=True).items():
                setattr(profile, key, value)
            profile.updated_at = datetime.now(UTC)

        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
