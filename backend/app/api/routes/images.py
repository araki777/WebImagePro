from typing import List

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.base import LoggingRoute
from app.auth.utils import get_current_user
from app.connection import get_db
from app.core.error_handlers import handle_api_errors
from app.schemas.ai_vision import VisionRequest, VisionResponse
from app.schemas.image import Image, ImageCreate
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.services.ai_vision import VisionService
from app.services.image import ImageService
from app.services.storage import StorageService
from app.services.translate import TranslateService

router = APIRouter(route_class=LoggingRoute)


def get_image_service():
    db = next(get_db())
    return ImageService(db)


@router.post("/upload", response_model=Image)
@handle_api_errors("image")
async def upload_image(
    file: UploadFile = File(...),
    is_shared: bool = False,
    current_user=Depends(get_current_user),
    storage_service: StorageService = Depends(),
):
    """
    画像をアップロードする

    Args:
        file: アップロードする画像ファイル
        is_shared: 共有モードかどうか
        current_user: 現在のユーザー
        storage_service: ストレージサービス

    Returns:
        blob_name: ブロブ名
        blob_url: ブロブURL

    Raises:
        HTTPException: アップロードに失敗した場合
    """

    result = await storage_service.upload_image(file, is_shared, current_user)
    return {"blob_name": result["blob_name"], "blob_url": result["blob_url"]}


@router.post("/vision-tags", response_model=VisionResponse)
@handle_api_errors("image")
async def get_vision_tags(
    req: VisionRequest,
    _current_user=Depends(get_current_user),
    vision_service: VisionService = Depends(),
):
    """
    画像のタグを抽出する

    Args:
        req: タグ抽出リクエスト
        _current_user: 現在のユーザー
        vision_service: Visionサービス

    Returns:
        tags: タグ

    Raises:
        HTTPException: タグ抽出に失敗した場合
    """

    tags = vision_service.get_tags(req.blob_url)
    return {"tags": tags}


@router.post("/translate", response_model=TranslateResponse)
@handle_api_errors("image")
async def translate_tags(
    req: TranslateRequest,
    _current_user=Depends(get_current_user),
    translate_service: TranslateService = Depends(),
):
    """
    タグを翻訳する

    Args:
        req: 翻訳リクエスト
        _current_user: 現在のユーザー
        translate_service: 翻訳サービス

    Returns:
        translations: 翻訳結果

    Raises:
        HTTPException: 翻訳に失敗した場合
    """

    translations = translate_service.translate(req.tags, req.target_langs)
    return {"translations": translations}


@router.post("/save", response_model=Image)
@handle_api_errors("image")
async def save_image(
    image_create: ImageCreate,
    _current_user=Depends(get_current_user),
    image_service: ImageService = Depends(get_image_service),
):
    """
    画像を保存する

    Args:
        image_create: 画像作成リクエスト
        _current_user: 現在のユーザー
        image_service: 画像サービス

    Returns:
        image: 画像

    Raises:
        HTTPException: 保存に失敗した場合
    """

    image = image_service.save_image(image_create)
    return image


@router.post("/full-upload", response_model=Image)
@handle_api_errors("image")
async def full_upload_image(
    file: UploadFile = File(...),
    is_shared: bool = False,
    target_langs: List[str] = ["ja", "en"],
    current_user=Depends(get_current_user),
    storage_service: StorageService = Depends(),
    vision_service: VisionService = Depends(),
    translate_service: TranslateService = Depends(),
    image_service: ImageService = Depends(get_image_service),
):
    """
    画像をアップロードする

    Args:
        file: アップロードする画像ファイル
        is_shared: 共有モードかどうか
        target_langs: 翻訳対象の言語
        current_user: 現在のユーザー
        storage_service: ストレージサービス
        vision_service: Visionサービス
        translate_service: 翻訳サービス
        image_service: 画像サービス

    Returns:
        image: 画像

    Raises:
        HTTPException: アップロードに失敗した場合
    """

    # 1. 画像アップロード
    result = await storage_service.upload_image(file, is_shared, current_user)
    file_name = result["file_name"]
    blob_name = result["blob_name"]
    blob_url = result["blob_url"]
    container_name = result["container_name"]

    # 2. Vision APIでタグ抽出
    tags = vision_service.get_tags(blob_url)

    # 3. 翻訳APIでタグ翻訳
    translations = translate_service.translate(tags, target_langs)
    ja_tags = translations.get("ja", [])
    en_tags = translations.get("en", [])

    # 4. DB保存
    image_create = ImageCreate(
        file_name=file_name,
        blob_name=blob_name,
        container_name=container_name,
        ja_tags=ja_tags,
        en_tags=en_tags,
    )
    image = image_service.save_image(image_create)
    return image
