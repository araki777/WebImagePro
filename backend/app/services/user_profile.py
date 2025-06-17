from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user_profile import UserProfile as UserProfileModel
from app.schemas.user_profile import UserProfileCreate, UserProfileUpdate


class UserProfileService:
    def __init__(self, db: Session):
        self.db = db

    def check_user_profile_exists(self, user_id: UUID):
        """ユーザープロファイルが存在するか確認"""
        return self.db.query(UserProfileModel).filter_by(id=user_id).first()

    def create_user_profile(
        self, user_id: UUID, user_profile_create: UserProfileCreate
    ):
        """ユーザープロファイルを作成"""
        user_profile = UserProfileModel(
            id=user_id,
            created_at=datetime.now(UTC),
            **user_profile_create.model_dump(exclude_unset=True),
        )
        self.db.add(user_profile)
        self.db.commit()
        self.db.refresh(user_profile)
        return user_profile

    def get_or_create_user_profile(self, user_id: UUID):
        """ユーザープロファイルを取得または作成"""
        user_profile = self.check_user_profile_exists(user_id)

        if user_profile:
            return user_profile

        user_profile_create = UserProfileCreate(
            display_name=None,
            bio=None,
            avatar_url=None,
        )

        return self.create_user_profile(user_id, user_profile_create)

    def update_user_profile(
        self, user_id: UUID, user_profile_update: UserProfileUpdate
    ):
        """ユーザープロファイルを更新"""
        user_profile = self.check_user_profile_exists(user_id)
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found",
            )
        for key, value in user_profile_update.model_dump(exclude_unset=True).items():
            setattr(user_profile, key, value)
        user_profile.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(user_profile)
        return user_profile
