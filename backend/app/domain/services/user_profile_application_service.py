from typing import Optional
from uuid import UUID

from app.domain.entities.user_profile import UserProfile
from app.domain.repositories.user_profile_repository import UserProfileRepository


class UserProfileApplicationService:
    """ユーザープロファイルアプリケーションサービス"""

    def __init__(self, user_profile_repository: UserProfileRepository):
        self.user_profile_repository = user_profile_repository

    async def get_or_create_profile(self, user_id: UUID) -> UserProfile:
        """プロフィール取得または作成のユースケース"""
        profile = await self.user_profile_repository.find_by_id(user_id)

        if not profile:
            profile = UserProfile.create_new(user_id)
            profile = await self.user_profile_repository.save(profile)

        return profile

    async def update_profile(
        self,
        user_id: UUID,
        display_name: Optional[str],
        bio: Optional[str],
        avatar_url: Optional[str],
    ) -> UserProfile:
        """プロフィール更新のユースケース"""
        profile = await self.user_profile_repository.find_by_id(user_id)

        if not profile:
            profile = UserProfile.create_new(user_id)

        # ドメインロジックを実行
        profile.update_profile(display_name, bio, avatar_url)

        return await self.user_profile_repository.save(profile)

    async def check_profile_completeness(self, user_id: UUID) -> bool:
        """プロフィール完成度チェックのユースケース"""
        profile = await self.user_profile_repository.find_by_id(user_id)
        return profile.is_complete() if profile else False
