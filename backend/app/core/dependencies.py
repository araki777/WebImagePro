from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.connection import get_db

# ドメインリポジトリインターフェース
from app.domain.repositories.user_profile_repository import UserProfileRepository
from app.domain.repositories.user_role_repository import UserRoleRepository
from app.domain.repositories.user_setting_repository import UserSettingRepository

# アプリケーションサービス
from app.domain.services.user_profile_application_service import (
    UserProfileApplicationService,
)
from app.domain.services.user_role_application_service import UserRoleApplicationService
from app.domain.services.user_setting_application_service import (
    UserSettingApplicationService,
)

# インフラリポジトリ実装
from app.infrastructure.repositories.sqlalchemy_user_profile_repository import (
    SQLAlchemyUserProfileRepository,
)
from app.infrastructure.repositories.sqlalchemy_user_role_repository import (
    SQLAlchemyUserRoleRepository,
)
from app.infrastructure.repositories.sqlalchemy_user_setting_repository import (
    SQLAlchemyUserSettingRepository,
)


# リポジトリの依存性注入
def get_user_profile_repository(db: Session = Depends(get_db)) -> UserProfileRepository:
    """ユーザープロフィールリポジトリの依存性注入"""
    return SQLAlchemyUserProfileRepository(db)


def get_user_role_repository(db: Session = Depends(get_db)) -> UserRoleRepository:
    """ユーザーロールリポジトリの依存性注入"""
    return SQLAlchemyUserRoleRepository(db)


def get_user_setting_repository(db: Session = Depends(get_db)) -> UserSettingRepository:
    """ユーザー設定リポジトリの依存性注入"""
    return SQLAlchemyUserSettingRepository(db)


# アプリケーションサービスの依存性注入
def get_user_profile_application_service(
    user_profile_repository: UserProfileRepository = Depends(
        get_user_profile_repository
    ),
) -> UserProfileApplicationService:
    """ユーザープロフィールアプリケーションサービスの依存性注入"""
    return UserProfileApplicationService(user_profile_repository)


def get_user_role_application_service(
    user_role_repository: UserRoleRepository = Depends(get_user_role_repository),
) -> UserRoleApplicationService:
    """ユーザーロールアプリケーションサービスの依存性注入"""
    return UserRoleApplicationService(user_role_repository)


def get_user_setting_application_service(
    user_setting_repository: UserSettingRepository = Depends(
        get_user_setting_repository
    ),
) -> UserSettingApplicationService:
    """ユーザー設定アプリケーションサービスの依存性注入"""
    return UserSettingApplicationService(user_setting_repository)


# 型エイリアス
UserProfileRepositoryDep = Annotated[
    UserProfileRepository, Depends(get_user_profile_repository)
]
UserRoleRepositoryDep = Annotated[UserRoleRepository, Depends(get_user_role_repository)]
UserSettingRepositoryDep = Annotated[
    UserSettingRepository, Depends(get_user_setting_repository)
]

UserProfileServiceDep = Annotated[
    UserProfileApplicationService, Depends(get_user_profile_application_service)
]
UserRoleServiceDep = Annotated[
    UserRoleApplicationService, Depends(get_user_role_application_service)
]
UserSettingServiceDep = Annotated[
    UserSettingApplicationService, Depends(get_user_setting_application_service)
]
