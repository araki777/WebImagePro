from uuid import UUID

from app.domain.entities.user_role import UserRole
from app.domain.repositories.user_role_repository import UserRoleRepository


class UserRoleApplicationService:
    """ユーザーロールアプリケーションサービス"""

    def __init__(self, user_role_repository: UserRoleRepository):
        self.user_role_repository = user_role_repository

    async def get_or_create_user_role(
        self, user_id: UUID, default_role_id: UUID
    ) -> UserRole:
        """ユーザーロール取得または作成のユースケース"""
        user_role = await self.user_role_repository.find_by_id(user_id)

        if not user_role:
            user_role = UserRole.create_default_user_role(user_id, default_role_id)
            user_role = await self.user_role_repository.save(user_role)

        return user_role

    async def update_user_role(self, user_id: UUID, new_role_id: UUID) -> UserRole:
        """ユーザーロール更新のユースケース"""
        user_role = await self.user_role_repository.find_by_id(user_id)

        if not user_role:
            raise ValueError("User role not found")

        # ドメインロジックを実行
        user_role.update_role(new_role_id)

        return await self.user_role_repository.save(user_role)

    async def check_user_has_role(self, user_id: UUID, role_id: UUID) -> bool:
        """ユーザーが指定されたロールを持っているかのチェック"""
        user_role = await self.user_role_repository.find_by_id(user_id)
        return user_role.has_role(role_id) if user_role else False

    async def get_users_by_role(self, role_id: UUID) -> list[UserRole]:
        """指定されたロールを持つユーザー一覧を取得"""
        return await self.user_role_repository.find_by_role_id(role_id)
