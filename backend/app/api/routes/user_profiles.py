from fastapi import APIRouter, Depends, HTTPException, status

from app.api.base import LoggingRoute
from app.auth.utils import get_current_user
from app.connection import get_db
from app.core.error_handlers import handle_api_errors
from app.core.error_messages import ERROR_MESSAGES
from app.schemas.user_profile import UserProfile, UserProfileCreate, UserProfileUpdate
from app.services.user_profile import UserProfileService

router = APIRouter(route_class=LoggingRoute)


def get_user_profile_service():
    db = next(get_db())
    return UserProfileService(db)


@router.get("/me/profile", response_model=UserProfile)
@handle_api_errors("user_profile", "get")
async def get_current_user_profile(
    current_user=Depends(get_current_user),
    user_profile_service: UserProfileService = Depends(get_user_profile_service),
):
    """
    現在のユーザーのプロファイルを取得

    Args:
        current_user: 現在のユーザー
        user_profile_service: ユーザープロファイルサービス

    Returns:
        UserProfile: 現在のユーザーのプロファイル

    Raises:
        HTTPException: プロファイルの取得に失敗した場合
    """

    # ユーザーIDを使用してプロファイルを取得
    profile = user_profile_service.get_user_profile(current_user.user.id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ERROR_MESSAGES["user_profile"]["get"],
        )

    return profile


@router.put("/me/profile", response_model=UserProfile)
@handle_api_errors("user_profile", "update")
async def update_current_user_profile(
    profile_update: UserProfileUpdate,
    current_user=Depends(get_current_user),
    user_profile_service: UserProfileService = Depends(get_user_profile_service),
):
    """
    現在のユーザーのプロファイルを更新

    Args:
        profile_update: プロファイルの更新情報
        current_user: 現在のユーザー
        user_profile_service: ユーザープロファイルサービス

    Returns:
        UserProfile: 更新されたプロファイル

    Raises:
        HTTPException: プロファイルの更新に失敗した場合
    """

    # ユーザーIDを使用してプロファイルがあるかチェック
    if not user_profile_service.check_user_profile_exists(current_user.user.id):
        # プロファイルが存在しない場合は新規作成
        return user_profile_service.create_user_profile(
            current_user.user.id,
            UserProfileCreate(
                display_name=profile_update.display_name,
                bio=profile_update.bio,
                avatar_url=profile_update.avatar_url,
            ),
        )

    else:
        # プロファイルが存在する場合は更新
        return user_profile_service.update_user_profile(
            current_user.user.id, profile_update
        )
