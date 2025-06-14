from typing import List

from fastapi import APIRouter, Depends

from app.api.base import LoggingRoute
from app.auth.utils import get_current_user
from app.connection import get_db
from app.core.error_handlers import handle_api_errors
from app.schemas.contact import Contact, ContactCreate
from app.services.contact import ContactService

# 新しいルーターを作成
router = APIRouter(route_class=LoggingRoute)


def get_contact_service():
    db = next(get_db())
    return ContactService(db)


@router.get("/", response_model=List[Contact])
@handle_api_errors("contact")
async def get_current_user_contacts(
    current_user=Depends(get_current_user),
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    ユーザーの問い合わせ一覧を取得

    Args:
        current_user: 現在のユーザー
        contact_service: 問い合わせサービス

    Returns:
        list[Contact]: 問い合わせ一覧

    Raises:
        HTTPException: 問い合わせ一覧の取得中にエラーが発生した場合
    """

    return contact_service.get_contacts(current_user.user.id)


@router.post("/", response_model=Contact)
@handle_api_errors("contact")
async def create_contact(
    contact_create: ContactCreate,
    current_user=Depends(get_current_user),
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    問い合わせを作成

    Args:
        contact_create: 問い合わせ作成情報
        current_user: 現在のユーザー
        contact_service: 問い合わせサービス

    Returns:
        Contact: 作成された問い合わせ

    Raises:
        HTTPException: 問い合わせの作成中にエラーが発生した場合
    """
    return contact_service.create_contact(contact_create, current_user.user.id)
