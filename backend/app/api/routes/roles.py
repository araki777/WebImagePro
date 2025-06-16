from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.base import LoggingRoute
from app.auth.utils import get_current_user
from app.connection import get_db
from app.core.error_handlers import handle_api_errors
from app.schemas.role import Role, RoleCreate, RoleUpdate
from app.services.role import RoleService

router = APIRouter(route_class=LoggingRoute)


def get_role_service():
    db = next(get_db())
    return RoleService(db)


@router.get("/", response_model=List[Role])
@handle_api_errors("role", "get")
async def get_roles(role_service: RoleService = Depends(get_role_service)):
    """
    ロールの一覧を取得する

    Args:
        role_service: ロールサービス

    Returns:
        List[Role]: ロールの一覧

    Raises:
        HTTPException: ロールの取得に失敗した場合
    """

    return role_service.get_roles()


@router.post("/", response_model=Role)
@handle_api_errors("role", "create")
async def create_role(
    role_create: RoleCreate,
    _current_user=Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
):
    """
    ロールを作成する

    Args:
        role_create: ロールの作成情報
        _current_user: 現在のユーザー
        role_service: ロールサービス

    Returns:
        Role: 作成されたロール

    Raises:
        HTTPException: ロールの作成に失敗した場合
    """
    # ロールの作成
    role = role_service.create_role(role_create)
    return role


@router.put("/{role_id}", response_model=Role)
@handle_api_errors("role", "update")
async def update_role(
    role_id: UUID,
    role_update: RoleUpdate,
    _current_user=Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
):
    """
    ロールを更新する

    Args:
        role_id: ロールのID
        role_update: ロールの更新情報
        _current_user: 現在のユーザー
        role_service: ロールサービス

    Returns:
        Role: 更新されたロール

    Raises:
        HTTPException: ロールの更新に失敗した場合
    """

    return role_service.update_role(role_id, role_update)
