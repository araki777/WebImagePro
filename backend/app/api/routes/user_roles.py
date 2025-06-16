from fastapi import APIRouter, Depends, HTTPException, status

from app.api.base import LoggingRoute
from app.auth.utils import get_current_user
from app.connection import get_db
from app.core.error_handlers import handle_api_errors
from app.core.error_messages import ERROR_MESSAGES
from app.schemas.user_role import UserRole, UserRoleCreate, UserRoleUpdate
from app.services.user_role import UserRoleService

# 新しいルーターを作成
router = APIRouter(route_class=LoggingRoute)


def get_user_role_service():
    db = next(get_db())
    return UserRoleService(db)


@router.get("/me/role", response_model=UserRole)
@handle_api_errors("user_role", "get")
async def get_current_user_role(
    current_user=Depends(get_current_user),
    user_role_service: UserRoleService = Depends(get_user_role_service),
):
    """
    現在のユーザーのロールを取得

    Args:
        current_user: 現在のユーザー
        user_role_service: ユーザーロールサービス

    Returns:
        UserRole: 現在のユーザーのロール

    Raises:
        HTTPException: ロールの取得に失敗した場合
    """

    # ユーザーIDを使用してロールを取得
    role = user_role_service.get_user_role(current_user.user.id)

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ERROR_MESSAGES["user_role"]["get"],
        )

    return role


@router.put("/me/role", response_model=UserRole)
@handle_api_errors("user_role", "update")
async def update_current_user_role(
    role_update: UserRoleUpdate,
    current_user=Depends(get_current_user),
    user_role_service: UserRoleService = Depends(get_user_role_service),
):
    """
    現在のユーザーのロールを更新

    Args:
        role_update: ロールの更新情報
        current_user: 現在のユーザー
        user_role_service: ユーザーロールサービス

    Returns:
        UserRole: 更新されたロール

    Raises:
        HTTPException: ロールの更新に失敗した場合
    """

    # ユーザーIDを使用してロールがあるかチェック
    if not user_role_service.check_user_role_exists(current_user.user.id):
        # ロールが存在しない場合は新規作成
        return user_role_service.create_user_role(
            current_user.user.id,
            UserRoleCreate(role_id=role_update.role_id),
        )

    else:
        # ロールが存在する場合は更新
        return user_role_service.update_user_role(current_user.user.id, role_update)
