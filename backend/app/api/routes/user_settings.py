from fastapi import APIRouter, Depends

from app.api.base import LoggingRoute
from app.auth.utils import get_current_user
from app.connection import get_db
from app.core.error_handlers import handle_api_errors
from app.schemas.user_setting import UserSetting, UserSettingCreate, UserSettingUpdate
from app.services.user_setting import UserSettingService

router = APIRouter(route_class=LoggingRoute)


def get_user_setting_service():
    db = next(get_db())
    return UserSettingService(db)


@router.get("/me/setting", response_model=UserSetting)
@handle_api_errors("user_setting", "get")
async def get_current_user_setting(
    current_user=Depends(get_current_user),
    user_setting_service: UserSettingService = Depends(get_user_setting_service),
):
    """
    現在のユーザーの設定を取得

    Args:
        current_user: 現在のユーザー
        user_setting_service: ユーザー設定サービス

    Returns:
        UserSetting: 現在のユーザーの設定

    Raises:
        HTTPException: 設定の取得に失敗した場合
    """

    # ユーザーIDを使用して設定を取得
    setting = user_setting_service.get_or_create_user_setting(current_user.user.id)

    return setting


@router.put("/me/setting", response_model=UserSetting)
@handle_api_errors("user_setting", "update")
async def update_current_user_setting(
    setting_update: UserSettingUpdate,
    current_user=Depends(get_current_user),
    user_setting_service: UserSettingService = Depends(get_user_setting_service),
):
    """
    現在のユーザーの設定を更新

    Args:
        setting_update: 設定の更新情報
        current_user: 現在のユーザー
        user_setting_service: ユーザー設定サービス

    Returns:
        UserSetting: 更新された設定

    Raises:
        HTTPException: 設定の更新に失敗した場合
    """

    # ユーザーIDを使用して設定があるかチェック
    if not user_setting_service.check_user_setting_exists(current_user.user.id):
        # 設定が存在しない場合は新規作成
        return user_setting_service.create_user_setting(
            current_user.user.id,
            UserSettingCreate(
                theme=setting_update.theme,
                language=setting_update.language,
            ),
        )
    else:
        # 設定が存在する場合は更新
        return user_setting_service.update_user_setting(
            current_user.user.id, setting_update
        )
